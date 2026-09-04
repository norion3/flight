/**
 * AI可読性・先祖返り防止コメント:
 * 【空路のハイブリッド方式（芯ライン＋リボンメッシュ） ＆ 縮小時点線化の完全根絶 ＆ 全機能完全保持】
 * 1. 拡大時の見やすさを担う「リボンメッシュ（halfWidth = 0.002）」と、
 * 縮小時に1pxの実線描画をGPUレベルで保証する「芯のライン（THREE.Line）」を同心上に一体生成。
 * これにより、ズームイン時は上品な太さで見え、ズームアウト時にも点線化・モアレ・かすれが一切起きず滑らかに繋がります。
 * 2. 路線削除時（removeRoute）にリボンと芯ラインの両方が確実にdispose & removeされるようクリーンアップを統一。
 * 3. 機体飛行に不可欠な `{ id, curve, length, data }` 構造は100%完全維持し、機体非表示バグを防止。
 * 4. 大円の真中点を厳密に通過するベジェ曲線の制御点計算（midPoint = 2 * peakPoint - chordMid）は完全保持。
 * 5. プレイヤー用キャッシュ・AI用キャッシュの独立管理およびUI互換ゲッターは100%完全保持。
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
        
        // AI専用のキャッシュ辞書
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

        // 大円上の真中点を厳密に通過するベジェ曲線の制御点計算
        const chordMid = posA.clone().lerp(posB, 0.5);
        const distance = posA.distanceTo(posB);

        const midDir = chordMid.clone();
        if (midDir.lengthSq() > 0.000001) {
            midDir.normalize();
        } else {
            midDir.copy(posA).normalize();
        }

        // アーチの最高点（ピーク）の目標高度
        const peakAltitude = CONFIG.GLOBE_RADIUS + 0.02 + offset + (distance * 0.20) + 0.03;
        const peakPoint = midDir.multiplyScalar(peakAltitude);

        // 2次ベジェ曲線が t=0.5 で peakPoint を寸分違わず通過するための制御点を逆算
        const midPoint = peakPoint.clone().multiplyScalar(2).sub(chordMid);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const curveLength = curve.getLength();

        const points = curve.getPoints(50);
        const halfWidth = 0.002; 
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

            // 左右の頂点を展開して帯を形成
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
        
        // 暗い色のみに純白をブレンドして白ボケを防ぐ
        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        if (luminance < 0.5) {
            neonColor.lerp(new THREE.Color(0xffffff), 0.2); 
        }
        
        // ① 拡大時の見やすさを担当するリボンメッシュ
        const ribbonMaterial = new THREE.MeshBasicMaterial({ 
            color: neonColor, 
            side: THREE.DoubleSide,
            transparent: true, 
            opacity: 0.85 
        });
        
        const ribbonMesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
        ribbonMesh.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(ribbonMesh);

        // ② ★ハイブリッド方式：縮小時の点線化を防ぎ、1px実線描画を保証する芯のライン
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: neonColor,
            transparent: true,
            opacity: 0.95
        });
        const coreLine = new THREE.Line(lineGeometry, lineMaterial);
        coreLine.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(coreLine);

        if (!this.network[companyId][fromData.id]) this.network[companyId][fromData.id] = [];
        if (!this.network[companyId][toData.id]) this.network[companyId][toData.id] = [];

        // 機体移動に必要な curve, length, data を100%維持して格納
        this.network[companyId][fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[companyId][toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData });

        // キャッシュ更新の切り分け
        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
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

        // リボンメッシュと芯ラインの両方を一括で回収・破棄
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

        // キャッシュ更新の切り分け
        if (companyId === 'player') {
            this._updateCachedTotalLength();
        } else {
            this._updateAiCachedTotalLength(companyId);
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

    // AI用キャッシュ更新
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

    // AI用の軽量なゲッター
    getAiTotalNetworkLength(companyId) {
        return this.aiCachedTotalLengths[companyId] || 0;
    }
}