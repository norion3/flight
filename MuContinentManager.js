/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（リアル地理データ統合・高精細フラクタル造形版）】
 * 1. 【外周海岸線の高精細化】手作業プロットを完全撤廃し、オーストラリア本土のリアル地理海岸線（約60地点の高密度ベクター）を採用。
 *    カーペンタリア湾、アーネムランド、シャーク湾、グレートオーストラリア湾、エアー半島、ウィルソンズプロモントリー等の本物の湾入・岬美を90度回転で完全再現。
 * 2. 【内陸赤土台地のリアル地形化】実在するマダガスカル島のリアル海岸線ベクターを独立抽出・配置。自然界の奇跡的な非対称（アシンメトリー）なうねりを持つ古代オーカー荒野を形成。
 * 3. 【真の大陸スケール】前回のベストなサイズ感を厳格に継承し、周囲の既存ノードと干渉しない安全海域（南緯22.5度, 西経112.5度）に黄金配置。
 * 4. 0〜21段階（0: 完全水没、1: 薄い島影、21: 100%完全浮上）の滑らかなスケーリング＆海面浮上ロジックは完全保持。
 * 5. デバッグ用伸縮ループ関数（stepStageDebug）を備え、画面上のテストボタンから手動で段階変化を確認可能。
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
     * オーストラリア本土の実在リアル地理データに基づく高精細海岸線（90度時計回り回転）
     * 自然界のフラクタルな微細起伏・湾入を余すところなく再現
     */
    _getRotatedAustraliaPoints() {
        // オーストラリア本土の精密な地理ベクター座標（中心経度 133.5°E, 南緯 25.5°S からの相対角）
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

        // 90度時計回り回転 (x' = dy * s, y' = -dx * s) および真の大陸スケール調整 (0.114)
        const scaleFactor = 0.114;
        return realAussiePoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 実在するマダガスカル島の高精細リアル地理ベクターに基づく古代赤土荒野台地
     * 自然界が生んだ完全非対称の起伏により、人工的な相似形（作り物感）を完全根絶
     */
    _getInnerPlateauPoints() {
        // マダガスカル島の精密な地理ベクター座標（中心 47.0°E, 19.0°S からの相対角）
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

        // 90度回転＆ムー大陸内陸部に美しく調和するスケール（0.098）と位置オフセット
        const madaScale = 0.098;
        return realMadagascarPoints.map(([dx, dy]) => {
            // 自然界の地形のうねりを生かした90度回転配置
            const rotX = (dy * madaScale) + 0.05;
            const rotY = (-dx * madaScale) - 0.02;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 3D大陸メッシュ（沿岸深緑 ＋ 内陸古代荒野 ＋ ネオン発光海岸線）を構築
     */
    _buildContinentGeometry() {
        // --- 1. 外周沿岸部（高精細リアルデータによる神秘の深緑大地） ---
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
            depth: 0.025,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.008,
            bevelThickness: 0.008
        };
        const landGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        landGeo.center();

        // 沿岸部：深いエメラルドスレート（密林・沿岸の緑）
        const landMat = new THREE.MeshBasicMaterial({
            color: 0x064e3b,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.materials.push(landMat);

        this.landMesh = new THREE.Mesh(landGeo, landMat);
        this.muGroup.add(this.landMesh);

        // --- 2. 内陸部（マダガスカル島リアルデータによる古代テラコッタ・赤土荒野台地） ---
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
            depth: 0.012,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.005,
            bevelThickness: 0.005
        };
        const innerGeo = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
        innerGeo.center();

        // 内陸部：オーストラリアの赤土（ウルル・古代オーカー）を彷彿とさせる荒野色
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x9a3412, // 深みのあるテラコッタ・赤土荒野
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.materials.push(innerMat);

        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        // 沿岸メッシュの上にわずかに載せる（Zファイティング防止）
        innerMesh.position.z = 0.010;
        this.landMesh.add(innerMesh);

        // 内陸荒野のエッジライン（砂金色の境界線）
        const innerEdgesGeo = new THREE.EdgesGeometry(innerGeo);
        const innerEdgesMat = new THREE.LineBasicMaterial({
            color: 0xd97706, // アンバーゴールド
            transparent: true,
            opacity: 0.60,
            depthWrite: false
        });
        this.materials.push(innerEdgesMat);
        const innerEdgeLines = new THREE.LineSegments(innerEdgesGeo, innerEdgesMat);
        innerEdgeLines.position.z = 0.010;
        this.landMesh.add(innerEdgeLines);

        // --- 3. 外周ネオン発光海岸線（プレイヤーと調和するエメラルド） ---
        const edgesGeo = new THREE.EdgesGeometry(landGeo);
        const edgesMat = new THREE.LineBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: 0.90,
            depthWrite: false
        });
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

        // ② 浮上高度：第1段階では海面直下スレスレ（-0.015）、段階が進むごとに海面上（+0.012）へ隆起
        const heightZ = -0.015 + (progress * 0.027);
        if (this.landMesh) {
            this.landMesh.position.z = heightZ;
        }

        // ③ 透明度・輝度変化：第1段階では神秘的な半透明の島影、完全浮上で濃密な実体化
        const alpha = 0.35 + (progress * 0.60);
        this.materials.forEach(mat => {
            mat.opacity = Math.min(0.95, alpha);
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