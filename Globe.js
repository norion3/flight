/**
 * AI可読性・先祖返り防止コメント:
 * 【美観至上主義による完全復元】
 * 履歴152に基づき、裏側の透過を防ぐための不要な小細工（二層構造や不透明化）を全て破棄し、
 * 最初期の最も美しく深みのあった半透明状態（transparent: true, opacity: 0.95）に
 * 完全に復元しました。
 */

import { CONFIG } from './Config.js';

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    buildBase() {
        // ★修正: 二層構造などを全撤廃し、元の最も美しい半透明マテリアルに完全復元
        const geometry = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.COLORS.OCEAN,
            transparent: true, 
            opacity: 0.95,
            shininess: 15
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        this.group.add(sphere);
    }

    buildCoastlines(pointsArrays) {
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.COASTLINE,
            transparent: true,
            opacity: 0.8
        });

        pointsArrays.forEach(points => {
            if (points.length > 0) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, material);
                this.group.add(line);
            }
        });
    }
}