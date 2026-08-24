/**
 * AI可読性・先祖返り防止コメント:
 * 【ライバルの色分け対応とZファイティング対策】
 * 履歴191に基づき、各社ごとの色で飛行機を生成し、
 * NetworkManagerと同様の高度オフセットを持たせることで、
 * 他社の飛行機と重なった際のチラつきを防止しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class PlaneManager {
    constructor(scene, globeGroup, networkManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.networkManager = networkManager;
        
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);
        
        this.planes = [];
    }

    addPlane(type, companyId = 'player') {
        const startAirport = this.networkManager.getRandomConnectedAirport(companyId);
        if (!startAirport) return false;

        const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
        const color = comp ? comp.color : 0xffffff;
        const offset = comp ? comp.altitudeOffset : 0;

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0.03, 0,
            -0.02, -0.02, 0,
            0.02, -0.02, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.MeshBasicMaterial({ 
            color: color, 
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.userData = {
            companyId: companyId,
            type: type,
            speed: type === 'small' ? 1.0 : type === 'medium' ? 1.2 : 1.5,
            currentAirport: startAirport,
            targetAirport: null,
            progress: 0,
            arcPoints: [],
            altitudeOffset: offset
        };
        
        this.planeGroup.add(mesh);
        this.planes.push(mesh);
        
        this.assignNextTarget(mesh);
        return true;
    }

    assignNextTarget(plane) {
        const u = plane.userData;
        const nextDest = this.networkManager.getRandomRouteFrom(u.currentAirport.id, u.companyId);
        
        if (!nextDest) {
            u.targetAirport = null;
            plane.visible = false;
            return;
        }

        u.targetAirport = nextDest;
        u.progress = 0;
        plane.visible = true;

        const posA = Utils.latLonToVector3(u.currentAirport.lat, u.currentAirport.lon, CONFIG.GLOBE_RADIUS + 0.005 + u.altitudeOffset);
        const posB = Utils.latLonToVector3(u.targetAirport.lat, u.targetAirport.lon, CONFIG.GLOBE_RADIUS + 0.005 + u.altitudeOffset);

        const dist = posA.distanceTo(posB);
        const arcHeight = dist * 0.15;
        const midPoint = new THREE.Vector3().copy(posA).lerp(posB, 0.5);
        midPoint.normalize().multiplyScalar(CONFIG.GLOBE_RADIUS + 0.005 + u.altitudeOffset + arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
        u.arcPoints = curve.getPoints(50);
    }

    updateScale(camera) {
        const dist = camera.position.length();
        const scale = Math.max(0.5, Math.min(2.0, dist / 15));
        this.planes.forEach(plane => {
            plane.scale.set(scale, scale, scale);
        });
    }

    update(delta) {
        this.planes.forEach(plane => {
            const u = plane.userData;
            if (!u.targetAirport) return;

            u.progress += (delta * 0.5 * u.speed); 
            if (u.progress >= 1.0) {
                u.currentAirport = u.targetAirport;
                this.assignNextTarget(plane);
            } else {
                const ptIndex = Math.floor(u.progress * 50);
                const nextIndex = Math.min(ptIndex + 1, 50);
                
                if (u.arcPoints[ptIndex] && u.arcPoints[nextIndex]) {
                    plane.position.copy(u.arcPoints[ptIndex]);
                    plane.lookAt(u.arcPoints[nextIndex]);
                    plane.rotateX(Math.PI / 2);
                }
            }
        });
    }

    wakeUpPlanes(companyId = 'player') {
        this.planes.forEach(plane => {
            if (plane.userData.companyId === companyId && !plane.userData.targetAirport) {
                this.assignNextTarget(plane);
            }
        });
    }

    checkAndReassignPlanes(companyId = 'player') {
        this.planes.forEach(plane => {
            if (plane.userData.companyId === companyId) {
                if (plane.userData.targetAirport) {
                    const isStillConnected = this.networkManager.isConnected(plane.userData.currentAirport.id, plane.userData.targetAirport.id, companyId);
                    if (!isStillConnected) {
                        this.assignNextTarget(plane);
                    }
                } else {
                    this.assignNextTarget(plane);
                }
            }
        });
    }
}