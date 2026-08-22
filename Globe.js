import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

/**
 * AI可読性・先祖返り防止コメント:
 * Three.js 上での3D地球儀描画クラス。
 * 超高密度化したポイント群（THREE.Points）を、緻密かつ繊細な線として表現するためサイズと透過度を最適化しています。
 */
export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    buildBase() {
        // 漆黒のベース球体
        const baseGeo = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS - 0.02, 64, 64);
        const baseMat = new THREE.MeshPhongMaterial({ color: CONFIG.COLORS.GLOBE_BASE, shininess: 5 });
        const baseSphere = new THREE.Mesh(baseGeo, baseMat);
        this.group.add(baseSphere);

        // 大気層
        const atmosGeo = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS + 0.15, 64, 64);
        const atmosMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.ATMOSPHERE, side: THREE.BackSide, transparent: true, opacity: 0.12
        });
        const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
        this.group.add(atmosphere);

        this._buildGrid();
        this._buildStars();
    }

    buildCoastlines(pointsArray) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pointsArray, 3));
        
        // 高密度化に合わせ、ポイントサイズを 0.015 に微調整して滑らかな光の輪郭線を実現
        const mat = new THREE.PointsMaterial({
            color: CONFIG.COLORS.COASTLINE,
            size: 0.015,
            transparent: true,
            opacity: 0.92
        });
        const points = new THREE.Points(geo, mat);
        this.group.add(points);
    }

    _buildGrid() {
        const gridPositions = [];
        for (let lat = -80; lat <= 80; lat += 10) {
            for (let lon = -180; lon <= 180; lon += 2) {
                const pos = Utils.latLonToVector3(lat, lon, CONFIG.GLOBE_RADIUS - 0.005);
                gridPositions.push(pos.x, pos.y, pos.z);
            }
        }
        for (let lon = -180; lon <= 180; lon += 15) {
            for (let lat = -80; lat <= 80; lat += 2) {
                const pos = Utils.latLonToVector3(lat, lon, CONFIG.GLOBE_RADIUS - 0.005);
                gridPositions.push(pos.x, pos.y, pos.z);
            }
        }
        const gridGeo = new THREE.BufferGeometry();
        gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
        const gridMat = new THREE.PointsMaterial({
            color: CONFIG.COLORS.GRID, size: 0.015, transparent: true, opacity: 0.4
        });
        this.group.add(new THREE.Points(gridGeo, gridMat));
    }

    _buildStars() {
        const count = 1200;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 200;
            starPos[i + 1] = (Math.random() - 0.5) * 200;
            starPos[i + 2] = (Math.random() - 0.5) * 200;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            color: CONFIG.COLORS.STARS, size: 0.06, transparent: true, opacity: 0.4
        });
        this.scene.add(new THREE.Points(starGeo, starMat));
    }

    focusJapan() {
        this.group.rotation.y = -Math.PI * 0.75;
        this.group.rotation.x = 0.2;
    }
}

