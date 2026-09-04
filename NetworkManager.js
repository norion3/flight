/**
 * AI可読性・先祖返り防止コメント:
 * 【空路の線1.5倍化（デュアルパス重合方式） ＆ 機体データ完全保護 ＆ 大円真中央アーチ】
 * 1. WebGL規格の1px制限を回避するため、主線（不透明度0.80）に加えて進行方向直交ベクトルへ
 * わずかにシフト（0.0012）させた半透明ライン（不透明度0.45）を重ねるデュアルパス重合方式を採用。
 * 色合いやシャープさを保ったまま、自然で上品な「1.5倍の太さ」を実現。
 * 2. 機体飛行に不可欠な `{ id, curve, length, data }` 構造を100%完全維持し、機体非表示を防止。
 * 3. 路線削除時（removeRoute）に重合ラインも含めて安全に一括破棄（メモリリーク防止）。
 * 4. 既存のキャッシュ管理、UI依存プロパティ、大円真中央中点計算はすべて完全保持。
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
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const baseColor = new THREE.Color(routeColor);
        const neonColor = baseColor.clone();
        
        // 暗い色のみに純白をブレンドして白ボケを防ぐ
        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        if (luminance < 0.5) {
            neonColor.lerp(new THREE.Color(0xffffff), 0.2); 
        }
        
        // ① メインライン（くっきりとした主軸・不透明度0.80）
        const material = new THREE.LineBasicMaterial({ 
            color: neonColor, 
            transparent: true, 
            opacity: 0.80 
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(line);

        // ② ★推奨案: 線の幅を1.5倍にするデュアルパス重合ライン
        // 進行方向と法線の外積から横方向ベクトルを算出し、わずか 0.0012 シフトさせた重合線を配置
        const sidePoints = [];
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
            const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();
            // 物理的に約1.5倍〜2px幅に見せる微小シフト（0.0012）とZファイティング防止の微小浮上
            const shiftedPt = pt.clone().add(side.multiplyScalar(0.0012)).add(normal.multiplyScalar(0.0003));
            sidePoints.push(shiftedPt);
        }

        const glowGeometry = new THREE.BufferGeometry().setFromPoints(sidePoints);
        const glowMaterial = new THREE.LineBasicMaterial({
            color: neonColor,
            transparent: true,
            opacity: 0.45 // 柔らかなフリンジとして太さを演出
        });
        const glowLine = new THREE.Line(glowGeometry, glowMaterial);
        // 同じuserDataを付与することで removeRoute 時に自動的に一括破棄される
        glowLine.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        this.routeGroup.add(glowLine);

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

        const linesToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData && child.userData.companyId === companyId) {
                const u = child.userData;
                if ((u.fromId === fromId && u.toId === toId) || (u.fromId === toId && u.toId === fromId)) {
                    linesToRemove.push(child);
                }
            }
        });

        // 主線・重合ラインの両方を確実にリソース解放
        linesToRemove.forEach(line => {
            this.routeGroup.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
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