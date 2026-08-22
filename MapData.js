import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【美的デフォルメ・流線型化の要】
 * リアルすぎるリアス式海岸や微小な島は、将来の空港・航路シミュレーションにおいて視覚的ノイズになります。
 * そのため、このクラス内で取得したデータに対して「微小島の除外」「頂点の間引き」「スプライン曲線による平滑化」
 * という数学的デフォルメを施し、洗練された滑らかな流線型のシルエットを構築しています。
 */
export class MapData {
    constructor() {
        this.coastlinePoints = []; // 抽出・デフォルメされた3D海岸線ドット群
    }

    async loadData() {
        try {
            const response = await fetch(CONFIG.MAP_DATA_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            const topology = await response.json();
            this._parseTopology(topology);
            return true;
        } catch (error) {
            console.error("Failed to load map data:", error);
            return false;
        }
    }

    _parseTopology(topology) {
        // topojson-client で海岸線（外部境界）のみを抽出
        const coastlines = topojson.mesh(topology, topology.objects.countries, (a, b) => a === b);
        
        // 描画の滑らかさ（線としての密度）
        const resolution = 0.005;

        // デフォルメ用パラメータ
        // 微小島を除外するための閾値（3D空間での物理的な長さ。約150km未満の島・湖をスキップ）
        const MIN_LENGTH_THRESHOLD = 0.12; 
        // ギザギザを消すための間引き率（N個に1個の頂点だけを採用）
        const SKIP_STEP = 3; 

        coastlines.coordinates.forEach(line => {
            // --- ステップ1: 3D座標化と物理的な長さの計算（ノイズ足切り） ---
            let lineLength = 0;
            const points3D = [];

            for (let i = 0; i < line.length; i++) {
                const p = Utils.latLonToVector3(line[i][1], line[i][0], CONFIG.GLOBE_RADIUS + 0.01);
                if (i > 0) {
                    lineLength += p.distanceTo(points3D[points3D.length - 1]);
                }
                points3D.push(p);
            }

            // 極端に短い線分（微小な無人島や内陸の小さな湖など）はゲームのノイズになるため除外
            if (lineLength < MIN_LENGTH_THRESHOLD) return;

            // --- ステップ2: ダウンサンプリング（ギザギザの間引き） ---
            // リアス式海岸などの過剰なディテールを間引き、骨格だけにする
            const simplifiedPoints = points3D.filter((_, index) => index % SKIP_STEP === 0 || index === points3D.length - 1);

            if (simplifiedPoints.length < 2) return;

            // --- ステップ3: スプライン曲線によるスムージング（流線型化） ---
            // 間引かれた頂点間を滑らかな曲線（centripetal）で繋ぎ直し、美しい流線型のシルエットを生成
            const curve = new THREE.CatmullRomCurve3(simplifiedPoints, false, 'centripetal', 0.5);

            // 生成された美しい曲線上に、高密度（0.005間隔）でドットを敷き詰める
            const curveLength = curve.getLength();
            const divisions = Math.max(Math.ceil(curveLength / resolution), 2);
            const spacedPoints = curve.getSpacedPoints(divisions);

            spacedPoints.forEach(p => {
                this.coastlinePoints.push(p.x, p.y, p.z);
            });
        });
    }
}


