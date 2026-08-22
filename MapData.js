import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【重要】座標データをコード内にテキストで直書きしたりBase64化するアプローチは、
 * AIの文字数出力制限により座標が強制間引きされ「折紙のようなデタラメな直線」になります。
 * 必ずこのクラスのように fetch API で世界標準データを取得し、球面上で高密度補間を行ってください。
 */
export class MapData {
    constructor() {
        this.coastlinePoints = []; // 抽出された3D海岸線ドット群
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
        // topojson-client で国境線ではなく「海岸線（外部境界）」のみを正確に抽出
        const coastlines = topojson.mesh(topology, topology.objects.countries, (a, b) => a === b);
        
        // 点同士の距離に応じて補間し、線が途切れる現象を完全にシャットアウト
        const maxInterpolationDistance = 0.02;

        coastlines.coordinates.forEach(line => {
            for (let i = 0; i < line.length - 1; i++) {
                const lon1 = line[i][0], lat1 = line[i][1];
                const lon2 = line[i + 1][0], lat2 = line[i + 1][1];

                const v1 = Utils.latLonToVector3(lat1, lon1, CONFIG.GLOBE_RADIUS + 0.01);
                const v2 = Utils.latLonToVector3(lat2, lon2, CONFIG.GLOBE_RADIUS + 0.01);

                const dist = v1.distanceTo(v2);
                const steps = Math.max(Math.ceil(dist / maxInterpolationDistance), 1);

                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const p = new THREE.Vector3().copy(v1).lerp(v2, t).normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.01);
                    this.coastlinePoints.push(p.x, p.y, p.z);
                }
            }
        });
    }
}

