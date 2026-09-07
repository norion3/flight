/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（ビジュアル洗練・黄金比率・整流化版）】
 * 1. 【全体スケール拡大】太平洋の航路安全マージンを保ちつつ、scaleFactor を 0.114 ➔ 0.140（約1.23倍）へ拡大。堂々たる第7大陸のスケールを確立。
 * 2. 【不要ワイヤー線の根絶】EdgesGeometry に閾値角度（thresholdAngle: 28°）を指定し、平面ポリゴンの斜め分割ワイヤー線を100%消去。
 * 3. 【海岸線のスプライン平滑化】Catmull-Rom スプライン曲線補間（SplineCurve）を導入し、岬や湾入の角張ったカクつきを自然界の流麗な海岸線へ整流化。
 * 4. 【内陸島の黄金調和】マダガスカル島のスケールを 0.098 ➔ 0.138（約1.41倍）へ拡大し、外周リング・内海・中央聖地の黄金比率（4:3:3）を完成。
 * 5. 【完全球面追従＆半透明クリスタル調】地球半径 R=5.0 への球面射影（_projectGeometryToSphere）および半透明マテリアル設定は完全保持。
 * 6. 0〜21段階の浮上ロジック、デバッグ用ループ関数（stepStageDebug）は完全保持。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class MuContinentManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        
        // ムー大陸全体の3Dグループ
        this.muGroup = new THREE.Group();
        this.globeGroup.add(this.muGroup);

        // 配置座標：南太平洋の広大な空白域（南緯 22.5度, 西経 112.5度）
        this.centerLat = -22.5;
        this.centerLon = -112.5;

        // 現在の浮上段階（0〜21）
        this.currentStage = 0;
        this.maxStage = 21;

        // 大陸の基本メッシュ＆海岸線ポイント
        this.landMesh = null;
        this.coastlinePoints = null;
        this.materials = [];

        this._buildContinentGeometry();
        this.setStage(0); // 初期状態は水没（Lv 0）
    }

    /**
     * オーストラリア本土の実在リアル地理データに基づく高精細海岸線
     * 90度時計回り回転 ＆ 拡大（scaleFactor: 0.140） ＆ スプライン平滑化
     */
    _getRotatedAustraliaPoints() {
        const realAussiePoints = [
            // ヨーク岬半島先端〜カーペンタリア湾東岸
            [9.0, 14.8], [8.0, 12.5], [8.2, 10.5], [6.5, 8.5], [5.0, 8.0],
            // カーペンタリア湾奥〜西岸〜アーネムランド
            [2.5, 9.8], [0.8, 12.0], [-0.5, 14.0], [-1.8, 13.5], [-2.7, 13.1],
            // ダーウィン〜ジョセフ・ボナパルト湾〜キンバリー
            [-4.2, 11.2], [-5.0, 10.7], [-6.5, 11.2], [-7.5, 11.5], [-9.5, 9.8],
            // キンバリー西岸〜ブルーム〜80マイルビーチ
            [-11.2, 8.0], [-12.0, 6.0], [-13.5, 5.5], [-15.0, 5.2],
            // ポートヘッドランド〜ダンピア〜ノースウェストケープ
            [-17.0, 4.7], [-18.5, 4.2], [-19.4, 3.7], [-19.8, 1.8],
            // シャーク湾（豪州最西端）〜ジェラルトン
            [-20.4, -0.5], [-19.8, -1.8], [-19.3, -2.2], [-18.9, -3.3], [-18.5, -5.0],
            // パース〜ケープ・ルーウィン（南西端）
            [-17.8, -6.5], [-18.0, -7.8], [-18.4, -8.9],
            // アルバニー〜エスペランス（南岸西部）
            [-17.2, -9.4], [-15.6, -9.5], [-13.5, -9.0], [-11.6, -8.4],
            // 大オーストラリア湾の雄大な大円弧
            [-8.5, -6.5], [-6.5, -6.2], [-4.5, -6.2], [-2.0, -6.3], [0.2, -6.6],
            // エアー半島〜スペンサー湾〜ヨーク半島
            [1.8, -8.0], [2.4, -9.2], [3.2, -8.2], [4.3, -7.0], [3.8, -8.8], [3.4, -9.8],
            // アデレード〜エンカウンター湾〜ポートランド
            [5.0, -9.4], [6.3, -11.0], [7.2, -12.0], [8.1, -12.8],
            // ポートフィリップ湾（メルボルン）〜ウィルソンズ・プロモントリー（本土最南端）
            [9.8, -13.0], [11.4, -12.5], [12.9, -13.6], [14.5, -12.8],
            // ケープ・ハウ（南東端）〜シドニー〜ニューカッスル
            [16.5, -12.0], [17.2, -10.0], [17.7, -8.4], [18.3, -7.4],
            // バイロン岬（本土最東端）〜ブリスベン〜モートン湾
            [19.4, -5.9], [20.1, -3.1], [19.6, -1.9], [19.4, 0.2],
            // グレート・バリア・リーフ沿岸〜グラッドストン〜マッカイ
            [17.8, 1.7], [16.5, 3.2], [15.7, 4.4], [14.2, 5.5],
            // タウンズビル〜ケアンズ〜クックタウン
            [13.3, 6.2], [12.3, 8.6], [11.8, 10.0], [11.0, 11.3],
            // プリンセス・シャーロット湾〜ヨーク岬東岸
            [9.7, 13.5], [9.2, 14.2]
        ];

        // 90度時計回り回転 (x' = dy * s, y' = -dx * s) および拡大スケール (0.140)
        const scaleFactor = 0.140;
        const rotatedPoints = realAussiePoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });

        // スプライン曲線（Catmull-Rom スムージング）でトゲやカクつきを流麗な海岸線へ補間
        const closedPoints = [...rotatedPoints, rotatedPoints[0]];
        const spline = new THREE.SplineCurve(closedPoints);
        return spline.getPoints(rotatedPoints.length * 3);
    }

    /**
     * マダガスカル島リアルデータに基づく古代赤土荒野台地
     * 拡大（madaScale: 0.138） ＆ スプライン平滑化
     */
    _getInnerPlateauPoints() {
        const realMadagascarPoints = [
            // 北端アンブル岬〜アンツィラナナ
            [2.3, 7.0], [2.3, 6.7], [2.6, 5.5],
            // 東岸北部〜アントンギル湾〜マソアラ半島
            [2.8, 4.2], [2.5, 3.5], [3.3, 3.1], [3.0, 2.4],
            // 東岸中央〜トアマシナ〜マハノロ
            [2.6, 2.0], [2.4, 0.9], [2.1, 0.0], [1.8, -0.9],
            // 東岸南部〜マナカラ〜ファラファンガナ
            [1.5, -2.0], [1.0, -3.1], [0.8, -3.8], [0.5, -5.0],
            // 南東端トラニャロ〜南端サントマリー岬
            [0.0, -6.0], [-1.0, -6.5], [-1.9, -6.6],
            // 南西岸アンドロカ〜トゥリアラ
            [-2.7, -6.0], [-3.1, -5.2], [-3.3, -4.3], [-3.5, -3.5],
            // 西岸中央〜モロンベ〜モロンダバ
            [-3.7, -2.7], [-3.2, -1.8], [-2.7, -1.3], [-2.8, 0.0],
            // 西岸北部〜マインティラーノ〜ベジバオ岬
            [-3.0, 1.0], [-2.8, 2.0], [-2.5, 3.0],
            // ボンベトカ湾（マハジャンガ）〜北西岸入江群
            [-1.8, 3.2], [-0.7, 3.3], [0.0, 3.8], [0.7, 4.4],
            // ノシベ島対岸〜北端への回帰
            [1.4, 5.5], [1.6, 5.7], [2.1, 6.8]
        ];

        // 拡大スケール（0.138）と内海中央への配置オフセット
        const madaScale = 0.138;
        const plateauPoints = realMadagascarPoints.map(([dx, dy]) => {
            const rotX = (dy * madaScale) + 0.05;
            const rotY = (-dx * madaScale) - 0.02;
            return new THREE.Vector2(rotX, rotY);
        });

        // スプライン補間で台地の輪郭を滑らかに整流化
        const closedPoints = [...plateauPoints, plateauPoints[0]];
        const spline = new THREE.SplineCurve(closedPoints);
        return spline.getPoints(plateauPoints.length * 3);
    }

    /**
     * 平面押し出しジオメトリの全頂点を地球儀の球面に沿って射影・湾曲させる
     */
    _projectGeometryToSphere(geometry, altitudeOffset = 0) {
        const R = CONFIG.GLOBE_RADIUS;
        const posAttr = geometry.attributes.position;
        if (!posAttr) return;

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            // muGroup のローカル座標系では、地球中心は (0, 0, -R)
            const dx = x;
            const dy = y;
            const dz = z + R;

            const currentDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (currentDist > 0.00001) {
                // 目標とする球半径：地球表面 + 微小標高 + 押し出し厚みz
                const targetRadius = R + altitudeOffset + (z * 0.5);
                const factor = targetRadius / currentDist;

                posAttr.setXYZ(
                    i,
                    dx * factor,
                    dy * factor,
                    (dz * factor) - R
                );
            }
        }

        posAttr.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    /**
     * 3D大陸メッシュ（半透明クリスタル沿岸緑 ＋ 古代アンバー荒野 ＋ 繊細なネオン海岸線）を構築
     */
    _buildContinentGeometry() {
        // --- 1. 外周沿岸部（半透明サイバー・クリスタル調の神秘のエメラルド） ---
        const shapePoints = this._getRotatedAustraliaPoints();
        const shape = new THREE.Shape();
        
        if (shapePoints.length > 0) {
            shape.moveTo(shapePoints[0].x, shapePoints[0].y);
            for (let i = 1; i < shapePoints.length; i++) {
                shape.lineTo(shapePoints[i].x, shapePoints[i].y);
            }
            shape.closePath();
        }

        const extrudeSettings = {
            depth: 0.015,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.006,
            bevelThickness: 0.006
        };
        const landGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        landGeo.center();
        // 球面射影：地球の丸みにピタッと吸い付かせる
        this._projectGeometryToSphere(landGeo, 0.008);

        // 沿岸部：深海が透ける半透明サイバーエメラルド（opacity: 0.32）
        const landMat = new THREE.MeshBasicMaterial({
            color: 0x059669,
            transparent: true,
            opacity: 0.32,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        landMat._baseOpacity = 0.32;
        this.materials.push(landMat);

        this.landMesh = new THREE.Mesh(landGeo, landMat);
        this.muGroup.add(this.landMesh);

        // --- 2. 内陸部（マダガスカル島リアルデータによる古代アンバー・テラコッタ薄層） ---
        const innerPoints = this._getInnerPlateauPoints();
        const innerShape = new THREE.Shape();
        if (innerPoints.length > 0) {
            innerShape.moveTo(innerPoints[0].x, innerPoints[0].y);
            for (let i = 1; i < innerPoints.length; i++) {
                innerShape.lineTo(innerPoints[i].x, innerPoints[i].y);
            }
            innerShape.closePath();
        }

        const innerExtrudeSettings = {
            depth: 0.008,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 0.004,
            bevelThickness: 0.004
        };
        const innerGeo = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
        innerGeo.center();
        // 球面射影：沿岸部よりわずかに一段せり上がった球面台地
        this._projectGeometryToSphere(innerGeo, 0.016);

        // 内陸部：古代のオーカー・アンバーゴールド薄層（opacity: 0.28）
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xd97706,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        innerMat._baseOpacity = 0.28;
        this.materials.push(innerMat);

        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        this.landMesh.add(innerMesh);

        // 内陸荒野のエッジライン（不要な斜め線を根絶する thresholdAngle: 28° 指定）
        const innerEdgesGeo = new THREE.EdgesGeometry(innerGeo, 28);
        const innerEdgesMat = new THREE.LineBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        innerEdgesMat._baseOpacity = 0.45;
        this.materials.push(innerEdgesMat);
        const innerEdgeLines = new THREE.LineSegments(innerEdgesGeo, innerEdgesMat);
        this.landMesh.add(innerEdgeLines);

        // --- 3. 外周ネオン発光海岸線（不要な斜め線を根絶する thresholdAngle: 28° 指定） ---
        const edgesGeo = new THREE.EdgesGeometry(landGeo, 28);
        const edgesMat = new THREE.LineBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: 0.80,
            depthWrite: false
        });
        edgesMat._baseOpacity = 0.80;
        this.materials.push(edgesMat);

        const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
        this.landMesh.add(edgeLines);

        // --- 4. 地球儀上の指定位置（南緯 22.5, 西経 112.5）へ配置 ---
        const surfacePos = Utils.latLonToVector3(this.centerLat, this.centerLon, CONFIG.GLOBE_RADIUS + 0.01);
        this.muGroup.position.copy(surfacePos);
        this.muGroup.lookAt(surfacePos.clone().multiplyScalar(2));
    }

    /**
     * ムー大陸の浮上段階を設定（0〜21）
     * @param {number} stage - 0: 完全水没, 1: 最初の島影, 21: 100%完全浮上
     */
    setStage(stage) {
        this.currentStage = Math.max(0, Math.min(this.maxStage, stage));

        if (this.currentStage <= 0) {
            // 第0段階：完全水没（非表示）
            this.muGroup.visible = false;
            return;
        }

        this.muGroup.visible = true;

        // 1〜21段階の進行度比率（0.05 〜 1.0）
        const progress = this.currentStage / this.maxStage;

        // ① スケール変化：第1段階で基本サイズの約 35% からスタートし、21段階で 100% へ滑らかに拡大
        const baseScale = 0.35 + (progress * 0.65);
        this.muGroup.scale.set(baseScale, baseScale, baseScale);

        // ② 浮上高度：第1段階では海面直下スレスレ（-0.015）、段階が進むごとに海面上（+0.008）へ隆起
        const heightZ = -0.015 + (progress * 0.023);
        if (this.landMesh) {
            this.landMesh.position.z = heightZ;
        }

        // ③ 透明度・輝度変化：マテリアル本来の基準透明度（_baseOpacity）と連動し、のっぺり感を防ぎつつ実体化
        const alphaRatio = 0.25 + (progress * 0.75);
        this.materials.forEach(mat => {
            const base = mat._baseOpacity !== undefined ? mat._baseOpacity : 0.5;
            mat.opacity = base * alphaRatio;
        });
    }

    /**
     * デバッグ用：ボタン押下ごとに 0 ➔ 1 ➔ ... ➔ 21 ➔ 0 とループ進行
     * @returns {number} 変更後の stage 番号
     */
    stepStageDebug() {
        let next = this.currentStage + 1;
        if (next > this.maxStage) {
            next = 0;
        }
        this.setStage(next);
        return this.currentStage;
    }

    /**
     * 現在の浮上段階を取得
     */
    getStage() {
        return this.currentStage;
    }
}