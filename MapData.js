import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【一筆書きシルエットへの昇華とノイズ除去】
 * リアス式海岸の細かすぎるギザギザはゲームの背景としてノイズになるため、
 * 「頂点と頂点の距離が近すぎる場合は描画をスキップする」適応型の距離ベース間引きを採用。
 * 空港が大幅に増設されたため、空港のない孤島の消去閾値を微調整しています。
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
        
        const resolution = 0.005; // 連続線に見せる高密度Lerp補間ピッチ
        const MIN_VERTEX_DISTANCE = 0.035; // 一筆書き化: これより近いノイズ頂点はスキップ
        const MIN_ISLAND_LENGTH = 0.18; // ノイズとなる極小の無人島を足切りする長さ閾値（少し厳しめに設定）

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

            // 極小の島は描画しない
            if (lineLength < MIN_ISLAND_LENGTH) return;

            // --- 一筆書きシルエット化（適応型間引き） ---
            const simplifiedPoints = [points3D[0]];
            for (let i = 1; i < points3D.length; i++) {
                const lastP = simplifiedPoints[simplifiedPoints.length - 1];
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


