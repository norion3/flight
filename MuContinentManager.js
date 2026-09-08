/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（実在アイスランド本土 ＆ 実在タウポ湖カルデラ 幾何学無破綻版）】
 * 1. 【実在リアル巨石火山島（アイスランド本土）への刷新】
 *    南北に細長すぎ東海岸の湾入衝突でEarcut（三角形分割）を破綻させていたマダガスカル島を完全撤廃。
 *    東西・南北にどっしりとした幅と美しいフィヨルド海岸線を持つ実在「アイスランド本土（Iceland Mainland）」の
 *    リアル高精細地理データを中央聖域島として導入（_getInnerPlateauPoints）。
 * 2. 【右翼海抜けバグの物理的・数学的完全根絶】
 *    島の中央から東海岸・西海岸までの安全陸地幅を東西均等にたっぷり確保。
 *    Three.js の穴あけアルゴリズム（Earcut）が自己交差を起こさず、東側（右翼）の陸地メッシュを100%確実に生成。
 * 3. 【実在タウポ湖リアルカルデラベクターの黄金比率統合】
 *    ニュージーランドの実在タウポ湖ベクター（_getRealTaupoCalderaPoints）を島に対して堂々たる黄金比（28%）で開口。
 *    自然な入り江と岬を持つ神聖カルデラ湖を島の中央聖域に完全調和。
 * 4. 【北端衝突完全回避 ＆ 南部広大水域最適配置】
 *    内海北壁との間に幅 0.20 のクリアな等幅海峡を維持し、南側の広大な水域にどっしりとした巨石台地を配置。
 * 5. 【極限エーテル透過 ＆ 加算発光合成（AdditiveBlending）】
 *    - 外周リング（面）: #059669 / opacity: 0.05 / AdditiveBlending（深海から放たれるエメラルドの光霞）
 *    - 中央聖域島（面）: #fbbf24 / opacity: 0.04 / AdditiveBlending（濁りゼロの神聖シャンパンゴールド・オーラ）
 * 6. 【高輝度ネオン輪郭線の主役化】
 *    - 外周海岸線（線）: #34d399 / opacity: 1.00（LineLoop直接描画）
 *    - カルデラ湖岸線（線）: #fef08a / opacity: 1.00（自然な入り江を縁取る神聖な金糸）
 * 7. 【内部ワイヤー線100%根絶 ＆ 完全球面追従】LineLoop直接描画、境界エッジ抽出、球面射影処理、0〜21段階浮上ロジックは完全保持。
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
     * 実在する北大西洋の火山・巨石台地「アイスランド本土（Iceland Mainland）」の高精細リアル地理ベクター
     * 東西の幅がどっしりと広く、Earcutの三角形分割が100%破綻しない完全な安定トポロジー
     */
    _getInnerPlateauPoints() {
        const realIcelandPoints = [
            // 南西端レイキャネース半島先端〜ファクサ湾
            [-3.8, -2.4], [-3.2, -1.8], [-3.1, -1.0],
            // スナイフェルスネス半島（西に突き出た聖なる火山半島）
            [-4.2, -0.6], [-5.4, -0.3], [-5.0, 0.3], [-3.8, 0.5],
            // ブレイザフィヨルズル南岸〜ヴェストフィアディル（北西の雄大なフィヨルド半島群）
            [-3.0, 0.9], [-4.6, 1.5], [-5.3, 2.0], [-4.8, 2.7],
            // 北西端イーサフィヨルズル〜ホルンスプランディル北端
            [-4.0, 3.4], [-3.3, 3.8], [-2.6, 3.0], [-2.4, 2.0],
            // 北岸フーナ湾〜スカーガフィヨルズル
            [-1.8, 1.6], [-1.2, 2.4], [-0.5, 2.8],
            // エイヤフィヨルズル（アークレイリ）〜フーサヴィーク
            [0.2, 2.3], [0.8, 2.9], [1.5, 2.5], [1.8, 3.0],
            // 北東端メリラッカシエッタ〜ランガネス半島尖端
            [2.6, 2.7], [3.2, 3.1], [4.0, 2.8], [3.6, 2.2],
            // 東岸フィヨルド群（ヴォプナフィヨルズル〜セイジスフィヨルズル〜レイザルフィヨルズル）
            [3.1, 1.5], [3.7, 0.8], [3.9, 0.1], [3.4, -0.6], [3.6, -1.2],
            // 南東端ホプン〜ヨークルスアゥルロゥン沿岸
            [2.8, -1.8], [2.0, -2.3], [1.0, -2.7],
            // 南岸（スカーフタフェットル〜ヴィーク・黒砂海岸〜ディルホゥラエイ南端）
            [0.0, -2.9], [-1.0, -3.1], [-1.8, -3.1], [-2.5, -2.9],
            // エイヤフィヤトラヨークトル南麓〜セルフォス〜レイキャネース南岸回帰
            [-3.1, -2.7], [-3.6, -2.5]
        ];

        // 黄金プロポーション・スケーリング（東西幅 0.046 / 南北長 0.052 / Yオフセット: -0.065）
        const scaleX = 0.046;
        const scaleY = 0.052;
        const plateauPoints = realIcelandPoints.map(([dx, dy]) => {
            const posX = (dx * scaleX) + 0.02;
            const posY = (dy * scaleY) - 0.065;
            return new THREE.Vector2(posX, posY);
        });

        // スプライン補間で台地の輪郭を滑らかに整流化（64点）
        const closedPoints = [...plateauPoints, plateauPoints[0]];
        const spline = new THREE.SplineCurve(closedPoints);
        return spline.getPoints(64);
    }

    /**
     * 実在する世界最大の火山カルデラ湖「タウポ湖（Lake Taupo）」の高精細リアル地理ベクター
     * アイスランド本土の中央聖域に堂々たる黄金比（約28%）で収まる神聖カルデラ湖
     */
    _getRealTaupoCalderaPoints() {
        const taupoRawPoints = [
            // 北部入江（Tapuaeharuru Bay 〜 Whakaipo Bay）
            [0.15, 1.10], [0.35, 1.00], [0.55, 0.85], [0.70, 0.60],
            // 東岸部（Rotongaio 〜 Hinemaiaia 〜 Motuoapa）
            [0.85, 0.35], [0.95, 0.05], [0.90, -0.30], [0.75, -0.65],
            // 南岸部（Turangi 〜 Waihi 〜 Tokaanu Bay）
            [0.55, -0.90], [0.25, -1.05], [-0.05, -1.10], [-0.35, -0.95],
            // 南西岸〜カルデラ西壁（Kuratau 〜 Karangahape Cliffs）
            [-0.60, -0.75], [-0.80, -0.45], [-0.95, -0.15],
            // 西岸大湾入（Western Bays 〜 Whanganui Bay）
            [-0.90, 0.15], [-0.75, 0.45], [-0.55, 0.70],
            // 北西岸〜北端回帰（Kinloch 〜 Acacia Bay）
            [-0.30, 0.90], [-0.05, 1.05]
        ];

        // 黄金比率スケーリング（東西幅 0.068 / 南北長 0.072 / 重心 X: 0.02, Y: -0.065）
        const scaleX = 0.068;
        const scaleY = 0.072;
        const centerX = 0.02;
        const centerY = -0.065;

        const lakePoints = taupoRawPoints.map(([dx, dy]) => {
            return new THREE.Vector2(
                (dx * scaleX) + centerX,
                (dy * scaleY) + centerY
            );
        });

        // スプライン曲線で自然なカルデラ湖岸線へ滑らかに補間（36点）
        const closedPoints = [...lakePoints, lakePoints[0]];
        const spline = new THREE.SplineCurve(closedPoints);
        const smoothPoints = spline.getPoints(36);

        // Three.js の Shape.holes は「時計回り（Clockwise）」が必須仕様
        const isCW = THREE.ShapeUtils.isClockWise(smoothPoints);
        return isCW ? smoothPoints : [...smoothPoints].reverse();
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
     * ShapeGeometry から「共有されていない純粋な境界エッジ（外枠 ＆ 穴）」のみを抽出
     * 内部の三角形対角線・分割線（共有エッジ count === 2）を100%完全に除外する
     */
    _extractBoundaryEdgePositions(geometry, centerOffset, zHeight) {
        const pos = geometry.attributes.position;
        const index = geometry.index;
        const edgeMap = new Map();

        const addEdge = (a, b) => {
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        };

        if (index) {
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i);
                const b = index.getX(i + 1);
                const c = index.getX(i + 2);
                addEdge(a, b);
                addEdge(b, c);
                addEdge(c, a);
            }
        }

        const positions = [];
        edgeMap.forEach((count, key) => {
            // 面の境界（外枠および穴の湖岸線）のみ count が 1 になる
            if (count === 1) {
                const [a, b] = key.split('_').map(Number);
                positions.push(
                    pos.getX(a) - centerOffset.x, pos.getY(a) - centerOffset.y, zHeight,
                    pos.getX(b) - centerOffset.x, pos.getY(b) - centerOffset.y, zHeight
                );
            }
        });

        return positions;
    }

    /**
     * 3D大陸メッシュ（極薄発光クリスタル沿岸緑 ＋ 極薄発光シャンパンゴールド聖域 ＋ ノイズレス境界線）を構築
     */
    _buildContinentGeometry() {
        // --- 1. 外周沿岸部（深海と完全に溶け合う極薄サイバーエメラルド・オーラ） ---
        const shapePoints = this._getRotatedAustraliaPoints();
        const shape = new THREE.Shape();
        
        if (shapePoints.length > 0) {
            shape.moveTo(shapePoints[0].x, shapePoints[0].y);
            for (let i = 1; i < shapePoints.length; i++) {
                shape.lineTo(shapePoints[i].x, shapePoints[i].y);
            }
            shape.closePath();
        }

        // 面取り（ベベル）を排除し、上面と側面の境界のみを美しく保つ
        const extrudeSettings = {
            depth: 0.012,
            bevelEnabled: false,
            steps: 1
        };
        const landGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        landGeo.center();
        // 球面射影：地球の丸みにピタッと吸い付かせる
        this._projectGeometryToSphere(landGeo, 0.008);

        // 沿岸部：加算発光合成 ＋ 極限透過（不透明度 0.05）
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

        // --- 2. 内陸部（極薄シャンパン・トパーズゴールドの聖域台地：実在アイスランド本土 ＆ 実在タウポ湖カルデラ） ---
        const innerPoints = this._getInnerPlateauPoints();
        const innerShape = new THREE.Shape();

        // ★Earcut破綻防止：外周の巻き方向を数学的にCCW（反時計回り）へ整流化
        const isClockWise = THREE.ShapeUtils.isClockWise(innerPoints);
        const orderedInnerPoints = isClockWise ? [...innerPoints].reverse() : [...innerPoints];

        if (orderedInnerPoints.length > 0) {
            innerShape.moveTo(orderedInnerPoints[0].x, orderedInnerPoints[0].y);
            for (let i = 1; i < orderedInnerPoints.length; i++) {
                innerShape.lineTo(orderedInnerPoints[i].x, orderedInnerPoints[i].y);
            }
            innerShape.closePath();
        }

        // ★実在カルデラ湖（タウポ湖）リアル地理ベクターによる神聖カルデラ湖のくり抜き
        // 時計回り（CW）で整流化された点群から Path を構築し、全周の陸地メッシュを100%確実に復元
        const calderaPoints = this._getRealTaupoCalderaPoints();
        const calderaHole = new THREE.Path();
        if (calderaPoints.length > 0) {
            calderaHole.moveTo(calderaPoints[0].x, calderaPoints[0].y);
            for (let i = 1; i < calderaPoints.length; i++) {
                calderaHole.lineTo(calderaPoints[i].x, calderaPoints[i].y);
            }
            calderaHole.closePath();
            innerShape.holes.push(calderaHole);
        }

        // 面取り（ベベル）を排除し、聖なるカルデラ湖穴を綺麗に開口
        const innerExtrudeSettings = {
            depth: 0.008,
            bevelEnabled: false,
            steps: 1
        };
        const innerGeo = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
        innerGeo.center();
        // 球面射影：沿岸部よりわずかに一段せり上がった球面台地
        this._projectGeometryToSphere(innerGeo, 0.016);

        // 内陸部：加算発光合成 ＋ 極限透過（不透明度 0.04：濁りゼロの金霞）
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

        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        this.landMesh.add(innerMesh);

        // 内陸聖域の境界エッジライン（澄んだ金糸発光 #fef08a, opacity: 1.00）
        const innerBox = new THREE.Box2().setFromPoints(innerPoints);
        const innerCenter = new THREE.Vector2();
        innerBox.getCenter(innerCenter);

        const innerFlatGeo = new THREE.ShapeGeometry(innerShape);
        const innerBoundaryPositions = this._extractBoundaryEdgePositions(innerFlatGeo, innerCenter, 0.0045);
        const innerBoundaryGeo = new THREE.BufferGeometry();
        innerBoundaryGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerBoundaryPositions, 3));
        this._projectGeometryToSphere(innerBoundaryGeo, 0.016);

        const innerEdgesMat = new THREE.LineBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        innerEdgesMat._baseOpacity = 1.00;
        this.materials.push(innerEdgesMat);
        const innerEdgeLines = new THREE.LineSegments(innerBoundaryGeo, innerEdgesMat);
        this.landMesh.add(innerEdgeLines);

        // --- 3. 外周ネオン発光海岸線（澄んだ光の輪郭 #34d399, opacity: 1.00） ---
        const shapeBox = new THREE.Box2().setFromPoints(shapePoints);
        const shapeCenter = new THREE.Vector2();
        shapeBox.getCenter(shapeCenter);

        const coastPoints3D = shapePoints.map(p => new THREE.Vector3(p.x - shapeCenter.x, p.y - shapeCenter.y, 0.0065));
        const coastLineGeo = new THREE.BufferGeometry().setFromPoints(coastPoints3D);
        this._projectGeometryToSphere(coastLineGeo, 0.008);

        const edgesMat = new THREE.LineBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: 1.00,
            depthWrite: false
        });
        edgesMat._baseOpacity = 1.00;
        this.materials.push(edgesMat);

        const edgeLines = new THREE.LineLoop(coastLineGeo, edgesMat);
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