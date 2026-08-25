/**
 * AI可読性・先祖返り防止コメント:
 * 【極細分化ハイブリッドパスによるデザイン完全再現】
 * 履歴240に基づき、スプラインのうねりを根絶するため、機体を18のパーツに細分化し、
 * 直線（lineTo）と曲線（bezierCurveTo）を適材適所で使い分ける設計に全面改修しました。
 * 鋭い主翼・美しい胴体テーパー・完全に水平な尾翼底面など、理想のシルエットを数学的に完全再現しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class PlaneManager {
    constructor(scene, globeGroup, networkManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.networkManager = networkManager;
        
        this.planes = [];
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);

        this.baseGeometry = this._createPlaneGeometry();
    }

    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        
        // ユーザー提示画像に基づく、18パーツ構成の極細分化ハイブリッドパス
        shape.moveTo(0, 0.5);

        // --- 右半分のシルエット ---
        shape.bezierCurveTo(0.075, 0.5, 0.125, 0.45, 0.125, 0.35);         // 機首の美しいR
        shape.lineTo(0.125, 0.15);                                         // 胴体前部（スマートな直線）
        shape.lineTo(0.475, -0.1);                                         // 主翼前縁（鋭い後退角の直線）
        shape.bezierCurveTo(0.525, -0.125, 0.525, -0.175, 0.475, -0.2);    // 翼端の複合カーブ
        shape.lineTo(0.125, -0.25);                                        // 主翼後縁（シャープな直線）
        shape.lineTo(0.075, -0.375);                                       // 胴体後部（美しいテーパー直線）
        shape.lineTo(0.3, -0.45);                                          // 尾翼前縁（小ぶりな後退角）
        shape.bezierCurveTo(0.325, -0.46, 0.325, -0.5, 0.275, -0.5);       // 尾翼端のR
        shape.lineTo(0, -0.5);                                             // 尾翼底面（完全に水平な直線）

        // --- 左半分のシルエット（完全対称） ---
        shape.lineTo(-0.275, -0.5);                                        // 尾翼底面
        shape.bezierCurveTo(-0.325, -0.5, -0.325, -0.46, -0.3, -0.45);     // 尾翼端のR
        shape.lineTo(-0.075, -0.375);                                      // 尾翼前縁〜胴体
        shape.lineTo(-0.125, -0.25);                                       // 胴体後部テーパー
        shape.lineTo(-0.475, -0.2);                                        // 主翼後縁
        shape.bezierCurveTo(-0.525, -0.175, -0.525, -0.125, -0.475, -0.1); // 翼端の複合カーブ
        shape.lineTo(-0.125, 0.15);                                        // 主翼前縁
        shape.lineTo(-0.125, 0.35);                                        // 胴体前部ストレート
        shape.bezierCurveTo(-0.125, 0.45, -0.075, 0.5, 0, 0.5);            // 機首の美しいR

        // 曲線の分割解像度は高解像度(64)を維持し、ギザギザを絶対に防ぐ
        const geometry = new THREE.ShapeGeometry(shape, 64);
        geometry.center();
        
        return geometry;
    }

    addPlane(sizeType, companyId = 'player') {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport(companyId);
        if (!spawnAirportId) return false; 

        const routeData = this.networkManager.getRandomRouteFrom(spawnAirportId, companyId);
        if (!routeData) return false;

        let scale = 0.11;
        let speed = 0.20; 
        if (sizeType === 'small') { scale = 0.09; speed = 0.20; }
        else if (sizeType === 'medium') { scale = 0.11; speed = 0.18; }
        else if (sizeType === 'large') { scale = 0.13; speed = 0.16; }
        else if (sizeType === 'super') { scale = 0.15; speed = 0.14; }

        const compIndex = CONFIG.COMPANIES.findIndex(c => c.id === companyId);
        const comp = CONFIG.COMPANIES[compIndex];
        const planeColor = comp ? comp.planeColor : 0x34d399;
        
        const material = new THREE.MeshBasicMaterial({ 
            color: planeColor,      
            transparent: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(this.baseGeometry, material);
        mesh.scale.set(scale, scale, scale);
        
        this.planeGroup.add(mesh);

        const altitudeOffset = Math.max(0, compIndex) * 0.0005;

        this.planes.push({
            mesh: mesh,
            currentAirportId: spawnAirportId,
            currentRoute: routeData,
            progress: 0,
            baseSpeed: speed,
            originalScale: scale,
            companyId: companyId,
            altitudeOffset: altitudeOffset
        });

        return true;
    }

    checkAndReassignPlanes(companyId = 'player') {
        this.planes.forEach(plane => {
            if (plane.companyId !== companyId) return;

            if (!plane.currentRoute) {
                this._reassignPlane(plane);
                return;
            }

            const currentFromId = plane.currentAirportId;
            const currentToId = plane.currentRoute.id;
            
            const routesFromHere = this.networkManager.network[companyId][currentFromId];
            let routeStillExists = false;
            
            if (routesFromHere) {
                routeStillExists = routesFromHere.some(r => r.id === currentToId);
            }

            if (!routeStillExists) {
                this._reassignPlane(plane);
            }
        });
    }

    _reassignPlane(plane) {
        let nextRoute = null;
        let spawnAirportId = plane.currentAirportId; 

        if (spawnAirportId) {
            nextRoute = this.networkManager.getRandomRouteFrom(spawnAirportId, plane.companyId);
        }

        if (!nextRoute) {
            spawnAirportId = this.networkManager.getRandomConnectedAirport(plane.companyId);
            if (spawnAirportId) {
                nextRoute = this.networkManager.getRandomRouteFrom(spawnAirportId, plane.companyId);
            }
        }

        if (!nextRoute) {
            plane.mesh.visible = false;
            plane.currentAirportId = null;
            plane.currentRoute = null;
            plane.progress = 0;
            return;
        }

        plane.mesh.visible = true;
        plane.currentAirportId = spawnAirportId;
        plane.currentRoute = nextRoute;
        plane.progress = 0;
    }

    wakeUpPlanes(companyId = 'player') {
        this.planes.forEach(plane => {
            if (plane.companyId === companyId && !plane.mesh.visible) {
                this._reassignPlane(plane);
            }
        });
    }

    updateScale(camera) {
        this.planes.forEach(plane => {
            if (!plane.mesh.visible) return;

            const pos = new THREE.Vector3();
            plane.mesh.getWorldPosition(pos);
            const distance = camera.position.distanceTo(pos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 1.8)); 
            
            const finalScale = plane.originalScale * baseScale;
            plane.mesh.scale.set(finalScale, finalScale, finalScale);
        });
    }

    update(delta) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            if (!plane.currentRoute || !plane.mesh.visible) continue;

            const curve = plane.currentRoute.curve;
            const length = plane.currentRoute.length;
            
            const speedFactor = plane.baseSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                const nextAirportId = plane.currentRoute.id;
                const nextRoute = this.networkManager.getRandomRouteFrom(nextAirportId, plane.companyId);
                
                if (nextRoute) {
                    plane.currentAirportId = nextAirportId;
                    plane.currentRoute = nextRoute;
                    plane.progress = 0;
                } else {
                    plane.progress = 1.0; 
                }
            } else {
                const position = curve.getPointAt(plane.progress);
                const tangent = curve.getTangentAt(plane.progress).normalize(); 
                const up = position.clone().normalize(); 
                
                const offsetPosition = position.clone().add(up.clone().multiplyScalar(0.005 + plane.altitudeOffset));
                plane.mesh.position.copy(offsetPosition);

                const right = new THREE.Vector3().crossVectors(tangent, up);
                
                if (right.lengthSq() > 0.000001) {
                    right.normalize();
                    const matrix = new THREE.Matrix4().makeBasis(right, tangent, up);
                    plane.mesh.quaternion.setFromRotationMatrix(matrix);
                }
            }
        }
    }
}