/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1（ビジュアル・スケール洗練版）】
 * 1. オーストラリア大陸の輪郭をベースに、細すぎる突起を排除した雄大な一筆書き海岸線へリデザイン。
 * 2. 南太平洋の空白海域において他の陸地・空港と干渉しない最大級のスケール（約2.2倍拡大: scaleFactor 0.088）へ拡張。
 * 3. 沿岸部の神秘的な深緑に加え、内陸部に古代の赤土・テラコッタ荒野（オーカー色）が広がる2色の大地構造を導入。
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
     * オーストラリア大陸の有機的輪郭をベースに、細い突起を排除し約2.2倍に拡大した一筆書き外周頂点を生成
     */
    _getRotatedAustraliaPoints() {
        // オーストラリアの輪郭をベースに、細すぎる突起を整流化・自然な湾入と岬で構成した一筆書き座標群
        const rawPoints = [
            // 北部〜北東部（旧カーペンタリア湾・アーネムランド側）
            [4.0, 12.0], [7.0, 10.5], [6.0, 8.0], [3.5, 9.0], [4.5, 11.0], [1.5, 10.5],
            // 北部中央〜北西海岸
            [0.5, 11.5], [-2.0, 11.8], [-3.5, 10.5], [-5.0, 11.0], [-6.5, 10.2],
            // 西部海岸（緩やかな弧を描く大陸西岸）
            [-9.0, 8.5], [-11.0, 6.5], [-12.5, 4.0], [-14.5, 2.5], [-15.0, 0.5],
            [-16.5, -1.0], [-17.0, -3.5], [-16.0, -5.5], [-15.0, -7.5],
            // 南西端〜大西洋側南岸
            [-14.5, -9.5], [-13.0, -11.0], [-10.5, -10.5],
            // 南部巨大湾入（大オーストラリア湾に相当する雄大な弧）
            [-8.0, -8.5], [-4.0, -7.2], [0.0, -7.0], [4.0, -7.5],
            // 南東部半島〜南東岸
            [6.5, -8.8], [8.0, -10.5], [10.5, -11.5], [12.5, -10.0],
            // 東岸部（力強くうねる大山脈沿岸）
            [14.0, -8.0], [15.5, -5.5], [16.0, -2.5], [15.0, 0.5], [13.5, 3.5],
            // 東部〜北東台地（※旧ヨーク岬の細い角をカットし、堂々たる丸みを帯びた台地へ再設計）
            [11.5, 6.5], [9.0, 9.0], [6.5, 11.0]
        ];

        // 90度回転（時計回り: x' = y, y' = -x）および約2.2倍スケール化（0.040 ➔ 0.088）
        const scaleFactor = 0.088;
        return rawPoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 内陸荒野（古代テラコッタ・赤土台地）用ポリゴン頂点を生成
     */
    _getInnerPlateauPoints() {
        const outerPoints = this._getRotatedAustraliaPoints();
        // 外周輪郭を中心に向かって約62%に縮小し、内陸高原・荒野の形状を形成
        return outerPoints.map(p => new THREE.Vector2(p.x * 0.62, p.y * 0.62));
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

        // --- 2. 内陸部（古代テラコッタ・赤土荒野台地） ---
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