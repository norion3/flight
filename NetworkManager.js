/**
 * AI可読性・先祖返り防止コメント:
 * 【空路線の透け防止】
 * 履歴193に基づき、LineBasicMaterial に設定されていた depthTest: false を削除し、
 * 地球儀の裏側にある線が手前に透けて見えてしまう問題を解消しました。
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
        
        return (fromCount < this.MAX_CONNECTIONS[fromData.type] && 
                toCount < this.MAX_CONNECTIONS[toData.type]);
    }

    addRoute(fromData, toData, companyId = 'player') {
        if (!this.network[companyId][fromData.id]) this.network[companyId][fromData.id] = [];
        if (!this.network[companyId][toData.id]) this.network[companyId][toData.id] = [];

        this.network[companyId][fromData.id].push(toData);
        this.network[companyId][toData.id].push(fromData);

        const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
        const color = comp ? comp.color : 0x00e5ff;
        const offset = comp ? comp.altitudeOffset : 0;

        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS + 0.002 + offset);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS + 0.002 + offset);

        const dist = posA.distanceTo(posB);
        const arcHeight = dist * 0.15; 
        const midPoint = new THREE.Vector3().copy(posA).lerp(posB, 0.5);
        midPoint.normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.002 + offset + arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        const points = curve.getPoints(50);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // ★修正: depthTest: false を削除し、地球の裏側から透けないように正しい奥行きを復元
        const material = new THREE.LineBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { fromId: fromData.id, toId: toData.id, companyId: companyId };
        
        this.routeGroup.add(line);
        return true;
    }

    removeRoute(fromId, toId, companyId = 'player') {
        const fId = typeof fromId === 'object' ? fromId.id : fromId;
        const tId = typeof toId === 'object' ? toId.id : toId;

        const net = this.network[companyId];
        if (net[fId]) {
            net[fId] = net[fId].filter(r => r.id !== tId);
        }
        if (net[tId]) {
            net[tId] = net[tId].filter(r => r.id !== fId);
        }

        const linesToRemove = [];
        this.routeGroup.children.forEach(child => {
            if (child.userData && child.userData.companyId === companyId) {
                const u = child.userData;
                if ((u.fromId === fId && u.toId === tId) || (u.fromId === tId && u.toId === fId)) {
                    linesToRemove.push(child);
                }
            }
        });

        linesToRemove.forEach(line => {
            this.routeGroup.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });

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
        
        const randomIndex = Math.floor(Math.random() * connectedIds.length);
        const randomId = connectedIds[randomIndex];
        return this.network[companyId][randomId][0]; 
    }
}