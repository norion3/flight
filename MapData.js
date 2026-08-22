import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class MapData {
    constructor() {
        this.coastlinePoints = [];
    }

    async loadData() {
        try {
            const response = await fetch(CONFIG.MAP_DATA_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            const topology = await response.json();
            this._parseTopology(topology);
            return true;
        } catch (error) {
            console.error("Failed to load map data:", error);
            return false;
        }
    }

    _parseTopology(topology) {
        const coastlines = topojson.mesh(topology, topology.objects.countries, (a, b) => a === b);
        
        const resolution = 0.005;
        const MIN_VERTEX_DISTANCE = 0.035; 
        const MIN_ISLAND_LENGTH = 0.18; 

        coastlines.coordinates.forEach(line => {
            let lineLength = 0;
            const points3D = [];

            for (let i = 0; i < line.length; i++) {
                const p = Utils.latLonToVector3(line[i][1], line[i][0], CONFIG.GLOBE_RADIUS + 0.01);
                if (i > 0) {
                    lineLength += p.distanceTo(points3D[points3D.length - 1]);
                }
                points3D.push(p);
            }

            if (lineLength < MIN_ISLAND_LENGTH) return;

            const simplifiedPoints = [points3D[0]];
            for (let i = 1; i < points3D.length; i++) {
                const lastP = simplifiedPoints[simplifiedPoints.length - 1];
                if (points3D[i].distanceTo(lastP) > MIN_VERTEX_DISTANCE || i === points3D.length - 1) {
                    simplifiedPoints.push(points3D[i]);
                }
            }

            for (let i = 0; i < simplifiedPoints.length - 1; i++) {
                const v1 = simplifiedPoints[i];
                const v2 = simplifiedPoints[i + 1];
                const dist = v1.distanceTo(v2);
                
                const steps = Math.max(Math.ceil(dist / resolution), 1);
                
                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const p = new THREE.Vector3().copy(v1).lerp(v2, t).normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.01);
                    this.coastlinePoints.push(p.x, p.y, p.z);
                }
            }
        });
    }
}


