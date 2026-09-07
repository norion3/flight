/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（真の大陸スケール ＆ 黄金比率有機造形版）】
 * 1. 【四角い入り江の完全除去】右下に生じていた直角ステップ・人工的切欠きを完全に削ぎ落とし、雄大で自然な一筆書き海岸線へ再設計。
 * 2. 【真の大陸スケール】スケールファクターを 0.088 ➔ 0.136（約1.55倍拡大）へ拡張し、南太平洋の空白海域を満たす第7の大陸としての威容を確立。
 * 3. 【内陸赤土の完全独立ポリゴン化】外周の単純縮小コピー（相似形）を廃止し、東岸に台地が迫り西岸に広大な平野が広がる非対称・独自の古代テラコッタ荒野を新規造形。
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
     * デザイン工学・黄金比率（東西 1 : 南北 1.618）に基づき、
     * 四角い切れ込みを完全排除した雄大で流麗な一筆書き外周頂点を生成
     */
    _getRotatedAustraliaPoints() {
        // オーストラリアの雄大な湾入・半島美をベースに、
        // 人工的な直角・切れ込みを完全に排除した滑らかな一筆書き外周頂点群
        const rawPoints = [
            // 北部〜北東端（堂々たる丸みを帯びた大岬）
            [4.0, 11.5], [6.5, 9.5], [5.5, 7.5], [3.5, 8.5], [1.5, 10.0],
            // 北部中央〜北西海岸（緩やかなうねり）
            [-1.0, 11.5], [-3.5, 11.2], [-5.5, 10.0], [-7.5, 8.8],
            // 西部海岸（大陸西岸の雄大な弧）
            [-10.5, 7.0], [-12.5, 5.0], [-14.5, 2.5], [-15.5, 0.0],
            [-16.5, -2.5], [-16.0, -5.5], [-14.5, -8.0],
            // 南西端〜大洋側南岸
            [-13.0, -10.0], [-10.5, -11.0], [-8.0, -10.5],
            // 南部巨大湾入（大自然のダイナミックな弧）
            [-5.0, -9.0], [-1.0, -8.0], [3.0, -8.2], [6.5, -9.2],
            // 南東部〜東岸南部（四角い切欠きを排除し、滑らかに連なる海岸線）
            [9.5, -10.5], [12.0, -9.5], [13.8, -7.5],
            // 東部海岸（山脈が海に迫る力強いカーブ）
            [15.2, -5.0], [15.8, -2.0], [15.2, 1.0], [13.8, 4.0],
            // 東部〜北東台地（流麗に北端へと回帰するライン）
            [11.8, 7.0], [8.5, 9.5], [6.0, 11.0]
        ];

        // 90度回転（時計回り: x' = y, y' = -x）および真の大陸スケール化（scaleFactor: 0.136）
        const scaleFactor = 0.136;
        return rawPoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 内陸赤土台地（完全独立ポリゴン）：
     * 外周の相似コピーを撤廃し、非対称で自然な地質境界を持つ古代テラコッタ荒野を生成
     */
    _getInnerPlateauPoints() {
        // 海岸線とは全く異なる有機的な起伏を持つ、独立した内陸台地の頂点群
        // 東岸側は山脈台地として海岸に近く、西岸側は平野が広がるアシンメトリー設計
        const plateauRaw = [
            // 北部高原
            [2.5, 6.8], [4.2, 5.0], [3.0, 3.8], [0.5, 5.2],
            // 北西〜西側平原境界
            [-2.5, 5.8], [-5.0, 4.5], [-7.5, 2.8], [-9.0, 0.5],
            // 西部〜南西荒野
            [-10.0, -2.0], [-8.8, -4.5], [-7.0, -6.0],
            // 南部盆地
            [-3.5, -5.5], [0.0, -4.8], [3.5, -5.2],
            // 南東〜東部台地（大山脈に沿って力強くせり出す）
            [7.0, -6.5], [9.5, -4.8], [10.5, -2.2], [10.0, 0.8],
            // 東部高原〜北部へ
            [8.5, 3.2], [5.8, 5.2]
        ];

        const scaleFactor = 0.136;
        return plateauRaw.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 3D大陸メッシュ（沿岸深緑 ＋ 内陸古代荒野 ＋ ネオン発光海岸線）を構築
     */
    _buildContinentGeometry() {
        // --- 1. 外周沿岸部（神秘の深緑大地） ---
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

        // --- 2. 内陸部（完全独立ポリゴンによる古代テラコッタ・赤土荒野台地） ---
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