/**
 * AI可読性・先祖返り防止コメント:
 * 【透過バグ解消とカラー統一の実施】
 * 履歴104に基づき、飛行機の色をメニューアイコンと同じエメラルドグリーン(0x34d399)に変更し、
 * 不透明（transparent: false）に設定しました。
 * これにより、3D空間特有の「半透明同士のZソートバグ」が解消され、
 * 飛行機が空路の線の下に潜り込む（透ける）煩わしい現象が完全に消滅しました。
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class PlaneManager {
    constructor(scene, globeGroup, networkManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.networkManager = networkManager;
        
        this.planes = [];
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);

        this.baseGeometry = this._createPlaneGeometry();
        
        // ★修正: メニューと統一したエメラルドグリーン。不透明にしてZソートバグを回避。
        this.planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x34d399,      
            transparent: false,
            side: THREE.DoubleSide
        }); 
    }

    // 洗練されたシルエットの定義（厚みのない完全2D Shape）
    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        
        // 機首 (Y軸正の方向)
        shape.moveTo(0, 0.5);
        shape.bezierCurveTo(0.05, 0.45, 0.06, 0.3, 0.06, 0.1);
        shape.lineTo(0.35, -0.1);
        shape.lineTo(0.35, -0.2);
        shape.lineTo(0.06, -0.15);
        shape.lineTo(0.05, -0.35);
        shape.lineTo(0.15, -0.45);
        shape.lineTo(0.15, -0.5);
        shape.lineTo(0.02, -0.48);
        shape.lineTo(0, -0.5);
        shape.lineTo(-0.02, -0.48);
        shape.lineTo(-0.15, -0.5);
        shape.lineTo(-0.15, -0.45);
        shape.lineTo(-0.05, -0.35);
        shape.lineTo(-0.06, -0.15);
        shape.lineTo(-0.35, -0.2);
        shape.lineTo(-0.35, -0.1);
        shape.lineTo(-0.06, 0.1);
        shape.bezierCurveTo(-0.06, 0.3, -0.05, 0.45, 0, 0.5);

        const geometry = new THREE.ShapeGeometry(shape);
        geometry.center();
        
        return geometry;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        // 速度は優雅さとゲームバランスを考慮した平準化
        let scale = 0.06;
        let speed = 0.20; 
        if (sizeType === 'small') { scale = 0.04; speed = 0.20; }
        else if (sizeType === 'medium') { scale = 0.06; speed = 0.18; }
        else if (sizeType === 'large') { scale = 0.08; speed = 0.16; }
        else if (sizeType === 'super') { scale = 0.11; speed = 0.14; }

        const mesh = new THREE.Mesh(this.baseGeometry, this.planeMaterial);
        mesh.scale.set(scale, scale, scale);
        
        this.planeGroup.add(mesh);

        this.planes.push({
            mesh: mesh,
            currentAirportId: spawnAirportId,
            currentRoute: routeData,
            progress: 0,
            baseSpeed: speed
        });

        return true;
    }

    update(delta) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            if (!plane.currentRoute) continue;

            const curve = plane.currentRoute.curve;
            const length = plane.currentRoute.length;
            
            const speedFactor = plane.baseSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                const nextAirportId = plane.currentRoute.id;
                const nextRoute = this.networkManager.getRandomRouteFrom(nextAirportId);
                
                if (nextRoute) {
                    plane.currentAirportId = nextAirportId;
                    plane.currentRoute = nextRoute;
                    plane.progress = 0;
                } else {
                    plane.progress = 1.0; 
                }
            } else {
                const position = curve.getPointAt(plane.progress);
                plane.mesh.position.copy(position);

                const tangent = curve.getTangentAt(plane.progress).normalize(); 
                const up = position.clone().normalize(); 
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

                const matrix = new THREE.Matrix4().makeBasis(right, tangent, up);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}


