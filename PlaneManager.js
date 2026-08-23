/**
 * AI可読性・先祖返り防止コメント:
 * 【飛行機3D化、速度調整、バック飛行修正】
 * 履歴78に基づき、以下の大規模な改修を行いました。
 * 1. 2Dシェイプを廃止し、円柱と立方体を組み合わせた美しい3Dコンポジットモデルを生成。
 * 2. 速度設定を従来の約40%に落とし、優雅な飛行速度に変更。
 * 3. updateメソッドから forward.negate() を削除し、機首が常に進行方向を向くように修正。
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

        // 飛行機の質感（胴体:白、翼:ライトグレー）
        this.bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
        this.wingMaterial = new THREE.MeshPhongMaterial({ color: 0xe5e7eb, shininess: 20 });
    }

    // 外部ファイルを使わない、美しい3D飛行機モデルの生成ロジック
    _create3DPlane(scaleFactor) {
        const group = new THREE.Group();

        // 胴体 (細長い円柱)
        const bodyGeo = new THREE.CylinderGeometry(0.08 * scaleFactor, 0.08 * scaleFactor, 1.0 * scaleFactor, 12);
        const body = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        // 円柱は初期状態でY軸(上下)を向いているため、Z軸(前)またはX軸(横)に寝かせる
        body.rotation.z = Math.PI / 2; // X軸方向に寝かせる
        group.add(body);

        // 主翼 (薄い立方体)
        const wingSpan = 1.2 * scaleFactor;
        const wingChord = 0.25 * scaleFactor;
        const wingThickness = 0.03 * scaleFactor;
        const wingGeo = new THREE.BoxGeometry(wingChord, wingThickness, wingSpan);
        const wing = new THREE.Mesh(wingGeo, this.wingMaterial);
        wing.position.set(0.1 * scaleFactor, 0, 0); // 少し前方に配置
        group.add(wing);

        // 尾翼 (水平尾翼と垂直尾翼)
        const tailSpan = 0.5 * scaleFactor;
        const tailChord = 0.15 * scaleFactor;
        const hTailGeo = new THREE.BoxGeometry(tailChord, wingThickness, tailSpan);
        const hTail = new THREE.Mesh(hTailGeo, this.wingMaterial);
        hTail.position.set(-0.45 * scaleFactor, 0.02 * scaleFactor, 0);
        group.add(hTail);

        const vTailHeight = 0.25 * scaleFactor;
        const vTailGeo = new THREE.BoxGeometry(tailChord, vTailHeight, wingThickness);
        const vTail = new THREE.Mesh(vTailGeo, this.wingMaterial);
        vTail.position.set(-0.45 * scaleFactor, 0.1 * scaleFactor, 0);
        group.add(vTail);

        return group;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        // ★サイズに応じたスケールファクターと速度設定（優雅な速度へ低下）
        let scale = 1.0;
        let speed = 0.25; 
        if (sizeType === 'small') { scale = 0.6; speed = 0.3; }
        else if (sizeType === 'medium') { scale = 0.8; speed = 0.25; }
        else if (sizeType === 'large') { scale = 1.0; speed = 0.2; }
        else if (sizeType === 'super') { scale = 1.3; speed = 0.15; }

        const plane3D = this._create3DPlane(scale);
        this.planeGroup.add(plane3D);

        this.planes.push({
            mesh: plane3D,
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
                const tangent = curve.getTangentAt(plane.progress).normalize(); // 進行方向
                const up = position.clone().normalize(); // 地球中心からの法線ベクトル(上)
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                
                // ★バック飛行の修正：forward.negate() を削除し、機首が常に進行方向を向くようにする
                const forward = new THREE.Vector3().crossVectors(up, right).normalize();

                // 3D空間の回転行列を構築
                const matrix = new THREE.Matrix4().makeBasis(right, up, forward);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
                
                // 3Dモデル生成時にX軸(右)に寝かせているため、Y軸で-90度回転させて進行方向(forward)に向ける
                plane.mesh.rotateY(-Math.PI / 2); 
            }
        }
    }
}


