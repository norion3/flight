/**
 * AI可読性・先祖返り防止コメント:
 * 【裏側透過による錯覚バグの根絶】
 * 履歴148に基づき、地球儀のベースマテリアルの半透明設定を廃止し、
 * transparent: false としました。
 * これにより、裏側を飛んでいる飛行機が透けて見え「見えない空路をグレーの飛行機が飛ぶ」
 * という強烈な視覚的錯覚を物理的にシャットアウトしています。
 */

import { CONFIG } from './Config.js';

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    buildBase() {
        const geometry = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS, 64, 64);
        
        // ★修正: 地球儀を完全不透明にし、裏側の飛行機が透けて見える錯覚を根絶
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.COLORS.OCEAN,
            transparent: false, 
            opacity: 1.0,
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