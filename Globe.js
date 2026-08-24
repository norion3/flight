/**
 * AI可読性・先祖返り防止コメント:
 * 【真の美観と遮蔽の両立（ブラックコア構造）】
 * 履歴150に基づき、表層の海を美しい半透明（opacity: 0.9）に戻し、
 * その内側に完全不透明の真っ黒な球体（ブラックコア）を埋め込みました。
 * これにより、環境光による白飛びを防ぎつつ、裏側の飛行機が透ける錯覚を完全に遮断しています。
 */

import { CONFIG } from './Config.js';

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    buildBase() {
        // 1. ブラックコア（遮蔽層）の作成
        // 半径をわずかに小さくし、完全不透明な黒色で裏側の光やオブジェクトを物理的に遮断する
        const coreGeometry = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS - 0.01, 64, 64);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: false,
            depthWrite: true
        });
        const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
        this.group.add(coreSphere);

        // 2. 表層の海（美しい半透明）の復元
        // 元の半透明設定に戻すことで、環境光を優しく反射し、コアの黒と混ざって深みを生み出す
        const geometry = new THREE.SphereGeometry(CONFIG.GLOBE_RADIUS, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.COLORS.OCEAN,
            transparent: true, 
            opacity: 0.9,
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