/**
 * AI可読性・先祖返り防止コメント:
 * 【バック飛行解消 ＆ 高級感のあるシルエット化】
 * 履歴82に基づき、回転軸の計算ミスを makeBasis(right, forward, up) で論理的に解決し、
 * 機首が常に進行方向を向くように修正しました（余分な rotateX 等は削除）。
 * また、ペラペラの Shape を ExtrudeGeometry で極薄の立体アイコンに進化させ、
 * MeshPhongMaterial で美しい光の反射（面取り）を持たせて視認性を劇的に向上させています。
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
        
        // ★視認性と高級感向上のため、光沢のあるマテリアルに変更
        this.planeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf8fafc, // 明るく清潔感のある白(Slate 50)
            shininess: 90,   // 金属的な艶
            specular: 0x888888,
            side: THREE.DoubleSide
        }); 
    }

    // 洗練されたシルエットに「極薄の厚み」と「エッジの面取り」を加える
    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        
        // 機首 (Y軸正の方向)
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

        // ★ExtrudeGeometry で上質な立体アイコン化
        const extrudeSettings = {
            depth: 0.015,         // 極薄の厚み
            bevelEnabled: true,   // 面取り（エッジの丸み）を有効化
            bevelSegments: 3,     // 丸みの滑らかさ
            steps: 1,
            bevelSize: 0.01,      // 面取りの幅
            bevelThickness: 0.01  // 面取りの厚み
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // 回転の軸を正確にするため、ジオメトリの中心を原点に自動調整する
        geometry.center();
        
        return geometry;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        // 厚みと面取りが増えた分、スケールを微調整し優雅な速度を設定
        let scale = 0.06;
        let speed = 0.25; 
        if (sizeType === 'small') { scale = 0.05; speed = 0.3; }
        else if (sizeType === 'medium') { scale = 0.07; speed = 0.25; }
        else if (sizeType === 'large') { scale = 0.09; speed = 0.2; }
        else if (sizeType === 'super') { scale = 0.12; speed = 0.15; }

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

                // ★バック飛行の完全解決：数学的な姿勢制御
                // タンジェント(進行方向)と法線(地球の中心からの上向き)を用いて、正確な3D軸を計算する
                const tangent = curve.getTangentAt(plane.progress).normalize(); // 進行方向
                const up = position.clone().normalize(); // 背中方向 (地球の外側)
                
                // tangent と up から、進行方向に対して垂直な「右翼」方向のベクトルを作る
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                // さらに、up と right から、真の進行方向 (forward) を作り直す
                const forward = new THREE.Vector3().crossVectors(up, right).normalize();

                // 飛行機モデルのローカル軸とワールド軸のマッピング：
                // xAxis (ローカル+X) ＝ right   （右翼）
                // yAxis (ローカル+Y) ＝ forward （機首）
                // zAxis (ローカル+Z) ＝ up      （背中/押し出し方向）
                const matrix = new THREE.Matrix4().makeBasis(right, forward, up);
                
                // これにより、余分な rotateX や rotateY 無しで、完璧に地球に沿って前を向く
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}


