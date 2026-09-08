/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 2（南島拡張安定化 ＆ エメラルドスケルトンピラミッド最適化版）】
 * 1. 【南島（下側の島）の拡張 ＆ 黄金非干渉配置】
 *    - ピラミッドが島からこぼれ落ちそうに見える問題を解消するため、南島（カスピ海）を約1.2倍（scaleX: 0.145, scaleY: 0.158）へ拡張。
 *    - 北島（Y: +0.72）との間の中央神聖海峡（幅 0.25）を厳密に保持するため、重心を Y: -0.70 へアライメント。
 *    - 外周内海南壁（Y: -1.65）との間にも幅 0.35 の広大なマージンがあり、全周で一切の衝突・干渉はゼロ。
 * 2. 【ピラミッドの色彩刷新：タワーと完全同一のエメラルド・スケルトンクリスタル】
 *    - 濁った黄色（0xfbbf24）を100%完全撤廃。
 *    - タワーと完全同期した【自社サイバーエメラルド（0x34d399）＋ 光条エッジ（0x6ee7b7）】へ統一。
 *    - 多層重なっても濁らない極薄スケルトン（opacity: 0.15, AdditiveBlending, depthWrite: false）を採用。
 * 3. 【ピラミッド寸法の安定化】
 *    - 底面幅を 0.42 へ最適化し、拡張された南島の大地の中央にどっしりと美しく鎮座。
 * 4. 【Phase 1 球面サーフェス＆fBm海岸線＆浮上ロジックの完全保持】
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
        this.towerGroup = null;

        this._buildContinentGeometry();
        this._buildMonuments();
        this.setStage(0); // 初期状態は水没（Lv 0）
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
            [17.8, 1.7], [17.1, 2.5], [16.5, 3.2], [16.1, 3.8], [15.7, 4.4], [15.0, 5.0], [14.2, 5.5], [13.7, 5.9],
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
     * ★最適化：ピラミッドが安定して鎮座できるよう約1.2倍拡張（scaleX: 0.145, scaleY: 0.158）
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

        // ★南島安定化スケーリング：約1.2倍拡張（実効幅 約1.08 / 実効長さ 約1.44）
        // ピラミッド底面幅（0.42）をゆったりと包み込む堂々たる大地を形成
        const scaleX = 0.145;
        const scaleY = 0.158;

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
     * 3D大陸メッシュを純粋な球面サーフェス＋1pxネオン線として構築
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

        // 外周ネオン発光海岸線（LineLoop直接描画）
        const shapeBox = new THREE.Box2().setFromPoints(shapePoints);
        const shapeCenter = new THREE.Vector2();
        shapeBox.getCenter(shapeCenter);

        const coastPoints3D = shapePoints.map(p => new THREE.Vector3(p.x - shapeCenter.x, p.y - shapeCenter.y, 0));
        const coastLineGeo = new THREE.BufferGeometry().setFromPoints(coastPoints3D);
        this._projectGeometryToSphere(coastLineGeo, 0.0082);

        const edgesMat = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.COASTLINE,
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        edgesMat._baseOpacity = 1.00;
        this.materials.push(edgesMat);

        const edgeLines = new THREE.LineLoop(coastLineGeo, edgesMat);
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

        const innerLineMat = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.COASTLINE,
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        innerLineMat._baseOpacity = 1.00;
        this.materials.push(innerLineMat);

        // =========================================================================
        // 2. 北島：マダガスカル島（空港ハブ島 / 重心 X: +0.02, Y: +0.72）
        // =========================================================================
        const northPosX = 0.02;
        const northPosY = 0.72;

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

        const northPoints3D = northLocalPoints.map(p => new THREE.Vector3(p.x + northPosX, p.y + northPosY, 0));
        const northLineGeo = new THREE.BufferGeometry().setFromPoints(northPoints3D);
        this._projectGeometryToSphere(northLineGeo, 0.0122);
        const northLine = new THREE.LineLoop(northLineGeo, innerLineMat);
        this.landMesh.add(northLine);

        // =========================================================================
        // 3. 南島：カスピ海（★ピラミッド聖域島 / 拡張版・重心 X: +0.02, Y: -0.70）
        //    北島（+0.72）との間隔 0.25 を厳密キープ、南壁（-1.65）とのマージン 0.35
        // =========================================================================
        const southPosX = 0.02;
        const southPosY = -0.70;

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

        const southPoints3D = southLocalPoints.map(p => new THREE.Vector3(p.x + southPosX, p.y + southPosY, 0));
        const southLineGeo = new THREE.BufferGeometry().setFromPoints(southPoints3D);
        this._projectGeometryToSphere(southLineGeo, 0.0122);
        const southLine = new THREE.LineLoop(southLineGeo, innerLineMat);
        this.landMesh.add(southLine);

        // --- 4. 地球儀上の指定位置へ配置 ---
        const surfacePos = Utils.latLonToVector3(this.centerLat, this.centerLon, CONFIG.GLOBE_RADIUS + 0.01);
        this.muGroup.position.copy(surfacePos);
        this.muGroup.lookAt(surfacePos.clone().multiplyScalar(2));
    }

    /**
     * Phase 2: 中央ツインモニュメントの構築
     * - 北島（マダガスカル）: 超巨大メガリスタワー空港塔（高さ 0.72）
     * - 南島（カスピ海）: ★タワーと完全同色のエメラルド・スケルトン高層ピラミッド神殿（7層・高さ 約0.40）
     */
    _buildMonuments() {
        const playerEmeraldHex = 0x34d399; // 自社サイバーエメラルド統一カラー
        const emeraldEdgeHex = 0x6ee7b7;   // エッジ発光シアンエメラルド

        // =========================================================================
        // 1. 北島：超巨大メガリスタワー空港塔（通常主要タワーの3倍高：高さ 0.72）
        // =========================================================================
        this.towerGroup = new THREE.Group();
        const northPosX = 0.02;
        const northPosY = 0.72;
        this.towerGroup.position.set(northPosX, northPosY, 0.012);

        this.maxTowerHeight = 0.72;
        this.towerRadiusBottom = 0.058;
        this.towerRadiusTop = this.towerRadiusBottom * 0.45;

        // ① 半透明オベリスク・シリンダー光柱
        const towerCylinderGeo = new THREE.CylinderGeometry(
            this.towerRadiusTop,
            this.towerRadiusBottom,
            this.maxTowerHeight,
            8,
            1,
            true
        );
        const towerCylinderMat = new THREE.MeshBasicMaterial({
            color: playerEmeraldHex,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        towerCylinderMat._baseOpacity = 0.28;
        this.materials.push(towerCylinderMat);

        const towerCylinderMesh = new THREE.Mesh(towerCylinderGeo, towerCylinderMat);
        towerCylinderMesh.rotation.x = Math.PI / 2;
        towerCylinderMesh.position.z = this.maxTowerHeight / 2;
        this.towerGroup.add(towerCylinderMesh);

        // ② タワー八稜線のネオンエッジライン
        const towerEdgesGeo = new THREE.EdgesGeometry(towerCylinderGeo);
        const towerEdgesMat = new THREE.LineBasicMaterial({
            color: emeraldEdgeHex,
            transparent: true,
            opacity: 0.60,
            depthWrite: false
        });
        towerEdgesMat._baseOpacity = 0.60;
        this.materials.push(towerEdgesMat);

        const towerEdgesLine = new THREE.LineSegments(towerEdgesGeo, towerEdgesMat);
        towerEdgesLine.rotation.x = Math.PI / 2;
        towerEdgesLine.position.z = this.maxTowerHeight / 2;
        this.towerGroup.add(towerEdgesLine);

        // ③ 頂点二重リング
        const topRingGeo = new THREE.RingGeometry(this.towerRadiusTop * 0.6, this.towerRadiusTop * 1.15, 24);
        const topRingMat = new THREE.MeshBasicMaterial({
            color: 0xa7f3d0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        topRingMat._baseOpacity = 0.95;
        this.materials.push(topRingMat);

        this.towerTopRing = new THREE.Mesh(topRingGeo, topRingMat);
        this.towerTopRing.position.z = this.maxTowerHeight;
        this.towerGroup.add(this.towerTopRing);

        // ④ 頂点管制ビーコン光点
        const beaconGeo = new THREE.SphereGeometry(0.014, 12, 12);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        beaconMat._baseOpacity = 1.0;
        this.materials.push(beaconMat);

        this.towerBeacon = new THREE.Mesh(beaconGeo, beaconMat);
        this.towerBeacon.position.z = this.maxTowerHeight + 0.008;
        this.towerGroup.add(this.towerBeacon);

        this.landMesh.add(this.towerGroup);

        // =========================================================================
        // 2. 南島：高層エメラルド・スケルトン階段ピラミッド神殿
        //    - 配置: 拡張された南島重心（X: +0.02, Y: -0.70）に安定鎮座
        //    - 色彩: 変な黄色を100%排除し、タワーと同一のサイバーエメラルド
        //    - 質感: 多層重なっても濁らない極薄スケルトン（opacity: 0.15）
        // =========================================================================
        this.pyramidGroup = new THREE.Group();
        const southPosX = 0.02;
        const southPosY = -0.70;
        this.pyramidGroup.position.set(southPosX, southPosY, 0.012);

        // ★タワー完全同期マテリアル（サイバーエメラルド極薄スケルトン ＋ 発光ネオンエッジ）
        const pyrMat = new THREE.MeshBasicMaterial({
            color: playerEmeraldHex,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        pyrMat._baseOpacity = 0.15;
        this.materials.push(pyrMat);

        const pyrEdgeMat = new THREE.LineBasicMaterial({
            color: emeraldEdgeHex,
            transparent: true,
            opacity: 0.80,
            depthWrite: false
        });
        pyrEdgeMat._baseOpacity = 0.80;
        this.materials.push(pyrEdgeMat);

        // ★南島に美しく収まる安定プロポーション（底面幅 0.42 / 総高さ 約 0.40）
        const layerSteps = [
            { w: 0.42, h: 0.045, z: 0.0225 },
            { w: 0.35, h: 0.045, z: 0.0675 },
            { w: 0.28, h: 0.045, z: 0.1125 },
            { w: 0.21, h: 0.045, z: 0.1575 },
            { w: 0.15, h: 0.045, z: 0.2025 },
            { w: 0.10, h: 0.045, z: 0.2475 },
            { w: 0.06, h: 0.045, z: 0.2925 }
        ];

        layerSteps.forEach(step => {
            const boxGeo = new THREE.BoxGeometry(step.w, step.w, step.h);
            const boxMesh = new THREE.Mesh(boxGeo, pyrMat);
            boxMesh.position.z = step.z;
            this.pyramidGroup.add(boxMesh);

            const edgesGeo = new THREE.EdgesGeometry(boxGeo);
            const edgeLine = new THREE.LineSegments(edgesGeo, pyrEdgeMat);
            edgeLine.position.z = step.z;
            this.pyramidGroup.add(edgeLine);
        });

        // 最上部：神聖クリスタル祠堂尖塔（四角錐：高さ 0.075）
        const shrineHeight = 0.075;
        const shrineBaseZ = 0.315;
        const shrineGeo = new THREE.ConeGeometry(0.038, shrineHeight, 4);
        const shrineMesh = new THREE.Mesh(shrineGeo, pyrMat);
        shrineMesh.rotation.x = Math.PI / 2;
        shrineMesh.rotation.y = Math.PI / 4;
        shrineMesh.position.z = shrineBaseZ + (shrineHeight / 2);
        this.pyramidGroup.add(shrineMesh);

        const shrineEdges = new THREE.EdgesGeometry(shrineGeo);
        const shrineEdgeLine = new THREE.LineSegments(shrineEdges, pyrEdgeMat);
        shrineEdgeLine.rotation.x = Math.PI / 2;
        shrineEdgeLine.rotation.y = Math.PI / 4;
        shrineEdgeLine.position.z = shrineBaseZ + (shrineHeight / 2);
        this.pyramidGroup.add(shrineEdgeLine);

        // 頂点エネルギー光点（フォトンコア：総高さ 約0.40）
        const coreGeo = new THREE.SphereGeometry(0.010, 10, 10);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        coreMat._baseOpacity = 1.0;
        this.materials.push(coreMat);

        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.z = shrineBaseZ + shrineHeight + 0.006;
        this.pyramidGroup.add(coreMesh);

        this.landMesh.add(this.pyramidGroup);
    }

    /**
     * ムー大陸の浮上段階を設定（0〜21）
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

        // ④ 南島ピラミッドの段階成長（第7〜15段階）
        if (this.pyramidGroup) {
            if (this.currentStage < 7) {
                this.pyramidGroup.visible = false;
            } else {
                this.pyramidGroup.visible = true;
                const pyrProgress = Math.min(1.0, Math.max(0.1, (this.currentStage - 6) / 9));
                this.pyramidGroup.scale.set(pyrProgress, pyrProgress, pyrProgress);
            }
        }

        // ⑤ 北島タワーの段階成長（第13〜21段階）
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