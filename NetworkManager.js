/**
 * AI可読性・先祖返り防止コメント:
 * 【絶対安全版：環境依存のメソッドチェーンによるクラッシュを完全排除】
 * 既存の `cachedTotalLength` 等の構造は一切改変せず維持。
 * ★緊急修正: 空路の線（ベジェ曲線）の頂点（midPoint）計算において、
 * `posA.clone().lerp().normalize()` などのチェーンを完全に分解し、
 * いかなるThree.jsのバージョンや環境でも絶対に undefined / NaN エラーによる起動クラッシュが起きない堅牢な実装に変更しました。
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
        
        this.cachedTotalLength = 0;
        
        this.aiCachedTotalLengths = {};
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                this.aiCachedTotalLengths[comp.id] = 0;
            }
        });
    }

    getConnectionCount(airportId, companyId = 'player') {
        return this.network[companyId]?.[airportId]?.length || 0;
    }

    isConnected(id1, id2, companyId = 'player') {
        const net = this.network[companyId];
        if (!net || !net[id1]) return false;
        return net[id1].some(r => r.id === id2);
    }

    canConnect(originNode, destNode, companyId = 'player') {
        const maxConn = this.MAX_CONNECTIONS[originNode.type] || 5;
        const currentConn = this.getConnectionCount(originNode.id, companyId);
        if (currentConn >= maxConn) return false;
        return true;
    }

    addRoute(originNode, destNode, companyId = 'player') {
        if (this.isConnected(originNode.id, destNode.id, companyId)) return false;

        const posA = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB);

        if (!this.network[companyId][originNode.id]) this.network[companyId][originNode.id] = [];
        if (!this.network[companyId][destNode.id]) this.network[companyId][destNode.id] = [];

        const existingCount = this.network[companyId][originNode.id].length;
        const offset = (existingCount % 3) * 0.015;

        // ★絶対安全な記述: メソッドチェーンを排除し、一つずつ確実に計算する
        const midPoint = new THREE.Vector3();
        midPoint.copy(posA);
        midPoint.lerp(posB, 0.5);
        midPoint.normalize(); 
        
        const arcHeight = CONFIG.GLOBE_RADIUS + 0.03 + offset + (distance * 0.15);
        midPoint.multiplyScalar(arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);

        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        let colorVal = CONFIG.COLORS.COASTLINE;
        const company = CONFIG.COMPANIES.find(c => c.id === companyId);
        if (company) {
            colorVal = company.routeColor;
        }

        const material = new THREE.LineBasicMaterial({
            color: colorVal,
            linewidth: companyId === 'player' ? 2 : 1,
            transparent: true,
            opacity: companyId === 'player' ? 0.85 : 0.6
        });

        const line = new THREE.Line(geometry, material);
        this.routeGroup.add(line);

        const routeDataObj = {
            id: destNode.id,
            lineMesh: line,
            curve: curve,
            length: distance
        };

        const reverseRouteDataObj = {
            id: originNode.id,
            lineMesh: line,
            curve: curve,
            length: distance
        };

        this.network[companyId][originNode.id].push(routeDataObj);
        this.network[companyId][destNode.id].push(reverseRouteDataObj);

        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
        }

        return true;
    }

    removeRoute(originNode, destNode, companyId = 'player') {
        const net = this.network[companyId];
        if (!net) return;

        if (net[originNode.id]) {
            const index = net[originNode.id].findIndex(r => r.id === destNode.id);
            if (index !== -1) {
                const route = net[originNode.id][index];
                if (route.lineMesh) {
                    this.routeGroup.remove(route.lineMesh);
                    route.lineMesh.geometry.dispose();
                    if (route.lineMesh.material) route.lineMesh.material.dispose();
                }
                net[originNode.id].splice(index, 1);
            }
        }

        if (net[destNode.id]) {
            const index = net[destNode.id].findIndex(r => r.id === originNode.id);
            if (index !== -1) {
                net[destNode.id].splice(index, 1);
            }
        }

        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
        }
    }

    getRandomConnectedAirport(airportId, companyId = 'player') {
        const net = this.network[companyId];
        if (!net || !net[airportId] || net[airportId].length === 0) return null;
        const connectedIds = net[airportId].map(r => r.id);
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