/**
 * AI可読性・先祖返り防止コメント:
 * 【空路ハイブリッド描画の最適化 ＆ Zファイティング完全防止 ＆ 安全ガード強化】
 * 1. 【Zファイティング解消】リボンメッシュおよび芯ラインに `depthWrite: false` を適用し、
 *    `renderOrder`（リボン: 1, 芯ライン: 2）で描画順を固定。航路交差時や同心配置時のチラつき・黒ずみを完全根絶。
 * 2. 【リボン幅の最適化】拡大時に上品な発光帯として視認できるよう `halfWidth = 0.005` に微調整。
 * 3. 【堅牢なガード】引数がオブジェクトまたはID文字列のどちらで渡されてもクラッシュしない安全フォールバックを実装。
 * 4. 【リソース破棄メソッド】撤退時やリセット時にメモリリークを防ぐ `removeAllRoutesForAirport` / `clearAllRoutes` を新設。
 * 5. 機体飛行用 `{ id, curve, length, data }` 構造、ベジェ制御点計算、距離キャッシュ等は100%完全保持。
 * 6. 【追加】就航アクティブ制のための内部実績フラグ（`isOperational`）および開拓タイムスタンプ（`createdAt`）、`setRouteOperational` を実装。
 * 7. 【Step 3追加】空路ネットワークのBase62極小圧縮・抽出（exportRoutes）および3D空間への完全再構築（restoreRoutes）を実装。
 * 
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 4: 主要空港同等ノード仕様 ＆ 日本直行距離制限（1.72R）】
 * 8. 【主要空港同等接続数】ムー中央古代空港（MU）を主要空港（'major': 8路線）と同一の最大接続数として扱う判定を実装。
 * 9. 【日本直行・描画破綻防止の距離制限（getMaxAllowedDistance）】ムー大陸が関与する空路は、通常の大圏距離制限（1.25R）を
 *    日本（羽田・成田）から直行可能な 1.72R（約118度）に拡大。地球の真裏（対蹠点）のSlerp特異点破綻・地球コア貫通を物理的に100%未然防止。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class NetworkManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        
        this.routeGroup = new THREE.Group();
        this.globeGroup.add(this.routeGroup);

        this.network = {}; 
        
        CONFIG.COMPANIES.forEach(comp => {
            this.network[comp.id] = {};
        });
        
        this.MAX_CONNECTIONS = {
            'major': 8,
            'local': 5,
            'fictional': 3
        };
        
        // プレイヤー専用のキャッシュ（既存UIが依存しているため保持）
        this.cachedTotalLength = 0;
        
        // AI専用のキャッシュ辞書
        this.aiCachedTotalLengths = {};
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                this.aiCachedTotalLengths[comp.id] = 0;
            }
        });
    }

    // ★Step 3追加: Base62エンコーダー（0〜3843 の数値を2文字の英数字に圧縮）
    _toBase62(num) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        if (num === 0) return '00';
        let str = '';
        while (num > 0) {
            str = chars[num % 62] + str;
            num = Math.floor(num / 62);
        }
        return str.padStart(2, '0');
    }

    // ★Step 3追加: Base62デコーダー（2文字の英数字を数値に復元）
    _fromBase62(str) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let num = 0;
        for (let i = 0; i < str.length; i++) {
            num = num * 62 + chars.indexOf(str[i]);
        }
        return num;
    }

    /**
     * 【Step 3追加】指定会社の全路線を極小文字列（Base62圧縮）として抽出する
     * @param {string} companyId - 対象会社ID
     * @param {Array} airportsData - 全空港データの配列（安定インデックス生成用）
     * @returns {string} - 圧縮された路線データ文字列（例: "0A3F1B2C..."）
     */
    exportRoutes(companyId, airportsData) {
        if (!this.network[companyId]) return "";
        
        // 全空港IDをアルファベット順にソートし、絶対ズレない安定したインデックス（0〜305）を生成
        const sortedIds = airportsData.map(a => a.id).sort();
        
        const routes = [];
        const processed = new Set();
        
        for (const fromId in this.network[companyId]) {
            this.network[companyId][fromId].forEach(route => {
                const toId = route.id;
                // 双方向重複を防ぐキー
                const key1 = `${fromId}-${toId}`;
                const key2 = `${toId}-${fromId}`;
                
                if (!processed.has(key1) && !processed.has(key2)) {
                    const fromIdx = sortedIds.indexOf(fromId);
                    const toIdx = sortedIds.indexOf(toId);
                    
                    if (fromIdx >= 0 && toIdx >= 0) {
                        // 出発地(2文字) + 目的地(2文字) = 1路線4文字に圧縮
                        routes.push(this._toBase62(fromIdx) + this._toBase62(toIdx));
                    }
                    processed.add(key1);
                }
            });
        }
        // 文字列として結合（LZStringでさらに極小化される）
        return routes.join('');
    }

    /**
     * 【Step 3追加】極小文字列を解読し、3D空間上の路線網を完全に再構築する
     * @param {string} dataString - exportRoutesで生成された圧縮文字列
     * @param {string} companyId - 対象会社ID
     * @param {Array} airportsData - 全空港データの配列
     */
    restoreRoutes(dataString, companyId, airportsData) {
        // 既存の路線メッシュを安全に全破棄（メモリリーク・二重描画防止）
        this.clearAllRoutes(companyId);
        
        if (!dataString || dataString.length % 4 !== 0) return;
        
        const sortedIds = airportsData.map(a => a.id).sort();
        
        // 4文字（1路線）ずつ切り出して復元
        for (let i = 0; i < dataString.length; i += 4) {
            const chunk = dataString.slice(i, i + 4);
            const fromIdx = this._fromBase62(chunk.slice(0, 2));
            const toIdx = this._fromBase62(chunk.slice(2, 4));
            
            if (fromIdx >= 0 && fromIdx < sortedIds.length && toIdx >= 0 && toIdx < sortedIds.length) {
                const fromId = sortedIds[fromIdx];
                const toId = sortedIds[toIdx];
                
                const fromData = airportsData.find(a => a.id === fromId);
                const toData = airportsData.find(a => a.id === toId);
                
                if (fromData && toData) {
                    // 3Dメッシュとして再構築
                    this.addRoute(fromData, toData, companyId);
                    // 復元された路線は即座に就航済みに設定し、フライトを許可
                    this.setRouteOperational(fromId, toId, companyId);
                }
            }
        }
    }

    getConnectionCount(airportId, companyId = 'player') {
        if (!this.network[companyId]) return 0;
        return this.network[companyId][airportId] ? this.network[companyId][airportId].length : 0;
    }

    isConnected(fromId, toId, companyId = 'player') {
        if (!this.network[companyId] || !this.network[companyId][fromId]) return false;
        return this.network[companyId][fromId].some(dest => dest.id === toId);
    }

    /**
     * ★Phase 4新設: 2空港間の最大許容接続距離を取得
     * 通常は地球半径比 1.25R。ムー中央古代空港（MU）が関与する場合は日本（東京・羽田）から直行可能な 1.72R（約118度）に拡大。
     * ヨーロッパ等の地球の裏側（140度超）は除外し、対蹠点Slerp特異点破綻・地球コア貫通を物理的に完全防止。
     * @param {Object} fromData 
     * @param {Object} toData 
     * @returns {number} 最大許容大圏弦長距離
     */
    getMaxAllowedDistance(fromData, toData) {
        if (!fromData || !toData) return CONFIG.GLOBE_RADIUS * 1.25;
        const fromId = typeof fromData === 'object' ? fromData.id : fromData;
        const toId = typeof toData === 'object' ? toData.id : toData;
        const isMuRoute = (fromId === 'MU' || toId === 'MU');
        return isMuRoute ? (CONFIG.GLOBE_RADIUS * 1.72) : (CONFIG.GLOBE_RADIUS * 1.25);
    }

    canConnect(fromData, toData, companyId = 'player') {
        if (!fromData || !toData) return false;
        if (fromData.id === toData.id) return false;

        const fromCount = this.getConnectionCount(fromData.id, companyId);
        const toCount = this.getConnectionCount(toData.id, companyId);
        
        // ★Phase 4: ムー中央古代空港（MU）は主要空港（'major': 8路線）と完全に同一扱い
        const fromType = (fromData.id === 'MU') ? 'major' : fromData.type;
        const toType = (toData.id === 'MU') ? 'major' : toData.type;

        const fromMax = this.MAX_CONNECTIONS[fromType] || 5;
        const toMax = this.MAX_CONNECTIONS[toType] || 5;

        if (fromCount >= fromMax || toCount >= toMax) return false;

        if (this.isConnected(fromData.id, toData.id, companyId)) return false;

        return true;
    }

    setRouteOperational(fromId, toId, companyId = 'player') {
        if (!this.network[companyId]) return;
        if (this.network[companyId][fromId]) {
            const r1 = this.network[companyId][fromId].find(r => r.id === toId);
            if (r1) r1.isOperational = true;
        }
        if (this.network[companyId][toId]) {
            const r2 = this.network[companyId][toId].find(r => r.id === fromId);
            if (r2) r2.isOperational = true;
        }
    }

    addRoute(fromData, toData, companyId = 'player') {
        if (!this.canConnect(fromData, toData, companyId)) return false;

        const compIndex = CONFIG.COMPANIES.findIndex(c => c.id === companyId);
        const comp = compIndex >= 0 ? CONFIG.COMPANIES[compIndex] : null;
        const routeColor = comp ? comp.routeColor : 0x0ea5e9;
        
        // ★自社空路の最上位表示: プレイヤーは常に最上空（0.0020）、AI各社はインデックス順
        const isPlayer = (companyId === 'player');
        const offset = isPlayer ? 0.0020 : (Math.max(0, compIndex) * 0.0003);

        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);

        const chordMid = posA.clone().lerp(posB, 0.5);
        const distance = posA.distanceTo(posB);

        const midDir = chordMid.clone();
        if (midDir.lengthSq() > 0.000001) {
            midDir.normalize();
        } else {
            midDir.copy(posA).normalize();
        }

        const peakAltitude = CONFIG.GLOBE_RADIUS + 0.02 + offset + (distance * 0.20) + 0.03;
        const peakPoint = midDir.multiplyScalar(peakAltitude);

        const midPoint = peakPoint.clone().multiplyScalar(2).sub(chordMid);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const curveLength = curve.getLength();

        const points = curve.getPoints(50);
        
        const halfWidth = 0.005; 
        const vertices = [];
        const indices = [];

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const normal = pt.clone().normalize();
            let tangent;
            if (i === 0) {
                tangent = points[1].clone().sub(points[0]).normalize();
            } else if (i === points.length - 1) {
                tangent = points[i].clone().sub(points[i - 1]).normalize();
            } else {
                tangent = points[i + 1].clone().sub(points[i - 1]).normalize();
            }

            let binormal = new THREE.Vector3().crossVectors(tangent, normal);
            if (binormal.lengthSq() > 0.000001) {
                binormal.normalize();
            } else {
                binormal.set(0, 1, 0);
            }

            const pLeft = pt.clone().addScaledVector(binormal, -halfWidth);
            const pRight = pt.clone().addScaledVector(binormal, halfWidth);

            vertices.push(pLeft.x, pLeft.y, pLeft.z);
            vertices.push(pRight.x, pRight.y, pRight.z);

            if (i < points.length - 1) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }

        const ribbonGeometry = new THREE.BufferGeometry();
        ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ribbonGeometry.setIndex(indices);
        ribbonGeometry.computeVertexNormals();
        
        const baseColor = new THREE.Color(routeColor);
        const neonColor = baseColor.clone();
        
        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        if (luminance < 0.5) {
            neonColor.lerp(new THREE.Color(0xffffff), 0.25); 
        }
        
        const ribbonMaterial = new THREE.MeshBasicMaterial({ 
            color: neonColor, 
            side: THREE.DoubleSide,
            transparent: true, 
            opacity: 0.75,
            depthWrite: false
        });
        
        const ribbonMesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
        // ★自社空路の描画優先: プレイヤーは最前面（リボン: 5, AI: 1）
        ribbonMesh.renderOrder = isPlayer ? 5 : 1;
        ribbonMesh.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(ribbonMesh);

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: neonColor,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        const coreLine = new THREE.Line(lineGeometry, lineMaterial);
        // ★自社空路の描画優先: プレイヤーは最前面（芯ライン: 6, AI: 2）
        coreLine.renderOrder = isPlayer ? 6 : 2;
        coreLine.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(coreLine);

        if (!this.network[companyId]) this.network[companyId] = {};
        if (!this.network[companyId][fromData.id]) this.network[companyId][fromData.id] = [];
        if (!this.network[companyId][toData.id]) this.network[companyId][toData.id] = [];

        const now = Date.now();
        this.network[companyId][fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData, isOperational: false, createdAt: now });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[companyId][toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData, isOperational: false, createdAt: now });

        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
        }

        return true;
    }

    removeRoute(fromData, toData, companyId = 'player') {
        if (!fromData || !toData) return false;
        const fromId = typeof fromData === 'object' ? fromData.id : fromData;
        const toId = typeof toData === 'object' ? toData.id : toData;
        
        if (!this.network[companyId]) return false;

        if (this.network[companyId][fromId]) {
            this.network[companyId][fromId] = this.network[companyId][fromId].filter(r => r.id !== toId);
        }
        if (this.network[companyId][toId]) {
            this.network[companyId][toId] = this.network[companyId][toId].filter(r => r.id !== fromId);
        }

        const objectsToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData && child.userData.companyId === companyId) {
                const u = child.userData;
                if ((u.fromId === fromId && u.toId === toId) || (u.fromId === toId && u.toId === fromId)) {
                    objectsToRemove.push(child);
                }
            }
        });

        objectsToRemove.forEach(obj => {
            this.routeGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
        }

        return true;
    }

    removeAllRoutesForAirport(airportId, companyId = 'player') {
        if (!this.network[companyId] || !this.network[companyId][airportId]) return;

        const connectedRoutes = [...this.network[companyId][airportId]];
        connectedRoutes.forEach(route => {
            this.removeRoute(airportId, route.id, companyId);
        });
    }

    clearAllRoutes(companyId = 'player') {
        if (!this.network[companyId]) return;

        const objectsToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData && child.userData.companyId === companyId) {
                objectsToRemove.push(child);
            }
        });

        objectsToRemove.forEach(obj => {
            this.routeGroup.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        this.network[companyId] = {};

        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
        }
    }

    getRandomRouteFrom(airportId, companyId = 'player') {
        if (!this.network[companyId]) return null;
        const routes = this.network[companyId][airportId];
        if (!routes || routes.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * routes.length);
        return routes[randomIndex];
    }

    getRandomConnectedAirport(companyId = 'player') {
        if (!this.network[companyId]) return null;
        const connectedIds = Object.keys(this.network[companyId]).filter(id => this.network[companyId][id].length > 0);
        if (connectedIds.length === 0) return null;
        return connectedIds[Math.floor(Math.random() * connectedIds.length)];
    }

    _updateCachedTotalLength() {
        this.cachedTotalLength = this._calculateTotalNetworkLength('player');
    }

    _updateAiCachedTotalLength(companyId) {
        if (companyId !== 'player') {
            this.aiCachedTotalLengths[companyId] = this._calculateTotalNetworkLength(companyId);
        }
    }

    _calculateTotalNetworkLength(companyId) {
        let totalLength = 0;
        const compNetwork = this.network[companyId];
        if (!compNetwork) return 0;
        
        const processedRoutes = new Set();
        
        for (const originId in compNetwork) {
            const routes = compNetwork[originId];
            routes.forEach(route => {
                const routeKey1 = `${originId}-${route.id}`;
                const routeKey2 = `${route.id}-${originId}`;
                
                if (!processedRoutes.has(routeKey1) && !processedRoutes.has(routeKey2)) {
                    totalLength += route.length;
                    processedRoutes.add(routeKey1);
                }
            });
        }
        return totalLength;
    }

    get playerTotalNetworkLength() {
        return this.cachedTotalLength;
    }

    getAiTotalNetworkLength(companyId) {
        return this.aiCachedTotalLengths[companyId] || 0;
    }
}