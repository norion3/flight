/**
 * AI可読性・先祖返り防止コメント:
 * 【確実な空路削除とメモリ解放】
 * 履歴141に基づき、線を削除するための removeRoute メソッドを追加しました。
 * 削除の際は単に配列から抜くだけでなく、geometry.dispose() と material.dispose() を
 * 確実に実行し、ブラウザのGPUメモリのパンクを防いでいます。
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
        
        this.MAX_CONNECTIONS = {
            'major': 8,
            'local': 5,
            'fictional': 3
        };
    }

    getConnectionCount(airportId) {
        return this.network[airportId] ? this.network[airportId].length : 0;
    }

    // ★追加: 特定の2つの空港がすでに接続されているかを判定する
    isConnected(fromId, toId) {
        if (!this.network[fromId]) return false;
        return this.network[fromId].some(dest => dest.id === toId);
    }

    canConnect(fromData, toData) {
        if (fromData.id === toData.id) return false;

        const fromCount = this.getConnectionCount(fromData.id);
        const toCount = this.getConnectionCount(toData.id);
        const fromMax = this.MAX_CONNECTIONS[fromData.type];
        const toMax = this.MAX_CONNECTIONS[toData.type];

        if (fromCount >= fromMax || toCount >= toMax) return false;

        if (this.isConnected(fromData.id, toData.id)) return false;

        return true;
    }

    addRoute(fromData, toData) {
        if (!this.canConnect(fromData, toData)) return false;

        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS + 0.02);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS + 0.02);

        const midPoint = posA.clone().lerp(posB, 0.5);
        const distance = posA.distanceTo(posB);
        midPoint.normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.02 + distance * 0.3);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const curveLength = curve.getLength();

        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0x0ea5e9, 
            transparent: true, 
            opacity: 0.65, 
            blending: THREE.AdditiveBlending 
        });
        
        const line = new THREE.Line(geometry, material);
        // ★修正: 削除時に特定できるようuserDataに両端のIDをタグ付けする
        line.userData = { fromId: fromData.id, toId: toData.id };
        
        this.routeGroup.add(line);

        if (!this.network[fromData.id]) this.network[fromData.id] = [];
        if (!this.network[toData.id]) this.network[toData.id] = [];

        this.network[fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData });

        return true;
    }

    // ★追加: 空路を削除し、メモリを確実に解放する機能
    removeRoute(fromData, toData) {
        const fromId = fromData.id;
        const toId = toData.id;
        
        // ネットワークデータ(配列)からの削除
        if (this.network[fromId]) {
            this.network[fromId] = this.network[fromId].filter(r => r.id !== toId);
        }
        if (this.network[toId]) {
            this.network[toId] = this.network[toId].filter(r => r.id !== fromId);
        }

        // 3Dオブジェクト(Line)の検索と確実なDispose処理
        const linesToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData) {
                const u = child.userData;
                // A->B でも B->A でも同一の線として判定
                if ((u.fromId === fromId && u.toId === toId) || (u.fromId === toId && u.toId === fromId)) {
                    linesToRemove.push(child);
                }
            }
        });

        // 確実なメモリ解放(Dispose)
        linesToRemove.forEach(line => {
            this.routeGroup.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });

        return true;
    }

    getRandomRouteFrom(airportId) {
        const routes = this.network[airportId];
        if (!routes || routes.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * routes.length);
        return routes[randomIndex];
    }

    getRandomConnectedAirport() {
        const connectedIds = Object.keys(this.network).filter(id => this.network[id].length > 0);
        if (connectedIds.length === 0) return null;
        return connectedIds[Math.floor(Math.random() * connectedIds.length)];
    }
}