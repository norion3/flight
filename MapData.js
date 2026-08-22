import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS } from './AirportData.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【空港連動型スマートフィルタリング】
 * 単なる線の長さ判定だけでなく、`AirportData.js` の主要空港の位置座標を参照し、
 * 「主要空港が存在しない海上の孤島」を自動的に間引き（消去）します。
 * 空港が存在する小島（ハワイ、グアム、モルディブ、セーシェル等）や巨大大陸は確実に保持します。
 */
export class MapData {
    constructor() {
        this.coastlinePoints = [];
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
        const coastlines = topojson.mesh(topology, topology.objects.countries, (a, b) => a === b);
        
        const resolution = 0.005; // 1本の線に見える超高密度補間ピッチ
        const MAIN_LAND_THRESHOLD = 0.6; // 巨大大陸（日本本州、ユーラシア、南北アメリカ等）の判定閾値
        const AIRPORT_NEARBY_THRESHOLD = 0.85; // 主要空港からの許容距離（この範囲内に空港があれば小島でも残す）

        // 空港の3D位置を事前計算
        const airportPositions = AIRPORTS.map(ap => Utils.latLonToVector3(ap.lat, ap.lon, CONFIG.GLOBE_RADIUS));

        coastlines.coordinates.forEach(line => {
            let lineLength = 0;
            const points3D = [];

            for (let i = 0; i < line.length; i++) {
                const p = Utils.latLonToVector3(line[i][1], line[i][0], CONFIG.GLOBE_RADIUS + 0.01);
                if (i > 0) {
                    lineLength += p.distanceTo(points3D[points3D.length - 1]);
                }
                points3D.push(p);
            }

            // --- スマートフィルタリング判定 ---
            const isMainland = lineLength >= MAIN_LAND_THRESHOLD;
            
            // 線上のいずれかの頂点が主要空港の近くにあるか判定
            let hasAirport = false;
            if (!isMainland) {
                hasAirport = points3D.some(p => 
                    airportPositions.some(apPos => p.distanceTo(apPos) < AIRPORT_NEARBY_THRESHOLD)
                );
            }

            // 大陸でもなく、主要空港も近くに存在しない島々はゲームのUIノイズとして除外（消去）
            if (!isMainland && !hasAirport) return;

            // ダウンサンプリング ＆ スプライン曲線スムージング（流線型化）
            const SKIP_STEP = 3;
            const simplifiedPoints = points3D.filter((_, index) => index % SKIP_STEP === 0 || index === points3D.length - 1);

            if (simplifiedPoints.length < 2) return;

            const curve = new THREE.CatmullRomCurve3(simplifiedPoints, false, 'centripetal', 0.5);
            const curveLength = curve.getLength();
            const divisions = Math.max(Math.ceil(curveLength / resolution), 2);
            const spacedPoints = curve.getSpacedPoints(divisions);

            spacedPoints.forEach(p => {
                this.coastlinePoints.push(p.x, p.y, p.z);
            });
        });
    }
}

