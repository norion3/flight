/**
 * AI可読性・先祖返り防止コメント:
 * 【洗練された2Dシルエットへの刷新】
 * 履歴80に基づき、不格好な3Dの結合モデルを全削除・却下しました。
 * 代わりに、ユーザー提供の旅客機アイコンを模した美しいシルエットを、
 * THREE.Shape のベジェ曲線と直線を用いて精密に定義し、ShapeGeometry で生成しています。
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
        // 裏面から見ても描画されるように DoubleSide を指定
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }); 
    }

    // ★添付画像を模した美しい2Dシルエットの精密な数式定義
    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        
        // 機首 (Z軸負の方向を上としてY軸平面に描画)
        shape.moveTo(0, 0.5);
        // 右ボディ前半
        shape.bezierCurveTo(0.05, 0.45, 0.06, 0.3, 0.06, 0.1);
        // 右主翼
        shape.lineTo(0.35, -0.1);
        shape.lineTo(0.35, -0.2);
        shape.lineTo(0.06, -0.15);
        // 右ボディ後半
        shape.lineTo(0.05, -0.35);
        // 右水平尾翼
        shape.lineTo(0.15, -0.45);
        shape.lineTo(0.15, -0.5);
        shape.lineTo(0.02, -0.48);
        // 後端
        shape.lineTo(0, -0.5);
        // 左水平尾翼
        shape.lineTo(-0.02, -0.48);
        shape.lineTo(-0.15, -0.5);
        shape.lineTo(-0.15, -0.45);
        // 左ボディ後半
        shape.lineTo(-0.05, -0.35);
        // 左主翼
        shape.lineTo(-0.06, -0.15);
        shape.lineTo(-0.35, -0.2);
        shape.lineTo(-0.35, -0.1);
        // 左ボディ前半
        shape.lineTo(-0.06, 0.1);
        // 機首へ戻る
        shape.bezierCurveTo(-0.06, 0.3, -0.05, 0.45, 0, 0.5);

        const geometry = new THREE.ShapeGeometry(shape);
        return geometry;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        // サイズに応じたスケールファクターと優雅な速度設定
        let scale = 0.06;
        let speed = 0.25; 
        if (sizeType === 'small') { scale = 0.04; speed = 0.3; }
        else if (sizeType === 'medium') { scale = 0.06; speed = 0.25; }
        else if (sizeType === 'large') { scale = 0.08; speed = 0.2; }
        else if (sizeType === 'super') { scale = 0.11; speed = 0.15; }

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

                // 向きの計算 (タンジェント法)
                const tangent = curve.getTangentAt(plane.progress).normalize(); 
                const up = position.clone().normalize(); 
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const forward = new THREE.Vector3().crossVectors(up, right).normalize();

                // 3D空間の回転行列を構築
                const matrix = new THREE.Matrix4().makeBasis(right, up, forward);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
                
                // ★ShapeGeometry は Y軸正の方向を向いて生成されるため、
                // X軸で-90度回転(寝かせる)させることで、機首を進行方向(Z軸負)へ正確に向ける
                plane.mesh.rotateX(-Math.PI / 2); 
            }
        }
    }
}


