/**
 * AI可読性・先祖返り防止コメント:
 * 【ローポリ飛行機生成と自動飛行ロジック】
 * 外部の3Dモデル（glTF等）を使わず、THREE.ShapeGeometry で機首・主翼・尾翼を形作った
 * 「旅客機のシルエット」をプログラムで描画します。サイズ（S, M, L, Super）でスケール変化。
 * update() 内で、RouteManagerが生成した曲線上を移動させ、到着時に次のルートをランダム選択します。
 */
export class PlaneManager {
    constructor(scene, globeGroup, routeManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.routeManager = routeManager;
        
        this.planes = [];
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);

        // 基本となる旅客機のShape定義
        this.baseGeometry = this._createPlaneGeometry();
        // 光り輝く白黄色のマテリアル
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }); 
    }

    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        // Z軸方向(上方向)に向いたローポリの旅客機シルエットを描く
        // 頂点数を抑えつつ、ゲームのサイバー感に合うエッジの効いた形状
        shape.moveTo(0, 0.4);       // 機首
        shape.lineTo(0.08, 0.2);    // 機首右
        shape.lineTo(0.35, -0.1);   // 右主翼先端
        shape.lineTo(0.1, -0.15);   // 右主翼後端
        shape.lineTo(0.05, -0.4);   // 胴体右後
        shape.lineTo(0.15, -0.45);  // 右尾翼先端
        shape.lineTo(0, -0.5);      // 尾端
        shape.lineTo(-0.15, -0.45); // 左尾翼先端
        shape.lineTo(-0.05, -0.4);  // 胴体左後
        shape.lineTo(-0.1, -0.15);  // 左主翼後端
        shape.lineTo(-0.35, -0.1);  // 左主翼先端
        shape.lineTo(-0.08, 0.2);   // 機首左
        shape.lineTo(0, 0.4);       // 機首へ戻る

        // ShapeGeometryで平面ポリゴンを生成
        const geometry = new THREE.ShapeGeometry(shape);
        // デフォルトではXY平面に作られるため、Z軸が前方を向くように回転（地球の曲面に沿わせるため）
        geometry.rotateX(Math.PI / 2);
        return geometry;
    }

    addPlane(sizeType) {
        // 空路が存在する空港をランダムに探す
        const spawnAirportId = this.routeManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; // ルートが一つもない場合は買えない（UI側で制御しても良い）

        const routeData = this.routeManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        const mesh = new THREE.Mesh(this.baseGeometry, this.planeMaterial);
        
        // サイズ設定
        let scale = 0.05;
        let speed = 0.5; // ベース速度
        if (sizeType === 'small') { scale = 0.04; speed = 0.6; }
        else if (sizeType === 'medium') { scale = 0.06; speed = 0.5; }
        else if (sizeType === 'large') { scale = 0.08; speed = 0.4; }
        else if (sizeType === 'super') { scale = 0.11; speed = 0.3; }

        mesh.scale.set(scale, scale, scale);
        
        // 少し浮かせるため、親グループのオフセット調整などを行わず、
        // 曲線自体の高さを利用する
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
            
            // 距離が長いルートほどprogress(0〜1)の進みを遅くし、一定の速度を保つ
            const speedFactor = plane.baseSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                // 目的地に到着。次のルートをランダムに探す
                const nextAirportId = plane.currentRoute.id;
                const nextRoute = this.routeManager.getRandomRouteFrom(nextAirportId);
                
                if (nextRoute) {
                    plane.currentAirportId = nextAirportId;
                    plane.currentRoute = nextRoute;
                    plane.progress = 0;
                } else {
                    // 行き止まりの場合（基本的に双方向なので発生しないが念のため折り返す）
                    plane.progress = 1.0; 
                }
            } else {
                // --- 曲面上の移動と向きの計算 ---
                // 現在位置の取得
                const position = curve.getPointAt(plane.progress);
                plane.mesh.position.copy(position);

                // 進行方向（接線ベクトル）の取得
                const tangent = curve.getTangentAt(plane.progress).normalize();
                
                // 地球の中心からの法線ベクトル（上方向）
                const up = position.clone().normalize();
                
                // 進行方向と上方向から、飛行機の右方向ベクトルを算出
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                
                // 完全な直交座標系を作り直す（tangentがupと完全直交していない場合があるため）
                const forward = new THREE.Vector3().crossVectors(up, right).normalize();
                
                // THREE.jsのデフォルトの「前」は -Z 方向であることが多いため調整
                // （ShapeGeometryをrotateX(PI/2)したことで、Zのマイナスが前を向く）
                forward.negate(); 

                const matrix = new THREE.Matrix4().makeBasis(right, up, forward);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}

