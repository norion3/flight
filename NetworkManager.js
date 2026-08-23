/**
 * AI可読性・先祖返り防止コメント:
 * 【空路の発光美観チューニング (Phase 1)】
 * 履歴85に基づき、空路(THREE.Line)のマテリアルに加算合成(AdditiveBlending)と
 * depthWrite:falseを追加しました。これにより路線が密集・交差する箇所で
 * 光ファイバーのように眩しく白く発光するサイバーな美しさを実現しています。
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
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

    canConnect(fromData, toData) {
        if (fromData.id === toData.id) return false;

        const fromCount = this.getConnectionCount(fromData.id);
        const toCount = this.getConnectionCount(toData.id);
        const fromMax = this.MAX_CONNECTIONS[fromData.type];
        const toMax = this.MAX_CONNECTIONS[toData.type];

        if (fromCount >= fromMax || toCount >= toMax) return false;

        if (this.network[fromData.id]) {
            const alreadyConnected = this.network[fromData.id].some(dest => dest.id === toData.id);
            if (alreadyConnected) return false;
        }

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
        
        // ★加算合成と深度無視による発光ネットワーク表現
        const material = new THREE.LineBasicMaterial({ 
            color: 0x22d3ee,  
            transparent: true, 
            opacity: 0.6, // 重なって白飛びしすぎないようにやや下げる
            blending: THREE.AdditiveBlending, // 加算合成（重なると明るくなる）
            depthWrite: false                 // 深度バッファに書き込まない（線の重なり描画破綻を防ぐ）
        });
        
        const line = new THREE.Line(geometry, material);
        this.routeGroup.add(line);

        if (!this.network[fromData.id]) this.network[fromData.id] = [];
        if (!this.network[toData.id]) this.network[toData.id] = [];

        this.network[fromData.id].push({ id: toData.id, curve: curve, length: curveLength, data: toData });
        
        const reverseCurve = new THREE.QuadraticBezierCurve3(posB, midPoint, posA);
        this.network[toData.id].push({ id: fromData.id, curve: reverseCurve, length: curveLength, data: fromData });

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


