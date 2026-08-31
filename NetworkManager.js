/**
 * AI可読性・先祖返り防止コメント:
 * 【UI破壊防止（後方互換性） ＋ AI総延長キャッシュの安全追加】
 * 既存の `cachedTotalLength` とゲッター `playerTotalNetworkLength` を一切改変せずそのまま維持。
 * AI専用のキャッシュ辞書 `aiCachedTotalLengths` を新たに設け、UIのクラッシュ原因を完全に根絶しました。
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
        
        // プレイヤー専用のキャッシュ（既存UIが依存しているため絶対に消さない）
        this.cachedTotalLength = 0;
        
        // ★追加: AI専用のキャッシュ辞書
        this.aiCachedTotalLengths = {};
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                this.aiCachedTotalLengths[comp.id] = 0;
            }
        });
    }

    getConnectionCount(airportId, companyId = 'player') {
        return this.network[companyId][airportId] ? this.network[companyId][airportId].length : 0;
    }

    isConnected(fromId, toId, companyId = 'player') {
        if (!this.network[companyId][fromId]) return false;
        return this.network[companyId][fromId].some(dest => dest.id === toId);
    }

    canConnect(fromData, toData, companyId = 'player') {
        if (fromData.id === toData.id) return false;

        const fromCount = this.getConnectionCount(fromData.id, companyId);
        const toCount = this.getConnectionCount(toData.id, companyId);
        const fromMax = this.MAX_CONNECTIONS[fromData.type];
        const toMax = this.MAX_CONNECTIONS[toData.type];

        if (fromCount >= fromMax || toCount >= toMax) return false;

        if (this.isConnected(fromData.id, toData.id, companyId)) return false;

        return true;
    }

    addRoute(fromData, toData, companyId = 'player') {
        if (!this.canConnect(fromData, toData, companyId)) return false;

        const compIndex = CONFIG.COMPANIES.findIndex(c => c.id === companyId);
        const comp = CONFIG.COMPANIES[compIndex];
        const routeColor = comp ? comp.routeColor : 0x0ea5e9;
        
        // Zファイティング防止の微小オフセット
        const offset = Math.max(0, compIndex) * 0.0002;

        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS + 0.02 + offset);

        const midPoint = posA.clone().lerp(posB, 0.5);
        const distance = posA.distanceTo(posB);
        midPoint.normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.02 + offset + distance * 0.3);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const curveLength = curve.getLength();

        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const baseColor = new THREE.Color(routeColor);
        const neonColor = baseColor.clone();
        
        // 色の明るさ（輝度）を計算し、暗い色のみに純白をブレンドして白ボケを防ぐ
        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        if (luminance < 0.5) {
            neonColor.lerp(new THREE.Color(0xffffff), 0.2); 
        }
        
        const material = new THREE.LineBasicMaterial({ 
            color: neonColor, 
            transparent: true, 
            opacity: 0.65 
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        
        this.routeGroup.add(line);

        if (!this.network[companyId][fromData.id]) this.network[companyId][fromData.id] = [];
        if (!this.network[companyId][toData.id]) this.network[companyId][toData.id] = [];

        this.network[companyId][fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[companyId][toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData });

        // キャッシュ更新の切り分け
        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId); // ★追加
        }

        return true;
    }

    removeRoute(fromData, toData, companyId = 'player') {
        const fromId = typeof fromData === 'object' ? fromData.id : fromData;
        const toId = typeof toData === 'object' ? toData.id : toData;
        
        if (this.network[companyId][fromId]) {
            this.network[companyId][fromId] = this.network[companyId][fromId].filter(r => r.id !== toId);
        }
        if (this.network[companyId][toId]) {
            this.network[companyId][toId] = this.network[companyId][toId].filter(r => r.id !== fromId);
        }

        const linesToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData && child.userData.companyId === companyId) {
                const u = child.userData;
                if ((u.fromId === fromId && u.toId === toId) || (u.fromId === toId && u.toId === fromId)) {
                    linesToRemove.push(child);
                }
            }
        });

        linesToRemove.forEach(line => {
            this.routeGroup.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });

        // キャッシュ更新の切り分け
        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId); // ★追加
        }

        return true;
    }

    getRandomRouteFrom(airportId, companyId = 'player') {
        const routes = this.network[companyId][airportId];
        if (!routes || routes.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * routes.length);
        return routes[randomIndex];
    }

    getRandomConnectedAirport(companyId = 'player') {
        const connectedIds = Object.keys(this.network[companyId]).filter(id => this.network[companyId][id].length > 0);
        if (connectedIds.length === 0) return null;
        return connectedIds[Math.floor(Math.random() * connectedIds.length)];
    }

    // プレイヤー用キャッシュ更新
    _updateCachedTotalLength() {
        this.cachedTotalLength = this._calculateTotalNetworkLength('player');
    }

    // ★追加: AI用キャッシュ更新
    _updateAiCachedTotalLength(companyId) {
        if (companyId !== 'player') {
            this.aiCachedTotalLengths[companyId] = this._calculateTotalNetworkLength(companyId);
        }
    }

    // 実際の計算メソッド（毎フレームではなく、必要な時だけ呼ばれる）
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

    // プレイヤー用の軽量なゲッター（既存UIが依存。絶対に消さない）
    get playerTotalNetworkLength() {
        return this.cachedTotalLength;
    }

    // ★追加: AI用の軽量なゲッター
    getAiTotalNetworkLength(companyId) {
        return this.aiCachedTotalLengths[companyId] || 0;
    }
}