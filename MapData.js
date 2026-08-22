import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS } from './AirportData.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【先祖返り（ぐにゃぐにゃ地形）の修正とスマートフィルタリング】
 * 履歴33の指摘を受け、地形を不自然に引っ張っていた CatmullRomCurve3 (スプライン補間) と
 * SKIP_STEP による頂点間引きを完全に撤去しました。
 * 元の高解像度データ（10m）の座標をそのまま利用し、距離ベースの球面 Lerp 補間を行うことで、
 * 「自然で正確なリアス式海岸や地形のディテール」と「滑らかな連続線」を両立させています。
 * ※ 主要空港（AIRPORTS）が存在しない海の孤島は、引き続きゲームのノイズとして除去されます。
 */
export class MapData {
    constructor() {
        this.coastlinePoints = []; // 抽出・補間された3D海岸線ドット群
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
        // 海岸線（外部境界）のみを抽出
        const coastlines = topojson.mesh(topology, topology.objects.countries, (a, b) => a === b);
        
        const resolution = 0.005; // 1本の線に見える超高密度補間ピッチ
        const MAIN_LAND_THRESHOLD = 0.6; // 大陸（日本本州、ユーラシア等）の判定閾値
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

            // --- スマートフィルタリング判定（孤島の除去） ---
            const isMainland = lineLength >= MAIN_LAND_THRESHOLD;
            let hasAirport = false;
            
            if (!isMainland) {
                // 大陸ではない場合、その線分上の点が空港近くにあるか判定
                hasAirport = points3D.some(p => 
                    airportPositions.some(apPos => p.distanceTo(apPos) < AIRPORT_NEARBY_THRESHOLD)
                );
            }

            // 大陸でもなく、空港も近くに存在しない島々はゲームのノイズとして除外
            if (!isMainland && !hasAirport) return;

            // --- 自然な滑らかさの復元（球面 Lerp 補間） ---
            // ぐにゃぐにゃになる原因だったスプライン補間をやめ、10mデータ本来の頂点間を
            // 球面上に沿って高密度で補間し、自然で美しいラインを形成します。
            for (let i = 0; i < points3D.length - 1; i++) {
                const v1 = points3D[i];
                const v2 = points3D[i + 1];
                const dist = v1.distanceTo(v2);
                
                // 点と点の距離に応じて補間ステップ数を決定
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


