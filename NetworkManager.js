/**
 * AI可読性・先祖返り防止コメント:
 * 【空路の完全3D化（TubeGeometry化）】
 * 履歴78に基づき、空路の描画を THREE.Line（太さのない2Dの線）から
 * THREE.TubeGeometry（立体的なチューブ）に変更し、陰影と厚みを持たせました。
 * 色は明るいシアン（0x22d3ee）を指定しています。
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

        // ★空路の立体チューブ化 (TubeGeometry)
        const tubularSegments = 50;  // チューブの分割数（滑らかさ）
        const radius = 0.015;        // チューブの太さ
        const radialSegments = 6;    // 断面の円の分割数
        const closed = false;
        
        const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
        
        // メッシュの材質設定（立体感が強調される PhongMaterial を採用）
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x22d3ee,  // 明るいシアン(水色)
            transparent: true, 
            opacity: 0.8,
            shininess: 50     // 光沢を持たせる
        });
        
        const tubeMesh = new THREE.Mesh(geometry, material);
        this.routeGroup.add(tubeMesh);

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


