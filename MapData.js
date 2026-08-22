import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { REAL_AIRPORTS } from './Data_RealAirports.js';
import { FICTIONAL_AIRPORTS } from './Data_FictionalAirports.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【一筆書き地形デフォルメ ＆ スマートフィルタリング】
 * 履歴33のぐにゃぐにゃ化の失敗を反省し、地形を歪ませるスプライン補間は使わず、
 * 「10mデータの細かすぎる頂点（近すぎる頂点）をスキップする」適応型間引きと、
 * 「残った頂点間をLerp補間する」手法を採用。
 * これにより、正確な位置を保ちながら「一筆書きのミニマルライン」を描画します。
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
        const MAIN_LAND_THRESHOLD = 0.6; // 大陸の判定閾値
        const AIRPORT_NEARBY_THRESHOLD = 0.85; // 空港からの許容距離
        const MIN_VERTEX_DISTANCE = 0.05; // 【一筆書き用】これより近いリアス式海岸の頂点はスキップする

        const allAirports = [...REAL_AIRPORTS, ...FICTIONAL_AIRPORTS];
        const airportPositions = allAirports.map(ap => Utils.latLonToVector3(ap.lat, ap.lon, CONFIG.GLOBE_RADIUS));

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

            // --- 孤島の除去 ---
            const isMainland = lineLength >= MAIN_LAND_THRESHOLD;
            let hasAirport = false;
            
            if (!isMainland) {
                hasAirport = points3D.some(p => 
                    airportPositions.some(apPos => p.distanceTo(apPos) < AIRPORT_NEARBY_THRESHOLD)
                );
            }
            if (!isMainland && !hasAirport) return;

            // --- 一筆書きシルエット化（適応型間引き） ---
            // リアルすぎる細かなギザギザを削ぎ落とし、主要な角だけを残す
            const simplifiedPoints = [points3D[0]];
            for (let i = 1; i < points3D.length; i++) {
                const lastP = simplifiedPoints[simplifiedPoints.length - 1];
                // 距離が離れているか、最後の頂点であれば追加
                if (points3D[i].distanceTo(lastP) > MIN_VERTEX_DISTANCE || i === points3D.length - 1) {
                    simplifiedPoints.push(points3D[i]);
                }
            }

            // --- 自然な滑らかさの形成（球面 Lerp 補間） ---
            for (let i = 0; i < simplifiedPoints.length - 1; i++) {
                const v1 = simplifiedPoints[i];
                const v2 = simplifiedPoints[i + 1];
                const dist = v1.distanceTo(v2);
                
                const steps = Math.max(Math.ceil(dist / resolution), 1);
                
                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const p = new THREE.Vector3().copy(v1).lerp(v2, t).normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.01);
                    this.coastlinePoints.push(p.x, p.y, p.z);
                }
            }
        });
    }
}


