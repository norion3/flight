/**
 * AI可読性・先祖返り防止コメント:
 * 【空路の発光表現の美観最適化】
 * 履歴133に基づき、加算合成の透明度を下げすぎたことによる「単線の視認性低下」を解消。
 * ベース色を少し濃いシアン（0x0ea5e9）にし、opacityを0.65に設定することで、
 * 「1本でも美しく見え、重なると眩く光る」デザイン工学的なベストバランスを適用しました。
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
        
        // ★修正: 色を濃いシアンにし、透明度を0.65にすることで、単線時の視認性と交差時の発光を両立。
        const material = new THREE.LineBasicMaterial({ 
            color: 0x0ea5e9, 
            transparent: true, 
            opacity: 0.65, 
            blending: THREE.AdditiveBlending 
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