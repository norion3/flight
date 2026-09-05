/**
 * AI可読性・先祖返り防止コメント:
 * 【空路ハイブリッド描画の最適化 ＆ Zファイティング完全防止 ＆ 安全ガード強化】
 * 1. 【Zファイティング解消】リボンメッシュおよび芯ラインに `depthWrite: false` を適用し、
 *    `renderOrder`（リボン: 1, 芯ライン: 2）で描画順を固定。航路交差時や同心配置時のチラつき・黒ずみを完全根絶。
 * 2. 【リボン幅の最適化】拡大時に上品な発光帯として視認できるよう `halfWidth = 0.005` に微調整。
 * 3. 【堅牢なガード】引数がオブジェクトまたはID文字列のどちらで渡されてもクラッシュしない安全フォールバックを実装。
 * 4. 【リソース破棄メソッド】撤退時やリセット時にメモリリークを防ぐ `removeAllRoutesForAirport` / `clearAllRoutes` を新設。
 * 5. 機体飛行用 `{ id, curve, length, data }` 構造、ベジェ制御点計算、距離キャッシュ等は100%完全保持。
 * 6. 【追加】就航アクティブ制のための内部実績フラグ（`isOperational`）および `setRouteOperational` を実装。
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

    getConnectionCount(airportId, companyId = 'player') {
        if (!this.network[companyId]) return 0;
        return this.network[companyId][airportId] ? this.network[companyId][airportId].length : 0;
    }

    isConnected(fromId, toId, companyId = 'player') {
        if (!this.network[companyId] || !this.network[companyId][fromId]) return false;
        return this.network[companyId][fromId].some(dest => dest.id === toId);
    }

    canConnect(fromData, toData, companyId = 'player') {
        if (!fromData || !toData) return false;
        if (fromData.id === toData.id) return false;

        const fromCount = this.getConnectionCount(fromData.id, companyId);
        const toCount = this.getConnectionCount(toData.id, companyId);
        
        const fromMax = this.MAX_CONNECTIONS[fromData.type] || 5;
        const toMax = this.MAX_CONNECTIONS[toData.type] || 5;

        if (fromCount >= fromMax || toCount >= toMax) return false;

        if (this.isConnected(fromData.id, toData.id, companyId)) return false;

        return true;
    }

    // ★追加: 路線を実際に飛行機が飛んだ際に就航フラグを両方向有効化するメソッド
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
        
        // 陣営ごとのZファイティング防止オフセット
        const offset = Math.max(0, compIndex) * 0.0003;

        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);

        // 大円上の真中点を厳密に通過するベジェ曲線の制御点計算
        const chordMid = posA.clone().lerp(posB, 0.5);
        const distance = posA.distanceTo(posB);

        const midDir = chordMid.clone();
        if (midDir.lengthSq() > 0.000001) {
            midDir.normalize();
        } else {
            midDir.copy(posA).normalize();
        }

        // アーチ最高点（ピーク）の高度
        const peakAltitude = CONFIG.GLOBE_RADIUS + 0.02 + offset + (distance * 0.20) + 0.03;
        const peakPoint = midDir.multiplyScalar(peakAltitude);

        // 2次ベジェ曲線が t=0.5 で peakPoint を通過する制御点を逆算
        const midPoint = peakPoint.clone().multiplyScalar(2).sub(chordMid);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const curveLength = curve.getLength();

        const points = curve.getPoints(50);
        
        // ★拡大時にネオン帯として美しく視認できる最適な幅（0.005）
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
        
        // 暗い色味の場合は純白をブレンドして発色を確保
        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        if (luminance < 0.5) {
            neonColor.lerp(new THREE.Color(0xffffff), 0.25); 
        }
        
        // ① 拡大時の存在感を担当するリボンメッシュ（depthWrite: false でZファイティング防止）
        const ribbonMaterial = new THREE.MeshBasicMaterial({ 
            color: neonColor, 
            side: THREE.DoubleSide,
            transparent: true, 
            opacity: 0.75,
            depthWrite: false
        });
        
        const ribbonMesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
        ribbonMesh.renderOrder = 1;
        ribbonMesh.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(ribbonMesh);

        // ② 縮小時の1px実線描画を保証する芯ライン（depthWrite: false & 最前面描画）
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: neonColor,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        const coreLine = new THREE.Line(lineGeometry, lineMaterial);
        coreLine.renderOrder = 2;
        coreLine.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(coreLine);

        if (!this.network[companyId]) this.network[companyId] = {};
        if (!this.network[companyId][fromData.id]) this.network[companyId][fromData.id] = [];
        if (!this.network[companyId][toData.id]) this.network[companyId][toData.id] = [];

        // 飛行移動に必要な curve, length, data を格納（★isOperational: false で初期化）
        this.network[companyId][fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData, isOperational: false });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[companyId][toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData, isOperational: false });

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

        // リボンメッシュと芯ラインの両方を一括回収・破棄
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

    /**
     * 指定された空港に接続する全路線を一括削除（撤退処理用）
     */
    removeAllRoutesForAirport(airportId, companyId = 'player') {
        if (!this.network[companyId] || !this.network[companyId][airportId]) return;

        const connectedRoutes = [...this.network[companyId][airportId]];
        connectedRoutes.forEach(route => {
            this.removeRoute(airportId, route.id, companyId);
        });
    }

    /**
     * 指定会社の全路線を破棄（リセット・全滅時用）
     */
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

    // プレイヤー用キャッシュ更新
    _updateCachedTotalLength() {
        this.cachedTotalLength = this._calculateTotalNetworkLength('player');
    }

    // AI用キャッシュ更新
    _updateAiCachedTotalLength(companyId) {
        if (companyId !== 'player') {
            this.aiCachedTotalLengths[companyId] = this._calculateTotalNetworkLength(companyId);
        }
    }

    // 距離集計
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