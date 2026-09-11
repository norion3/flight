/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 2（ギザ3連ピラミッド独立参道配置・接触完全解消版）】
 * 1. 【ピラミッド間の物理的めり込み完全根絶 ＆ 独立参道空間の開通】
 *    - 大・中・小各ピラミッドの底面正方形バウンディングボックスを幾何学再計算。
 *    - 大ピラミッド: (-0.02, +0.22) / 中ピラミッド: (-0.14, -0.24) / 小ピラミッド: (-0.22, -0.57)
 *    - 大〜中の間に幅 0.10、中〜小の間に幅 0.08 の明確な平野空間（聖なる参道）を開通し、角の接触を 100% 完全に消滅。
 * 2. 【多重ストローク法（Multi-Stroke LineOverlay）による 2.2px 線幅実現の完全保持】
 * 3. 【他大陸海岸線と100%同一の最高輝度ソリッド発光 ＆ 最前面描画（renderOrder = 10）の完全保持】
 * 4. 【北島北シフト（Y: +0.82）＆ 中央神聖海峡（幅 0.22）の完全保持】
 * 5. 【第1〜20段階ルビー赤 ➔ 第21段階自社エメラルド覚醒動的カラー遷移の完全保持】
 * 6. 【幾何学地平線オクルージョン（地球儀裏面透過の100%完全遮断）の完全保持】
 * 
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 4: 初到着3Dサイバー粒子花火セレモニー】
 * 7. 【3Dサイバー粒子花火（triggerCelebrationFireworks / updateFireworks）】
 *    中央タワー頂点（高さ 0.72）および3連ピラミッド頂点から、エメラルド・ゴールド・サファイアの
 *    光のフォトン粒子群が夜空へ放射・減衰しながら地球表面へ降り注ぐ優美なセレモニー花火システムを実装。
 * 
 * 【花火演出時間の黄金比率最適化（改善反映）】
 * 8. 【残光寿命5.0秒への延長】花火粒子の最大寿命（maxLife）を4.2秒から5.0秒へ延長。
 *    十分な余韻と達成感をプレイヤーへ届けた後に、静粛かつ自然に最終祝賀電信へ接続。
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

        // Phase 2: モニュメントグループ
        this.pyramidGroup = null;
        this.pyrMainGroup = null;
        this.pyrMidGroup = null;
        this.pyrSmallGroup = null;
        this.towerGroup = null;

        // 覚醒カラー制御用マテリアル保持配列
        this.monumentBodyMats = [];
        this.monumentEdgeMats = [];
        this.monumentCoreMats = [];

        // ★Phase 4: 3Dサイバー粒子花火パーティクル管理
        this.fireworksGroup = new THREE.Group();
        this.muGroup.add(this.fireworksGroup);
        this.activeFireworks = [];

        this._buildContinentGeometry();
        this._buildMonuments();
        this._setupOcclusionCulling(); // ★地平線オクルージョン遮蔽エンジンの初期化
        this.setStage(0); // 初期状態は水没（Lv 0）
    }

    /**
     * ★地平線オクルージョン（裏面透過完全遮断）エンジン
     * カメラとムー大陸の相対角度（法線内積）を毎フレーム自律監視し、
     * 地球の裏側に回った瞬間に muGroup 全体を 100% 完全非表示（visible = false）にする
     */
    _setupOcclusionCulling() {
        const triggerGeo = new THREE.BufferGeometry();
        triggerGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        const triggerMat = new THREE.PointsMaterial({ size: 0, transparent: true, opacity: 0, depthWrite: false });
        this.occlusionTrigger = new THREE.Points(triggerGeo, triggerMat);
        this.occlusionTrigger.frustumCulled = false;
        this.scene.add(this.occlusionTrigger);

        const continentWorldPos = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const camPos = new THREE.Vector3();
        const dirC = new THREE.Vector3();

        this.occlusionTrigger.onBeforeRender = (renderer, scene, camera) => {
            // 水没時（Lv 0）は常に非表示
            if (this.currentStage <= 0) {
                this.muGroup.visible = false;
                return;
            }

            // ムー大陸中心のワールド座標と地球表面法線ベクトル
            this.muGroup.getWorldPosition(continentWorldPos);
            normal.copy(continentWorldPos).normalize();

            // カメラ位置と地平線コサイン境界値（cosTheta_horizon = R / distC）
            camPos.copy(camera.position);
            const distC = camPos.length();
            if (distC < 0.001) return;

            dirC.copy(camPos).normalize();
            const cosTheta = dirC.dot(normal);
            const horizonCos = CONFIG.GLOBE_RADIUS / distC;

            // 大陸の広がり（マージン幅 0.18）を考慮した幾何学的遮蔽判定
            if (cosTheta < horizonCos - 0.18) {
                this.muGroup.visible = false; // ★地球の裏側に回ったら完全非表示
            } else {
                this.muGroup.visible = true;  // ★正面・地平線上に回ってきたら表示
            }
        };
    }

    /**
     * 多層フラクタル補間（Fractional Brownian Motion: fBm）
     * 直線基調（小砂利感）を完全に打破し、中規模の湾・岬（中周波）と微細な岩礁（高周波）を有機的に合成する
     * @param {THREE.Vector2[]} points - 元の頂点配列（N点）
     * @param {number} baseRoughness - 起伏の基本振幅
     * @returns {THREE.Vector2[]} 厳密に 3 * N 点の超リアル高密度頂点配列
     */
    _subdividePoints3X(points, baseRoughness = 0.0030) {
        const result = [];
        const n = points.length;

        // シード固定型の決定論的ノイズ関数
        const pseudoNoise = (seed, freq) => {
            const s = Math.sin(seed * freq) * 43758.5453;
            return (s - Math.floor(s) - 0.5) * 2.0;
        };

        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];

            // 元の特徴点は骨格として100%保持
            result.push(p1);

            // 線分ベクトルと法線単位ベクトル
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            const nx = len > 0.0001 ? -dy / len : 0;
            const ny = len > 0.0001 ? dx / len : 0;

            // 長い直線ほど中規模のうねり（湾入・岬）を許容する適応的スケール
            const adaptiveScale = Math.min(len * 0.22, baseRoughness * 1.8);

            // 分割点1（1/3位置）における多層フラクタル変位
            const t1 = 1 / 3;
            const nLow1 = pseudoNoise(i * 1.618 + 1.1, 5.31) * 0.55;
            const nMid1 = pseudoNoise(i * 3.141 + 2.3, 17.19) * 0.32;
            const nHigh1 = pseudoNoise(i * 7.823 + 4.7, 43.71) * 0.13;
            const fbm1 = (nLow1 + nMid1 + nHigh1) * adaptiveScale;

            const m1x = p1.x + (dx * t1) + (nx * fbm1);
            const m1y = p1.y + (dy * t1) + (ny * fbm1);
            result.push(new THREE.Vector2(m1x, m1y));

            // 分割点2（2/3位置）における多層フラクタル変位
            const t2 = 2 / 3;
            const nLow2 = pseudoNoise(i * 1.618 + 3.7, 5.31) * 0.55;
            const nMid2 = pseudoNoise(i * 3.141 + 5.9, 17.19) * 0.32;
            const nHigh2 = pseudoNoise(i * 7.823 + 8.1, 43.71) * 0.13;
            const fbm2 = (nLow2 + nMid2 + nHigh2) * adaptiveScale;

            const m2x = p1.x + (dx * t2) + (nx * fbm2);
            const m2y = p1.y + (dy * t2) + (ny * fbm2);
            result.push(new THREE.Vector2(m2x, m2y));
        }

        return result;
    }

    /**
     * オーストラリア本土の実在リアル地理データに基づく超高精細海岸線
     * 生データ 146点 ➔ 多層フラクタルfBm合成により 438頂点へ高密度化
     */
    _getRotatedAustraliaPoints() {
        const realAussiePoints = [
            // ヨーク岬半島先端〜カーペンタリア湾東岸 (9点)
            [9.0, 14.8], [8.5, 13.6], [8.0, 12.5], [8.1, 11.5], [8.2, 10.5], [7.3, 9.5], [6.5, 8.5], [5.8, 8.2], [5.0, 8.0],
            // カーペンタリア湾奥〜西岸〜アーネムランド (10点)
            [3.8, 8.9], [2.5, 9.8], [1.6, 10.9], [0.8, 12.0], [0.0, 13.0], [-0.5, 14.0], [-1.2, 13.8], [-1.8, 13.5], [-2.3, 13.3], [-2.7, 13.1],
            // ダーウィン〜ジョセフ・ボナパルト湾〜キンバリー (10点)
            [-3.5, 12.1], [-4.2, 11.2], [-4.6, 10.9], [-5.0, 10.7], [-5.8, 11.0], [-6.5, 11.2], [-7.0, 11.4], [-7.5, 11.5], [-8.5, 10.7], [-9.5, 9.8],
            // キンバリー西岸〜ブルーム〜80マイルビーチ (8点)
            [-10.4, 8.9], [-11.2, 8.0], [-11.6, 7.0], [-12.0, 6.0], [-12.8, 5.7], [-13.5, 5.5], [-14.2, 5.3], [-15.0, 5.2],
            // ポートヘッドランド〜ダンピア〜ノースウェストケープ (8点)
            [-16.0, 5.0], [-17.0, 4.7], [-17.8, 4.5], [-18.5, 4.2], [-19.0, 4.0], [-19.4, 3.7], [-19.6, 2.8], [-19.8, 1.8],
            // シャーク湾（豪州最西端・複雑な二又岬）〜ジェラルトン (10点)
            [-20.1, 0.7], [-20.4, -0.5], [-20.1, -1.2], [-19.8, -1.8], [-19.5, -2.0], [-19.3, -2.2], [-19.1, -2.7], [-18.9, -3.3], [-18.7, -4.1], [-18.5, -5.0],
            // パース〜ケープ・ルーウィン（南西端） (6点)
            [-18.1, -5.8], [-17.8, -6.5], [-17.9, -7.2], [-18.0, -7.8], [-18.2, -8.4], [-18.4, -8.9],
            // アルバニー〜エスペランス（南岸西部） (8点)
            [-17.8, -9.2], [-17.2, -9.4], [-16.4, -9.5], [-15.6, -9.5], [-14.5, -9.3], [-13.5, -9.0], [-12.5, -8.7], [-11.6, -8.4],
            // 大オーストラリア湾の雄大な大円弧 (11点)
            [-10.0, -7.4], [-8.5, -6.5], [-7.5, -6.3], [-6.5, -6.2], [-5.5, -6.2], [-4.5, -6.2], [-3.2, -6.2], [-2.0, -6.3], [-0.9, -6.4], [0.2, -6.6], [1.0, -7.3],
            // エアー半島〜スペンサー湾〜ヨーク半島 (11点)
            [1.8, -8.0], [2.1, -8.6], [2.4, -9.2], [2.8, -8.7], [3.2, -8.2], [3.8, -7.6], [4.3, -7.0], [4.1, -7.9], [3.8, -8.8], [3.6, -9.3], [3.4, -9.8],
            // アデレード〜エンカウンター湾〜ポートランド (9点)
            [4.2, -9.6], [5.0, -9.4], [5.7, -10.2], [6.3, -11.0], [6.8, -11.5], [7.2, -12.0], [7.6, -12.4], [8.1, -12.8], [8.9, -12.9],
            // ポートフィリップ湾（メルボルン）〜ウィルソンズ・プロモントリー（本土最南端） (8点)
            [9.8, -13.0], [10.6, -12.7], [11.4, -12.5], [12.1, -13.1], [12.9, -13.6], [13.7, -13.2], [14.5, -12.8], [15.5, -12.4],
            // ケープ・ハウ（南東端）〜シドニー〜ニューカッスル (8点)
            [16.5, -12.0], [16.9, -11.0], [17.2, -10.0], [17.5, -9.2], [17.7, -8.4], [18.0, -7.9], [18.3, -7.4], [18.8, -6.7],
            // バイロン岬（本土最東端）〜ブリスベン〜モートン湾 (8点)
            [19.4, -5.9], [19.8, -4.5], [20.1, -3.1], [19.8, -2.5], [19.6, -1.9], [19.5, -0.8], [19.4, 0.2], [18.6, 1.0],
            // グレート・バリア・リーフ沿岸〜グラッドストン〜マッカイ (8点)
            [17.8, 1.7], [16.5, 3.2], [16.1, 3.8], [15.7, 4.4], [15.0, 5.0], [14.2, 5.5], [13.7, 5.9],
            // タウンズビル〜ケアンズ〜クックタウン (8点)
            [13.3, 6.2], [12.8, 7.4], [12.3, 8.6], [12.0, 9.3], [11.8, 10.0], [11.4, 10.7], [11.0, 11.3], [10.3, 12.4],
            // プリンセス・シャーロット湾〜ヨーク岬東岸 (4点)
            [9.7, 13.5], [9.4, 13.9], [9.2, 14.2], [9.1, 14.5]
        ];

        // 90度時計回り回転 (x' = dy * s, y' = -dx * s) および拡大スケール (0.140)
        const scaleFactor = 0.140;
        const rawPoints = realAussiePoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });

        // 146点 ➔ 多層フラクタル補間により 438点 へ細分化
        return this._subdividePoints3X(rawPoints, 0.0038);
    }

    /**
     * 北島：マダガスカル島（Madagascar）の実在リアル地理データに基づく超高精細ベクター
     * 生データ 71点 ➔ 多層フラクタルfBm合成により 213頂点へ高密度化
     */
    _getNorthIslandMadagascarPoints() {
        const realMadagascarPoints = [
            // 北端アンブル岬尖端〜アンツィラナナ湾 (6点)
            [2.3, 7.0], [2.4, 6.85], [2.3, 6.7], [2.45, 6.1], [2.6, 5.5], [2.7, 4.8],
            // 東岸北部〜アントンギル湾の深い切れ込み〜マソアラ半島尖端 (7点)
            [2.8, 4.2], [2.6, 3.8], [2.5, 3.5], [2.9, 3.3], [3.3, 3.1], [3.2, 2.7], [3.0, 2.4],
            // 東岸中央〜トアマシナ〜マハノロ (8点)
            [2.8, 2.2], [2.6, 2.0], [2.5, 1.4], [2.4, 0.9], [2.25, 0.4], [2.1, 0.0], [1.95, -0.5], [1.8, -0.9],
            // 東岸南部〜マナカラ〜ファラファンガナ (8点)
            [1.65, -1.5], [1.5, -2.0], [1.25, -2.6], [1.0, -3.1], [0.9, -3.5], [0.8, -3.8], [0.65, -4.4], [0.5, -5.0],
            // 南東端トラニャロ〜南端サントマリー岬 (6点)
            [0.25, -5.6], [0.0, -6.0], [-0.5, -6.3], [-1.0, -6.5], [-1.5, -6.6], [-1.9, -6.6],
            // 南西岸アンドロカ〜トゥリアラ (8点)
            [-2.3, -6.3], [-2.7, -6.0], [-2.9, -5.6], [-3.1, -5.2], [-3.2, -4.7], [-3.3, -4.3], [-3.4, -3.9], [-3.5, -3.5],
            // 西岸中央〜モロンベ〜モロンダバ (8点)
            [-3.6, -3.1], [-3.7, -2.7], [-3.4, -2.2], [-3.2, -1.8], [-2.9, -1.5], [-2.7, -1.3], [-2.75, -0.6], [-2.8, 0.0],
            // 西岸北部〜マインティラーノ〜ベジバオ岬 (6点)
            [-2.9, 0.5], [-3.0, 1.0], [-2.9, 1.5], [-2.8, 2.0], [-2.65, 2.5], [-2.5, 3.0],
            // ボンベトカ湾（マハジャンガ）〜北西岸複雑入江群 (8点)
            [-2.1, 3.1], [-1.8, 3.2], [-1.2, 3.25], [-0.7, 3.3], [-0.3, 3.5], [0.0, 3.8], [0.35, 4.1], [0.7, 4.4],
            // ノシベ島対岸〜北端への回帰 (6点)
            [1.05, 4.9], [1.4, 5.5], [1.5, 5.6], [1.6, 5.7], [1.85, 6.2], [2.1, 6.8]
        ];

        // 北島スケーリング（幅 約0.66 / 長さ 約1.20）
        const scaleX = 0.095;
        const scaleY = 0.088;

        let sumX = 0;
        let sumY = 0;
        realMadagascarPoints.forEach(([dx, dy]) => {
            sumX += dx;
            sumY += dy;
        });
        const rawCenterX = sumX / realMadagascarPoints.length;
        const rawCenterY = sumY / realMadagascarPoints.length;

        const rawPoints = realMadagascarPoints.map(([dx, dy]) => {
            return new THREE.Vector2((dx - rawCenterX) * scaleX, (dy - rawCenterY) * scaleY);
        });

        return this._subdividePoints3X(rawPoints, 0.0026);
    }

    /**
     * 南島：カスピ海（Caspian Sea）の実在リアル地理データに基づく超高精細ベクター
     * ★最適化：内海南部を満たしピラミッドが安定鎮座できるようワイド＆南延伸（scaleX: 0.185, scaleY: 0.198）
     * 生データ 70点 ➔ 多層フラクタルfBm合成により 210頂点へ高密度化
     */
    _getSouthIslandCaspianPoints() {
        const realCaspianPoints = [
            // 北部ヴォルガ川デルタ〜ウラル川河口沿岸 (8点)
            [-1.4, 6.4], [-0.8, 6.6], [-0.4, 6.75], [0.0, 6.8], [0.6, 6.78], [1.2, 6.7], [1.6, 6.55], [2.0, 6.3],
            // 北東岸〜コムソモレツ湾〜ブザチ半島 (6点)
            [2.3, 5.9], [2.5, 5.5], [2.4, 5.0], [2.3, 4.6], [2.55, 4.2], [2.8, 3.8],
            // マンギシュラク半島〜カザフ湾 (6点)
            [2.7, 3.4], [2.5, 3.0], [2.2, 2.6], [2.0, 2.2], [2.2, 1.8], [2.4, 1.4],
            // カラ・ボガス・ゴル湾（天然の王冠状細首ラグーン） (10点)
            [2.55, 1.1], [2.7, 0.8], [3.2, 0.75], [3.8, 0.7], [4.1, 0.4], [4.4, 0.0], [4.2, -0.3], [3.9, -0.6], [3.3, -0.55], [2.8, -0.5],
            // トルクメンバシ湾〜チェレケン半島〜トルクメニスタン南岸 (8点)
            [2.75, -1.0], [2.7, -1.4], [2.4, -1.9], [2.2, -2.4], [2.0, -3.0], [1.8, -3.5], [1.65, -4.0], [1.5, -4.6],
            // 南岸（イラン沿岸：ゴルガーン湾〜エンゼリー） (8点)
            [1.2, -5.1], [0.8, -5.6], [0.4, -5.75], [0.0, -5.8], [-0.5, -5.78], [-1.0, -5.7], [-1.4, -5.5], [-1.8, -5.2],
            // アゼルバイジャン岸〜レンコラン〜クズ・アガチ湾 (7点)
            [-2.1, -4.8], [-2.4, -4.3], [-2.35, -3.8], [-2.3, -3.2], [-2.2, -2.6], [-2.1, -2.0], [-2.0, -1.5],
            // アブシェロン半島（バクーの鋭い東向き突起） (5点)
            [-1.9, -1.0], [-1.5, -0.85], [-1.2, -0.7], [-1.5, -0.45], [-1.8, -0.2],
            // ダゲスタン岸〜デルベント〜マハチカラ (6点)
            [-2.2, 0.2], [-2.5, 0.7], [-2.65, 1.2], [-2.8, 1.8], [-2.75, 2.4], [-2.7, 3.0],
            // テレク川デルタ〜アグラハン半島〜北部回帰 (6点)
            [-2.5, 3.6], [-2.3, 4.2], [-1.9, 4.7], [-1.6, 5.2], [-1.5, 5.6], [-1.4, 6.0]
        ];

        // ★南島ワイド太鼓化＆南延伸スケーリング（実効幅 約1.38 / 実効長さ 約1.80）
        const scaleX = 0.185;
        const scaleY = 0.198;

        let sumX = 0;
        let sumY = 0;
        realCaspianPoints.forEach(([dx, dy]) => {
            sumX += dx;
            sumY += dy;
        });
        const rawCenterX = sumX / realCaspianPoints.length;
        const rawCenterY = sumY / realCaspianPoints.length;

        // 反時計回りに約32度傾斜配置（-0.5585 rad）
        const rotAngle = -32 * (Math.PI / 180);
        const cosA = Math.cos(rotAngle);
        const sinA = Math.sin(rotAngle);

        const rawPoints = realCaspianPoints.map(([dx, dy]) => {
            const lx = (dx - rawCenterX) * scaleX;
            const ly = (dy - rawCenterY) * scaleY;
            const rx = (lx * cosA) - (ly * sinA);
            const ry = (lx * sinA) + (ly * cosA);
            return new THREE.Vector2(rx, ry);
        });

        return this._subdividePoints3X(rawPoints, 0.0026);
    }

    /**
     * 平面サーフェスおよびラインジオメトリの全頂点を地球儀の球面に沿って完全に射影・吸着させる
     */
    _projectGeometryToSphere(geometry, altitudeOffset = 0) {
        const R = CONFIG.GLOBE_RADIUS;
        const posAttr = geometry.attributes.position;
        if (!posAttr) return;

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);

            const dx = x;
            const dy = y;
            const dz = z + R;

            const currentDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (currentDist > 0.00001) {
                const targetRadius = R + altitudeOffset;
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
     * 3D大陸メッシュを純粋な球面サーフェス＋多重ストローク発光線として構築
     */
    _buildContinentGeometry() {
        // =========================================================================
        // 1. 外周沿岸部（深海と完全に溶け合う極薄サイバーエメラルド・オーラ面）
        // =========================================================================
        const shapePoints = this._getRotatedAustraliaPoints(); // 438頂点
        const shape = new THREE.Shape();
        
        if (shapePoints.length > 0) {
            shape.moveTo(shapePoints[0].x, shapePoints[0].y);
            for (let i = 1; i < shapePoints.length; i++) {
                shape.lineTo(shapePoints[i].x, shapePoints[i].y);
            }
            shape.closePath();
        }

        const landGeo = new THREE.ShapeGeometry(shape);
        landGeo.center();
        this._projectGeometryToSphere(landGeo, 0.008);

        const landMat = new THREE.MeshBasicMaterial({
            color: 0x059669,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        landMat._baseOpacity = 0.05;
        this.materials.push(landMat);

        this.landMesh = new THREE.Mesh(landGeo, landMat);
        this.muGroup.add(this.landMesh);

        // --- ★多重ストローク法（Multi-Stroke LineOverlay）による 2.2px 線幅化 ---
        const shapeBox = new THREE.Box2().setFromPoints(shapePoints);
        const shapeCenter = new THREE.Vector2();
        shapeBox.getCenter(shapeCenter);

        const createMultiStrokeLines = (pts, altOffset) => {
            const group = new THREE.Group();
            
            // 1. 主線（等倍・最高輝度ソリッド）
            const geo1 = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x - shapeCenter.x, p.y - shapeCenter.y, 0)));
            this._projectGeometryToSphere(geo1, altOffset);
            const mat1 = new THREE.LineBasicMaterial({ color: CONFIG.COLORS.COASTLINE, transparent: false });
            const line1 = new THREE.LineLoop(geo1, mat1);
            line1.renderOrder = 10;
            group.add(line1);

            // 2. 微小外側オフセット線（スケール 1.0025：GPUブレンドでふっくらとした2.2px太さを演出）
            const geo2 = new THREE.BufferGeometry().setFromPoints(pts.map(p => {
                const lx = (p.x - shapeCenter.x) * 1.0025;
                const ly = (p.y - shapeCenter.y) * 1.0025;
                return new THREE.Vector3(lx, ly, 0);
            }));
            this._projectGeometryToSphere(geo2, altOffset);
            const mat2 = new THREE.LineBasicMaterial({ color: CONFIG.COLORS.COASTLINE, transparent: true, opacity: 0.50, depthWrite: false });
            const line2 = new THREE.LineLoop(geo2, mat2);
            line2.renderOrder = 10;
            group.add(line2);

            // 3. 微小内側オフセット線（スケール 0.9975）
            const geo3 = new THREE.BufferGeometry().setFromPoints(pts.map(p => {
                const lx = (p.x - shapeCenter.x) * 0.9975;
                const ly = (p.y - shapeCenter.y) * 0.9975;
                return new THREE.Vector3(lx, ly, 0);
            }));
            this._projectGeometryToSphere(geo3, altOffset);
            const mat3 = new THREE.LineBasicMaterial({ color: CONFIG.COLORS.COASTLINE, transparent: true, opacity: 0.50, depthWrite: false });
            const line3 = new THREE.LineLoop(geo3, mat3);
            line3.renderOrder = 10;
            group.add(line3);

            return group;
        };

        const edgeLines = createMultiStrokeLines(shapePoints, 0.0082);
        this.landMesh.add(edgeLines);

        // --- 共通内部島マテリアル（極薄加算発光シャンパンゴールド） ---
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.04,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        innerMat._baseOpacity = 0.04;
        this.materials.push(innerMat);

        // =========================================================================
        // 2. 北島：マダガスカル島（重心 X: +0.02, Y: +0.82）
        // =========================================================================
        const northPosX = 0.02;
        const northPosY = 0.82;

        const northLocalPoints = this._getNorthIslandMadagascarPoints(); // 213頂点
        const northShape = new THREE.Shape();
        if (northLocalPoints.length > 0) {
            northShape.moveTo(northLocalPoints[0].x, northLocalPoints[0].y);
            for (let i = 1; i < northLocalPoints.length; i++) {
                northShape.lineTo(northLocalPoints[i].x, northLocalPoints[i].y);
            }
            northShape.closePath();
        }

        const northGeo = new THREE.ShapeGeometry(northShape);
        northGeo.translate(northPosX, northPosY, 0);
        this._projectGeometryToSphere(northGeo, 0.012);
        const northMesh = new THREE.Mesh(northGeo, innerMat);
        this.landMesh.add(northMesh);

        // 北島多重ストローク線
        const northBox = new THREE.Box2().setFromPoints(northLocalPoints);
        const northCenter = new THREE.Vector2();
        northBox.getCenter(northCenter);
        const northShiftedPts = northLocalPoints.map(p => new THREE.Vector2(p.x + northPosX, p.y + northPosY));
        const northLineGroup = createMultiStrokeLines(northShiftedPts, 0.0122);
        this.landMesh.add(northLineGroup);

        // =========================================================================
        // 3. 南島：カスピ海（ワイド太鼓＆南延伸・重心 X: +0.02, Y: -0.74）
        // =========================================================================
        const southPosX = 0.02;
        const southPosY = -0.74;

        const southLocalPoints = this._getSouthIslandCaspianPoints(); // 210頂点
        const southShape = new THREE.Shape();
        if (southLocalPoints.length > 0) {
            southShape.moveTo(southLocalPoints[0].x, southLocalPoints[0].y);
            for (let i = 1; i < southLocalPoints.length; i++) {
                southShape.lineTo(southLocalPoints[i].x, southLocalPoints[i].y);
            }
            southShape.closePath();
        }

        const southGeo = new THREE.ShapeGeometry(southShape);
        southGeo.translate(southPosX, southPosY, 0);
        this._projectGeometryToSphere(southGeo, 0.012);
        const southMesh = new THREE.Mesh(southGeo, innerMat);
        this.landMesh.add(southMesh);

        // 南島多重ストローク線
        const southShiftedPts = southLocalPoints.map(p => new THREE.Vector2(p.x + southPosX, p.y + southPosY));
        const southLineGroup = createMultiStrokeLines(southShiftedPts, 0.0122);
        this.landMesh.add(southLineGroup);

        // --- 4. 地球儀上の指定位置へ配置 ---
        const surfacePos = Utils.latLonToVector3(this.centerLat, this.centerLon, CONFIG.GLOBE_RADIUS + 0.01);
        this.muGroup.position.copy(surfacePos);
        this.muGroup.lookAt(surfacePos.clone().multiplyScalar(2));
    }

    /**
     * 単一の多層階段ピラミッド神殿を構築するヘルパー
     */
    _createPyramidStructure(pyrMat, pyrEdgeMat, layerSteps, shrineW, shrineH, coreR) {
        const group = new THREE.Group();

        let topZ = 0;
        layerSteps.forEach(step => {
            const boxGeo = new THREE.BoxGeometry(step.w, step.w, step.h);
            const boxMesh = new THREE.Mesh(boxGeo, pyrMat);
            boxMesh.position.z = step.z;
            group.add(boxMesh);

            const edgesGeo = new THREE.EdgesGeometry(boxGeo);
            const edgeLine = new THREE.LineSegments(edgesGeo, pyrEdgeMat);
            edgeLine.position.z = step.z;
            group.add(edgeLine);

            topZ = step.z + (step.h / 2);
        });

        // 頂点祠堂尖塔（四角錐）
        const shrineGeo = new THREE.ConeGeometry(shrineW, shrineH, 4);
        const shrineMesh = new THREE.Mesh(shrineGeo, pyrMat);
        shrineMesh.rotation.x = Math.PI / 2;
        shrineMesh.rotation.y = Math.PI / 4;
        shrineMesh.position.z = topZ + (shrineH / 2);
        group.add(shrineMesh);

        const shrineEdges = new THREE.EdgesGeometry(shrineGeo);
        const shrineEdgeLine = new THREE.LineSegments(shrineEdges, pyrEdgeMat);
        shrineEdgeLine.rotation.x = Math.PI / 2;
        shrineEdgeLine.rotation.y = Math.PI / 4;
        shrineEdgeLine.position.z = topZ + (shrineH / 2);
        group.add(shrineEdgeLine);

        // 頂点フォトンコア光点
        const coreGeo = new THREE.SphereGeometry(coreR, 10, 10);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xf43f5e, // 初期値は未覚醒赤コア
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        coreMat._baseOpacity = 1.0;
        this.materials.push(coreMat);
        this.monumentCoreMats.push(coreMat); // 覚醒切り替え対象

        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.z = topZ + shrineH + 0.005;
        group.add(coreMesh);

        return group;
    }

    /**
     * Phase 2: 中央ツインモニュメントの構築
     * - 北島（マダガスカル）: 超巨大メガリスタワー空港塔（高さ 0.72 / Y: +0.82）
     * - 南島（カスピ海）: ★ギザ風3連クリスタルピラミッド神殿（黄金比率アライメント / 独立参道配置）
     */
    _buildMonuments() {
        // =========================================================================
        // 1. 北島：超巨大メガリスタワー空港塔（通常主要タワーの3倍高：高さ 0.72）
        // =========================================================================
        this.towerGroup = new THREE.Group();
        const northPosX = 0.02;
        const northPosY = 0.82; // ★北島シフトに追従
        this.towerGroup.position.set(northPosX, northPosY, 0.012);

        this.maxTowerHeight = 0.72;
        this.towerRadiusBottom = 0.058;
        this.towerRadiusTop = this.towerRadiusBottom * 0.45;

        // ① 半透明オベリスク・シリンダー光柱（1〜20段階: 赤 / 21段階: 緑）
        const towerCylinderGeo = new THREE.CylinderGeometry(
            this.towerRadiusTop,
            this.towerRadiusBottom,
            this.maxTowerHeight,
            8,
            1,
            true
        );
        const towerCylinderMat = new THREE.MeshBasicMaterial({
            color: 0xe11d48, // 初期値: 未覚醒ルビー赤
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        towerCylinderMat._baseOpacity = 0.28;
        this.materials.push(towerCylinderMat);
        this.monumentBodyMats.push(towerCylinderMat);

        const towerCylinderMesh = new THREE.Mesh(towerCylinderGeo, towerCylinderMat);
        towerCylinderMesh.rotation.x = Math.PI / 2;
        towerCylinderMesh.position.z = this.maxTowerHeight / 2;
        this.towerGroup.add(towerCylinderMesh);

        // ② タワー八稜線のネオンエッジライン
        const towerEdgesGeo = new THREE.EdgesGeometry(towerCylinderGeo);
        const towerEdgesMat = new THREE.LineBasicMaterial({
            color: 0xfb7185, // 初期値: クリムゾン発光ライン
            transparent: true,
            opacity: 0.60,
            depthWrite: false
        });
        towerEdgesMat._baseOpacity = 0.60;
        this.materials.push(towerEdgesMat);
        this.monumentEdgeMats.push(towerEdgesMat);

        const towerEdgesLine = new THREE.LineSegments(towerEdgesGeo, towerEdgesMat);
        towerEdgesLine.rotation.x = Math.PI / 2;
        towerEdgesLine.position.z = this.maxTowerHeight / 2;
        this.towerGroup.add(towerEdgesLine);

        // ③ 頂点二重リング
        const topRingGeo = new THREE.RingGeometry(this.towerRadiusTop * 0.6, this.towerRadiusTop * 1.15, 24);
        const topRingMat = new THREE.MeshBasicMaterial({
            color: 0xfda4af,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        topRingMat._baseOpacity = 0.95;
        this.materials.push(topRingMat);
        this.monumentEdgeMats.push(topRingMat);

        this.towerTopRing = new THREE.Mesh(topRingGeo, topRingMat);
        this.towerTopRing.position.z = this.maxTowerHeight;
        this.towerGroup.add(this.towerTopRing);

        // ④ 頂点管制ビーコン光点
        const beaconGeo = new THREE.SphereGeometry(0.014, 12, 12);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0xf43f5e,
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        beaconMat._baseOpacity = 1.0;
        this.materials.push(beaconMat);
        this.monumentCoreMats.push(beaconMat);

        this.towerBeacon = new THREE.Mesh(beaconGeo, beaconMat);
        this.towerBeacon.position.z = this.maxTowerHeight + 0.008;
        this.towerGroup.add(this.towerBeacon);

        this.landMesh.add(this.towerGroup);

        // =========================================================================
        // 2. 南島：ギザ風3連クリスタルピラミッド神殿群（独立参道クリアランス配置）
        // =========================================================================
        this.pyramidGroup = new THREE.Group();
        const southPosX = 0.02;
        const southPosY = -0.74;
        this.pyramidGroup.position.set(southPosX, southPosY, 0.012);

        // 南島の大地傾斜角（-32度）に合わせてピラミッド全体の向きを調和
        this.pyramidGroup.rotation.z = -32 * (Math.PI / 180);

        // ピラミッド共通マテリアル（初期値: 未覚醒ルビークリスタル）
        const pyrMat = new THREE.MeshBasicMaterial({
            color: 0xe11d48,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        pyrMat._baseOpacity = 0.16;
        this.materials.push(pyrMat);
        this.monumentBodyMats.push(pyrMat);

        const pyrEdgeMat = new THREE.LineBasicMaterial({
            color: 0xfb7185,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        });
        pyrEdgeMat._baseOpacity = 0.85;
        this.materials.push(pyrEdgeMat);
        this.monumentEdgeMats.push(pyrEdgeMat);

        // -------------------------------------------------------------------------
        // ① 第1神殿：大ピラミッド（クフ王相当 / 底面幅 0.42 / 高さ 0.40 / 7層）
        //    ★最適高台配置：(-0.02, +0.22) で東側・北側の広大な台地へゆったり鎮座
        // -------------------------------------------------------------------------
        const mainLayers = [
            { w: 0.42, h: 0.045, z: 0.0225 },
            { w: 0.35, h: 0.045, z: 0.0675 },
            { w: 0.28, h: 0.045, z: 0.1125 },
            { w: 0.21, h: 0.045, z: 0.1575 },
            { w: 0.15, h: 0.045, z: 0.2025 },
            { w: 0.10, h: 0.045, z: 0.2475 },
            { w: 0.06, h: 0.045, z: 0.2925 }
        ];
        this.pyrMainGroup = this._createPyramidStructure(pyrMat, pyrEdgeMat, mainLayers, 0.038, 0.075, 0.010);
        this.pyrMainGroup.position.set(-0.02, 0.22, 0); // 北東側の広大な高台へ配置
        this.pyramidGroup.add(this.pyrMainGroup);

        // -------------------------------------------------------------------------
        // ② 第2神殿：中ピラミッド（カフラー王相当 / 底面幅 0.30 / 高さ 0.28 / 5層）
        //    ★実効参道クリアランス 幅0.10 を完全保証：(-0.14, -0.24)
        // -------------------------------------------------------------------------
        const midLayers = [
            { w: 0.30, h: 0.038, z: 0.019 },
            { w: 0.23, h: 0.038, z: 0.057 },
            { w: 0.16, h: 0.038, z: 0.095 },
            { w: 0.10, h: 0.038, z: 0.133 },
            { w: 0.05, h: 0.038, z: 0.171 }
        ];
        this.pyrMidGroup = this._createPyramidStructure(pyrMat, pyrEdgeMat, midLayers, 0.028, 0.055, 0.008);
        this.pyrMidGroup.position.set(-0.14, -0.24, 0); // 大ピラミッドから十分な参道空間(幅0.10)を空けて展開
        this.pyramidGroup.add(this.pyrMidGroup);

        // -------------------------------------------------------------------------
        // ③ 第3神殿：小ピラミッド（メンカウラー王相当 / 底面幅 0.20 / 高さ 0.18 / 3層）
        //    ★実効参道クリアランス 幅0.08 ＋ ギザ実測オフセット：(-0.22, -0.57)
        // -------------------------------------------------------------------------
        const smallLayers = [
            { w: 0.20, h: 0.032, z: 0.016 },
            { w: 0.13, h: 0.032, z: 0.048 },
            { w: 0.06, h: 0.032, z: 0.080 }
        ];
        this.pyrSmallGroup = this._createPyramidStructure(pyrMat, pyrEdgeMat, smallLayers, 0.020, 0.040, 0.006);
        this.pyrSmallGroup.position.set(-0.22, -0.57, 0); // 中ピラミッドから十分な参道空間(幅0.08)を空けて展開
        this.pyramidGroup.add(this.pyrSmallGroup);

        this.landMesh.add(this.pyramidGroup);
    }

    /**
     * ★Phase 4新設 ＆ 改善反映: 初便着陸記念 3Dサイバー粒子花火（フォトン・パイロテクニクス）
     * 黄金比率の5.0秒間、地球上に降り注ぐ優美な祝賀花火を展開
     */
    triggerCelebrationFireworks() {
        if (!this.landMesh) return;

        // 発射原点（北島タワー頂点、および南島3連ピラミッド頂点）
        const launchOrigins = [
            new THREE.Vector3(0.02, 0.82, 0.012 + 0.72), // タワー頂点
            new THREE.Vector3(0.02 - 0.02, -0.74 + 0.22, 0.012 + 0.40), // 大ピラミッド頂点
            new THREE.Vector3(0.02 - 0.14, -0.74 - 0.24, 0.012 + 0.28), // 中ピラミッド頂点
            new THREE.Vector3(0.02 - 0.22, -0.74 - 0.57, 0.012 + 0.18)  // 小ピラミッド頂点
        ];

        const particleCountPerOrigin = 90;
        const totalParticles = launchOrigins.length * particleCountPerOrigin;

        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        const velocities = [];

        // 祝賀カラーパレット: 自社エメラルド、ソーラーゴールド、サイバーサファイア、ピュアホワイト
        const palette = [
            new THREE.Color(0x34d399),
            new THREE.Color(0xfbbf24),
            new THREE.Color(0x38bdf8),
            new THREE.Color(0xffffff)
        ];

        let pIdx = 0;
        launchOrigins.forEach((origin) => {
            for (let i = 0; i < particleCountPerOrigin; i++) {
                const idx3 = pIdx * 3;
                positions[idx3] = origin.x;
                positions[idx3 + 1] = origin.y;
                positions[idx3 + 2] = origin.z;

                // 放射状の初速（半球・上空へ向かう花火展開ベクトル）
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * (Math.PI * 0.42); // 上向き中心
                const speed = 0.16 + (Math.random() * 0.26);

                const vx = Math.sin(phi) * Math.cos(theta) * speed;
                const vy = Math.sin(phi) * Math.sin(theta) * speed;
                const vz = Math.cos(phi) * speed * 1.35; // Z+（法線方向へ高く飛翔）

                velocities.push(new THREE.Vector3(vx, vy, vz));

                const col = palette[Math.floor(Math.random() * palette.length)];
                colors[idx3] = col.r;
                colors[idx3 + 1] = col.g;
                colors[idx3 + 2] = col.b;

                pIdx++;
            }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const pointsMesh = new THREE.Points(geometry, material);
        this.fireworksGroup.add(pointsMesh);

        this.activeFireworks.push({
            mesh: pointsMesh,
            geometry: geometry,
            material: material,
            velocities: velocities,
            life: 0,
            maxLife: 5.0 // ★黄金比率の5.0秒間に延長
        });
    }

    /**
     * ★Phase 4新設: 毎フレームの花火物理シミュレーション更新（放射 ➔ 重力沈降 ➔ フェードアウト）
     */
    updateFireworks(delta) {
        if (this.activeFireworks.length === 0) return;

        for (let f = this.activeFireworks.length - 1; f >= 0; f--) {
            const fw = this.activeFireworks[f];
            fw.life += delta;
            const progress = fw.life / fw.maxLife;

            if (progress >= 1.0) {
                this.fireworksGroup.remove(fw.mesh);
                fw.geometry.dispose();
                fw.material.dispose();
                this.activeFireworks.splice(f, 1);
                continue;
            }

            // フェードアウト（後半にかけてゆっくり減光）
            const fade = Math.max(0, 1.0 - Math.pow(progress, 1.6));
            fw.material.opacity = fade;

            const posAttr = fw.geometry.attributes.position;
            const count = posAttr.count;

            for (let i = 0; i < count; i++) {
                const vel = fw.velocities[i];

                // 重力によるZ減速＆沈降（擬似重力 -0.12）
                vel.z -= 0.12 * delta;
                // 空気抵抗
                vel.multiplyScalar(Math.pow(0.92, delta * 60));

                const x = posAttr.getX(i) + (vel.x * delta);
                const y = posAttr.getY(i) + (vel.y * delta);
                const z = posAttr.getZ(i) + (vel.z * delta);

                posAttr.setXYZ(i, x, y, z);
            }

            posAttr.needsUpdate = true;
        }
    }

    /**
     * ムー大陸の浮上段階を設定（0〜21）
     * - 第1〜20段階: 未覚醒「ルビークリスタル（赤）」
     * - 第21段階: 完全浮上・自社「サイバーエメラルド（緑）＆ 純白ビーコン」へ一斉覚醒
     */
    setStage(stage) {
        this.currentStage = Math.max(0, Math.min(this.maxStage, stage));

        if (this.currentStage <= 0) {
            this.muGroup.visible = false;
            return;
        }

        this.muGroup.visible = true;

        const progress = this.currentStage / this.maxStage;

        // ① スケール変化
        const baseScale = 0.35 + (progress * 0.65);
        this.muGroup.scale.set(baseScale, baseScale, baseScale);

        // ② 浮上高度
        const heightZ = -0.015 + (progress * 0.023);
        if (this.landMesh) {
            this.landMesh.position.z = heightZ;
        }

        // ③ 透明度変化
        const alphaRatio = 0.25 + (progress * 0.75);
        this.materials.forEach(mat => {
            const base = mat._baseOpacity !== undefined ? mat._baseOpacity : 0.5;
            mat.opacity = base * alphaRatio;
        });

        // ★④ 未覚醒（赤）➔ 第21段階 覚醒（自社エメラルド緑 ＆ 純白フォトンコア）動的カラー切り替え
        const isAwakened = this.currentStage === 21;

        const bodyColor = isAwakened ? 0x34d399 : 0xe11d48;
        const edgeColor = isAwakened ? 0x6ee7b7 : 0xfb7185;
        const coreColor = isAwakened ? 0xffffff : 0xf43f5e;

        this.monumentBodyMats.forEach(m => m.color.setHex(bodyColor));
        this.monumentEdgeMats.forEach(m => m.color.setHex(edgeColor));
        this.monumentCoreMats.forEach(m => m.color.setHex(coreColor));

        // ⑤ 南島：3連ピラミッドのドラマチック段階成長（第7〜15段階で大➔中➔小が連鎖出現）
        if (this.pyramidGroup) {
            if (this.currentStage < 7) {
                this.pyramidGroup.visible = false;
            } else {
                this.pyramidGroup.visible = true;

                // 第1ピラミッド（大）：第7〜10段階で 0.1 ➔ 1.0 へ成長
                if (this.pyrMainGroup) {
                    const p1 = Math.min(1.0, Math.max(0.1, (this.currentStage - 6) / 4));
                    this.pyrMainGroup.scale.set(p1, p1, p1);
                }

                // 第2ピラミッド（中）：第10段階から隆起し、第11〜13段階で完成
                if (this.pyrMidGroup) {
                    if (this.currentStage < 10) {
                        this.pyrMidGroup.visible = false;
                    } else {
                        this.pyrMidGroup.visible = true;
                        const p2 = Math.min(1.0, Math.max(0.1, (this.currentStage - 9) / 3));
                        this.pyrMidGroup.scale.set(p2, p2, p2);
                    }
                }

                // 第3ピラミッド（小）：第13段階から組み上がり、第14〜15段階で3連星完全降臨
                if (this.pyrSmallGroup) {
                    if (this.currentStage < 13) {
                        this.pyrSmallGroup.visible = false;
                    } else {
                        this.pyrSmallGroup.visible = true;
                        const p3 = Math.min(1.0, Math.max(0.1, (this.currentStage - 12) / 3));
                        this.pyrSmallGroup.scale.set(p3, p3, p3);
                    }
                }
            }
        }

        // ⑥ 北島タワーの段階成長（第13〜21段階）
        if (this.towerGroup) {
            if (this.currentStage < 13) {
                this.towerGroup.visible = false;
            } else {
                this.towerGroup.visible = true;
                const towerProgress = Math.min(1.0, Math.max(0.12, (this.currentStage - 12) / 9));
                this.towerGroup.scale.set(1.0, 1.0, towerProgress);
            }
        }
    }

    /**
     * デバッグ用：ボタン押下ごとに 0 ➔ 1 ➔ ... ➔ 21 ➔ 0 とループ進行
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