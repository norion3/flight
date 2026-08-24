/**
 * AI可読性・先祖返り防止コメント:
 * 【機体ロスト回避とフェールセーフ（ステルス待機）の実装】
 * 履歴141に基づき、空路が削除された際に、飛んでいた飛行機をロストさせずに
 * 即座に別の空港へ再配置（ワープ）させる checkAndReassignPlanes を追加しました。
 * 全ての空路が消えた際は非表示で待機し、新設時に wakeUpPlanes で復活する安全設計です。
 */

export class PlaneManager {
    constructor(scene, globeGroup, networkManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.networkManager = networkManager;
        
        this.planes = [];
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);

        this.baseGeometry = this._createPlaneGeometry();
        
        this.planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x34d399,      
            transparent: false,
            side: THREE.DoubleSide
        }); 
    }

    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        
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

        let scale = 0.08;
        let speed = 0.20; 
        if (sizeType === 'small') { scale = 0.06; speed = 0.20; }
        else if (sizeType === 'medium') { scale = 0.08; speed = 0.18; }
        else if (sizeType === 'large') { scale = 0.10; speed = 0.16; }
        else if (sizeType === 'super') { scale = 0.12; speed = 0.14; }

        const mesh = new THREE.Mesh(this.baseGeometry, this.planeMaterial);
        mesh.scale.set(scale, scale, scale);
        
        this.planeGroup.add(mesh);

        this.planes.push({
            mesh: mesh,
            currentAirportId: spawnAirportId,
            currentRoute: routeData,
            progress: 0,
            baseSpeed: speed,
            originalScale: scale 
        });

        return true;
    }

    // ★追加: 空路削除時に呼ばれ、飛ぶ場所を失った飛行機を再配置する
    checkAndReassignPlanes() {
        this.planes.forEach(plane => {
            if (!plane.currentRoute) {
                this._reassignPlane(plane);
                return;
            }

            // 現在飛んでいる空路が、ネットワーク上にまだ存在するか確認
            const currentFromId = plane.currentAirportId;
            const currentToId = plane.currentRoute.id;
            
            const routesFromHere = this.networkManager.network[currentFromId];
            let routeStillExists = false;
            
            if (routesFromHere) {
                routeStillExists = routesFromHere.some(r => r.id === currentToId);
            }

            // 飛んでいる空路が消されていたら、即座にワープ再配置
            if (!routeStillExists) {
                this._reassignPlane(plane);
            }
        });
    }

    // ★追加: 飛行機を別の有効な空路へワープさせる（空路ゼロならステルス待機）
    _reassignPlane(plane) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) {
            // 世界に空路が1本もない場合：エラーを防ぐため非表示(ステルス待機)にする
            plane.mesh.visible = false;
            plane.currentAirportId = null;
            plane.currentRoute = null;
            plane.progress = 0;
            return;
        }

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (routeData) {
            plane.mesh.visible = true; // 復活
            plane.currentAirportId = spawnAirportId;
            plane.currentRoute = routeData;
            plane.progress = 0;
        }
    }

    // ★追加: 新たに空路が開拓された際に、ステルス待機中の飛行機を戦線復帰させる
    wakeUpPlanes() {
        this.planes.forEach(plane => {
            if (!plane.mesh.visible) {
                this._reassignPlane(plane);
            }
        });
    }

    updateScale(camera) {
        this.planes.forEach(plane => {
            // ステルス待機中は処理スキップ
            if (!plane.mesh.visible) return;

            const pos = new THREE.Vector3();
            plane.mesh.getWorldPosition(pos);
            const distance = camera.position.distanceTo(pos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 1.8)); 
            
            const finalScale = plane.originalScale * baseScale;
            plane.mesh.scale.set(finalScale, finalScale, finalScale);
        });
    }

    update(delta) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            // ★修正: 空路がなくステルス待機中（null）の場合は更新処理をスキップ
            if (!plane.currentRoute || !plane.mesh.visible) continue;

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
                const tangent = curve.getTangentAt(plane.progress).normalize(); 
                const up = position.clone().normalize(); 
                
                const offsetPosition = position.clone().add(up.clone().multiplyScalar(0.005));
                plane.mesh.position.copy(offsetPosition);

                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

                const matrix = new THREE.Matrix4().makeBasis(right, tangent, up);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}