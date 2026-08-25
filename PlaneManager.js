/**
 * AI可読性・先祖返り防止コメント:
 * 【黄金率・デザイン工学に基づく究極の2Dシルエット】
 * 履歴241に基づき、飛行機のプロポーションを黄金比で完全再設計しました。
 * スマートな胴体、ワイドな翼幅、鋭い後退角、滑らかなフィレット（付け根のカーブ）、
 * そして完全に水平な尾翼底面を、ハイブリッドパスで幾何学的に完璧に構成しています。
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
        
        // 黄金比とデザイン工学に基づく究極のハイブリッド・マスターパス
        shape.moveTo(0, 0.5);

        // --- 右半分のシルエット ---
        shape.bezierCurveTo(0.075, 0.5, 0.11, 0.425, 0.11, 0.325);       // 機首の流線型カーブ
        shape.lineTo(0.11, 0.15);                                        // 胴体前部（スマートなストレート）
        shape.bezierCurveTo(0.11, 0.1, 0.125, 0.075, 0.175, 0.05);       // 主翼前縁の滑らかなフィレット（付け根）
        shape.lineTo(0.525, -0.125);                                     // 主翼前縁（鋭い後退角を持つ直線）
        shape.bezierCurveTo(0.575, -0.15, 0.575, -0.2, 0.525, -0.225);   // 翼端の複合カーブ（平坦部とRの融合）
        shape.lineTo(0.125, -0.3);                                       // 主翼後縁（シャープな直線）
        shape.bezierCurveTo(0.09, -0.31, 0.08, -0.34, 0.08, -0.375);     // 主翼後縁の滑らかなフィレット
        shape.lineTo(0.05, -0.44);                                       // 胴体後部（美しいテーパー直線）
        shape.lineTo(0.25, -0.48);                                       // 尾翼前縁（シャープな直線）
        shape.bezierCurveTo(0.275, -0.49, 0.275, -0.5, 0.25, -0.5);      // 尾翼端の極小R
        shape.lineTo(0, -0.5);                                           // 尾翼底面（完全に水平な直線）

        // --- 左半分のシルエット（完全対称） ---
        shape.lineTo(-0.25, -0.5);                                       // 尾翼底面
        shape.bezierCurveTo(-0.275, -0.5, -0.275, -0.49, -0.25, -0.48);  // 尾翼端の極小R
        shape.lineTo(-0.05, -0.44);                                      // 尾翼前縁〜胴体
        shape.lineTo(-0.08, -0.375);                                     // 胴体後部テーパー
        shape.bezierCurveTo(-0.08, -0.34, -0.09, -0.31, -0.125, -0.3);   // 主翼後縁フィレット
        shape.lineTo(-0.525, -0.225);                                    // 主翼後縁
        shape.bezierCurveTo(-0.575, -0.2, -0.575, -0.15, -0.525, -0.125);// 翼端の複合カーブ
        shape.lineTo(-0.175, 0.05);                                      // 主翼前縁
        shape.bezierCurveTo(-0.125, 0.075, -0.11, 0.1, -0.11, 0.15);     // 主翼前縁フィレット
        shape.lineTo(-0.11, 0.325);                                      // 胴体前部ストレート
        shape.bezierCurveTo(-0.11, 0.425, -0.075, 0.5, 0, 0.5);          // 機首の流線型カーブ

        // ギザギザを絶対に防ぐ高解像度分割 (curveSegments: 64)
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