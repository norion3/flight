/**
 * AI可読性・先祖返り防止コメント:
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 1】
 * 1. オーストラリア大陸の有機的な輪郭を90度回転させて南太平洋の空白海域（南緯約22度、西経約112度）に配置。
 * 2. 0〜21段階（0: 完全水没・非表示、1: 薄い島影、21: 100%完全浮上）の滑らかなスケーリング＆海面浮上ロジックを実装。
 * 3. 既存の地球儀描画・航路・空港システムに一切干渉しない完全独立モジュールとして設計。
 * 4. デバッグ用伸縮ループ関数（stepStageDebug）を備え、画面上のテストボタンから手動で段階変化を確認可能。
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
     * オーストラリア大陸の有機的輪郭（経度・緯度の相対座標）を90度回転させたポリゴン頂点を生成
     */
    _getRotatedAustraliaPoints() {
        // オーストラリアの主要輪郭ポイント（相対オフセット: dLon, dLat）
        // 中心（約 134°E, 25°S）を原点とした形状データ
        const rawPoints = [
            // ヨーク岬半島〜カーペンタリア湾
            [8.0, 14.5], [10.5, 12.0], [9.0, 7.0], [5.0, 8.5], [6.0, 11.5], [3.0, 11.0],
            // アーネムランド〜ダーウィン
            [2.0, 12.5], [-1.5, 13.0], [-3.0, 11.5], [-4.0, 12.8], [-5.5, 12.2],
            // 北西海岸〜ブルーム〜ポートヘッドランド
            [-8.5, 10.0], [-11.0, 7.5], [-12.5, 5.0], [-15.0, 3.5], [-15.5, 2.0],
            // ノースウェストケープ〜シャーク湾
            [-18.0, 3.0], [-20.0, 0.5], [-20.5, -2.5], [-19.5, -4.5], [-18.5, -6.5],
            // パース〜南西端ルーウィン岬
            [-18.5, -8.5], [-18.0, -11.0], [-15.5, -12.5], [-13.0, -12.0],
            // 大オーストラリア湾〜エスペランス
            [-10.0, -10.0], [-6.0, -8.0], [-2.0, -8.0], [2.0, -8.0],
            // エアー半島〜スペンサー湾〜アデレード
            [3.0, -9.0], [3.5, -11.0], [4.5, -9.5], [6.0, -11.5], [8.0, -13.0],
            // メルボルン〜オーストラリア南東部
            [10.5, -14.0], [13.0, -14.5], [15.0, -13.0], [16.5, -11.5],
            // シドニー〜ブリスベン〜グレートディバイディング東海岸
            [17.0, -9.0], [18.5, -6.0], [19.0, -3.0], [18.0, 0.0],
            // タウンズビル〜ケアンズ〜ヨーク岬付け根
            [15.5, 4.0], [13.5, 7.5], [12.0, 10.5], [9.5, 13.5]
        ];

        // 90度回転（時計回り: x' = y, y' = -x）およびスケール正規化
        // 地球儀上で南米西沖の空間に美しく調和するスケール（幅・高さ約 0.65 単位）
        const scaleFactor = 0.040;
        return rawPoints.map(([dx, dy]) => {
            const rotX = dy * scaleFactor;
            const rotY = -dx * scaleFactor;
            return new THREE.Vector2(rotX, rotY);
        });
    }

    /**
     * 3D大陸メッシュおよびネオン発光海岸線を構築
     */
    _buildContinentGeometry() {
        const shapePoints = this._getRotatedAustraliaPoints();
        const shape = new THREE.Shape();
        
        if (shapePoints.length > 0) {
            shape.moveTo(shapePoints[0].x, shapePoints[0].y);
            for (let i = 1; i < shapePoints.length; i++) {
                shape.lineTo(shapePoints[i].x, shapePoints[i].y);
            }
            shape.closePath();
        }

        // 1. 大陸の地表メッシュ（地球の球面に沿うよう極薄の押し出しポリゴン）
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

        // 古代大陸らしい神秘的な深緑〜サイバーエメラルドの質感
        const landMat = new THREE.MeshBasicMaterial({
            color: 0x064e3b, // 深いエメラルドスレート
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.materials.push(landMat);

        this.landMesh = new THREE.Mesh(landGeo, landMat);
        this.muGroup.add(this.landMesh);

        // 2. 大陸のネオン発光海岸線（輪郭エッジライン）
        const edgesGeo = new THREE.EdgesGeometry(landGeo);
        const edgesMat = new THREE.LineBasicMaterial({
            color: 0x34d399, // プレイヤーと同じエメラルドネオン
            transparent: true,
            opacity: 0.90,
            depthWrite: false
        });
        this.materials.push(edgesMat);

        const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
        this.landMesh.add(edgeLines);

        // 3. 地球儀上の指定位置（南緯 22.5, 西経 112.5）へグループを配置＆法線方向を向けさせる
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