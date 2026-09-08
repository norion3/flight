/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（純粋球面サーフェス化 ＆ 多層フラクタルfBm起伏 根本解決版）】
 * 1. 【押し出し厚み（ExtrudeGeometry）の完全撤廃 ＆ 純粋球面サーフェス化】
 *    南島中央の黒い窪みやポリゴンの影・歪みの元凶となっていた立体の厚み（Extrude 0.012/0.008）を100%全廃。
 *    他大陸（MapData）と全く同一の「厚みゼロの純粋球面サーフェス（ShapeGeometry）＋ 1pxネオン境界線（LineLoop）」へ移行。
 *    側面が存在しないため、どの角度から地球儀を回しても濁りや影が物理的に100%発生しない完全なホログラム化を実現。
 * 2. 【多層フラクタル合成（fBm: Fractional Brownian Motion）による中周波地形の復元】
 *    「直線に小砂利を乗せただけ」に見えていた単一擬似乱数を廃止し、オクターブ合成（低周波・中周波・高周波）を導入。
 *    岬と岬の間に中規模の自然な湾曲・入江（中周波）を形成し、先端には微細な波食岩礁（高周波）を連鎖させることで、
 *    他大陸の本物測量データと見分けがつかない有機的なマルチスケール海岸線を生成。
 * 3. 【他大陸完全同期カラー・マテリアル・配置の完全保持】
 *    - 全海岸線カラー: CONFIG.COLORS.COASTLINE（シアンホワイト / 不透明度 1.00）
 *    - 加算発光面: AdditiveBlending（外周 0.05 / 内部 0.04）
 *    - 南島配置: -32度反時計回り回転 ＆ 黄金拡大（scaleX: 0.120, scaleY: 0.132, 重心 Y: -0.65）
 *    - 完全球面射影（R=5.0）および 0〜21段階浮上ロジックは完全保持。
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

            // 分割点1（1/3位置）における多層フラクタル変位（低周波・中周波・高周波の合成）
            const t1 = 1 / 3;
            const nLow1 = pseudoNoise(i * 1.618 + 1.1, 5.31) * 0.55;    // 低周波：中規模のなだらかな湾曲
            const nMid1 = pseudoNoise(i * 3.141 + 2.3, 17.19) * 0.32;   // 中周波：副次的な岬・入江の切れ込み
            const nHigh1 = pseudoNoise(i * 7.823 + 4.7, 43.71) * 0.13;  // 高周波：波食岩礁の微小な粗さ
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
     * 生データ 146点 ➔ ★多層フラクタルfBm合成により 438頂点へ高密度化
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
     * 生データ 71点 ➔ ★多層フラクタルfBm合成により 213頂点へ高密度化
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

        // 重心 (0, 0) を基準としたローカル点群を計算
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

        // 71点 ➔ 多層フラクタル補間により 213点 へ細分化
        return this._subdividePoints3X(rawPoints, 0.0026);
    }

    /**
     * 南島：カスピ海（Caspian Sea）の実在リアル地理データに基づく超高精細ベクター
     * 生データ 70点 ➔ ★多層フラクタルfBm合成により 210頂点へ高密度化
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

        // 南島黄金スケーリング：約1.15倍ふっくら拡大（実効幅 約0.90 / 実効長さ 約1.20）
        const scaleX = 0.120;
        const scaleY = 0.132;

        // 重心 (0, 0) を基準としたローカル点群を計算
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

        // 70点 ➔ 多層フラクタル補間により 210点 へ細分化
        return this._subdividePoints3X(rawPoints, 0.0026);
    }

    /**
     * 平面サーフェスおよびラインジオメトリの全頂点を地球儀の球面に沿って完全に射影・吸着させる
     * （厚みを持たないため、側面影やポリゴンの折れ曲がり歪みは物理的にゼロ）
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
                // 目標とする球半径：純粋な球面表面 + 標高オフセット
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
     * 3D大陸メッシュを純粋な球面サーフェス（厚みゼロのShapeGeometry）＋ 1pxネオン線として構築
     * ★厚み（Extrude）を完全撤廃し、影・窪み・模型感を100%根絶
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

        // ★厚みゼロの純粋球面サーフェス（ShapeGeometry）を採用
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

        // 外周ネオン発光海岸線（LineLoop直接描画：他大陸完全同期 1px ネオン）
        const shapeBox = new THREE.Box2().setFromPoints(shapePoints);
        const shapeCenter = new THREE.Vector2();
        shapeBox.getCenter(shapeCenter);

        const coastPoints3D = shapePoints.map(p => new THREE.Vector3(p.x - shapeCenter.x, p.y - shapeCenter.y, 0));
        const coastLineGeo = new THREE.BufferGeometry().setFromPoints(coastPoints3D);
        this._projectGeometryToSphere(coastLineGeo, 0.0082); // サーフェス直上に吸着

        const edgesMat = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.COASTLINE, // 他大陸完全同期シアンホワイト
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        edgesMat._baseOpacity = 1.00;
        this.materials.push(edgesMat);

        const edgeLines = new THREE.LineLoop(coastLineGeo, edgesMat);
        this.landMesh.add(edgeLines);

        // --- 共通内部島マテリアル（厚みゼロ・加算発光シャンパンゴールド） ---
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
            color: CONFIG.COLORS.COASTLINE, // 他大陸完全同期シアンホワイト
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        innerLineMat._baseOpacity = 1.00;
        this.materials.push(innerLineMat);

        // =========================================================================
        // 2. 北島：マダガスカル島（聖域神殿島 / 純粋球面サーフェス）
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

        // ★厚みゼロの純粋球面サーフェス
        const northGeo = new THREE.ShapeGeometry(northShape);
        northGeo.translate(northPosX, northPosY, 0);
        this._projectGeometryToSphere(northGeo, 0.012);
        const northMesh = new THREE.Mesh(northGeo, innerMat);
        this.landMesh.add(northMesh);

        // 北島高精細ネオン海岸線（LineLoop直接描画：213頂点）
        const northPoints3D = northLocalPoints.map(p => new THREE.Vector3(p.x + northPosX, p.y + northPosY, 0));
        const northLineGeo = new THREE.BufferGeometry().setFromPoints(northPoints3D);
        this._projectGeometryToSphere(northLineGeo, 0.0122);
        const northLine = new THREE.LineLoop(northLineGeo, innerLineMat);
        this.landMesh.add(northLine);

        // =========================================================================
        // 3. 南島：カスピ海（帝都メガリスタワー島 / 純粋球面サーフェス）
        // =========================================================================
        const southPosX = 0.02;
        const southPosY = -0.65;

        const southLocalPoints = this._getSouthIslandCaspianPoints(); // 210頂点
        const southShape = new THREE.Shape();
        if (southLocalPoints.length > 0) {
            southShape.moveTo(southLocalPoints[0].x, southLocalPoints[0].y);
            for (let i = 1; i < southLocalPoints.length; i++) {
                southShape.lineTo(southLocalPoints[i].x, southLocalPoints[i].y);
            }
            southShape.closePath();
        }

        // ★厚みゼロの純粋球面サーフェス（黒い筋・窪みが100%消滅）
        const southGeo = new THREE.ShapeGeometry(southShape);
        southGeo.translate(southPosX, southPosY, 0);
        this._projectGeometryToSphere(southGeo, 0.012);
        const southMesh = new THREE.Mesh(southGeo, innerMat);
        this.landMesh.add(southMesh);

        // 南島高精細ネオン海岸線（LineLoop直接描画：210頂点）
        const southPoints3D = southLocalPoints.map(p => new THREE.Vector3(p.x + southPosX, p.y + southPosY, 0));
        const southLineGeo = new THREE.BufferGeometry().setFromPoints(southPoints3D);
        this._projectGeometryToSphere(southLineGeo, 0.0122);
        const southLine = new THREE.LineLoop(southLineGeo, innerLineMat);
        this.landMesh.add(southLine);

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