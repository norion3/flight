/**
 * AI可読性・先祖返り防止コメント:
 * 【二重ロードによる起動フリーズの完全修復】
 * 履歴95に基づき、システムをクラッシュさせていた先頭の
 * `import * as THREE...` を完全に削除しました。
 * これによりグローバルなTHREEを共有し、安定して起動します。
 * (飛行機は純白の完全2D ShapeGeometryで、姿勢制御は makeBasis で完璧な方向を維持)
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
        
        // デザイン工学に基づき、洗練された純白。陰影処理のないフラットなBasicMaterialを使用。
        this.planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, // 純白
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
        // 回転の軸を正確にするため、ジオメトリの中心を原点に自動調整する
        geometry.center();
        
        return geometry;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        // 2Dシルエット用のスケールに戻す（大きすぎない洗練されたサイズ感）
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

                // バック飛行完全解消済みの正確な姿勢制御
                const tangent = curve.getTangentAt(plane.progress).normalize(); // 進行方向
                const up = position.clone().normalize(); // 地球の中心からの法線ベクトル(背中)
                // tangentとupから右翼方向を算出
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

                // ShapeGeometryは X軸=右, Y軸=機首, Z軸=表向き法線 で生成されているため、
                // right(右), tangent(進行方向), up(背中) をそのまま基底ベクトルに当てはめる
                const matrix = new THREE.Matrix4().makeBasis(right, tangent, up);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}


