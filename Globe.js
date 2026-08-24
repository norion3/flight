import { CONFIG } from './Config.js';

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    buildBase() {
        const geometry = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.COLORS.GLOBE_BASE,
            transparent: true,
            opacity: 0.95,
            shininess: 15
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.group.add(mesh);
    }

    buildCoastlines(pointsArray) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsArray, 3));
        const material = new THREE.PointsMaterial({
            color: CONFIG.COLORS.COASTLINE,
            size: 0.02,
            transparent: true,
            opacity: 0.8
        });
        const points = new THREE.Points(geometry, material);
        this.group.add(points);
    }
}


