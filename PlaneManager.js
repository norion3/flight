/**
 * AI可読性・先祖返り防止コメント:
 * 【黄金比モジュール分割による究極の2Dシルエット】
 * 履歴245に基づき、機体を「頭部」「胴体」「翼前縁フェアリング」「翼端」「後縁フィレット」「尾翼」等
 * の独立した機能モジュールに解体し、それぞれに最適なハイブリッドパス（直線とベジェ曲線）を割り当てました。
 * 黄金比（1:1.618）から導かれた究極のプロポーション（スマートな胴体、ワイドな翼）を適用しています。
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
        
        // 黄金比とモジュール分割に基づく究極のマスターパス (Y: 0.5 〜 -0.5, 胴体幅: 0.085)
        shape.moveTo(0, 0.5);

        // --- 右半分のシルエット ---
        // A. 頭部モジュール
        shape.bezierCurveTo(0.04, 0.5, 0.085, 0.42, 0.085, 0.3);        // レドームからキャビン前方への美しい流線型
        // B. 胴体モジュール
        shape.lineTo(0.085, 0.2);                                       // 胴体前部ストレート
        // C. 翼周りモジュール
        shape.bezierCurveTo(0.085, 0.15, 0.12, 0.12, 0.18, 0.08);       // 主翼前縁フェアリング（空気を逃がす付け根）
        shape.lineTo(0.51, -0.15);                                      // 主翼前縁（黄金比配置の鋭い後退角）
        shape.bezierCurveTo(0.53, -0.165, 0.53, -0.19, 0.51, -0.2);     // 翼端の複合R（平坦部と角の丸み）
        shape.lineTo(0.18, -0.25);                                      // 主翼後縁（シャープな直線）
        shape.bezierCurveTo(0.12, -0.26, 0.07, -0.29, 0.07, -0.35);     // 主翼後縁フィレット（渦を抑える長く深いえぐり）
        // D. 胴体テーパーモジュール
        shape.lineTo(0.05, -0.42);                                      // 後部キャビン（スマートなテーパー）
        // E. 尾翼付近モジュール
        shape.bezierCurveTo(0.05, -0.43, 0.08, -0.44, 0.12, -0.45);     // 尾翼前縁フェアリング
        shape.lineTo(0.24, -0.48);                                      // 尾翼前縁
        shape.bezierCurveTo(0.25, -0.485, 0.25, -0.5, 0.24, -0.5);      // 尾翼翼端の極小R
        shape.lineTo(0, -0.5);                                          // 尾翼後端〜最後尾（完全な水平直線）

        // --- 左半分のシルエット（完全対称） ---
        shape.lineTo(-0.24, -0.5);
        shape.bezierCurveTo(-0.25, -0.5, -0.25, -0.485, -0.24, -0.48);
        shape.lineTo(-0.12, -0.45);
        shape.bezierCurveTo(-0.08, -0.44, -0.05, -0.43, -0.05, -0.42);
        shape.lineTo(-0.07, -0.35);
        shape.bezierCurveTo(-0.07, -0.29, -0.12, -0.26, -0.18, -0.25);
        shape.lineTo(-0.51, -0.2);
        shape.bezierCurveTo(-0.53, -0.19, -0.53, -0.165, -0.51, -0.15);
        shape.lineTo(-0.18, 0.08);
        shape.bezierCurveTo(-0.12, 0.12, -0.085, 0.15, -0.085, 0.2);
        shape.lineTo(-0.085, 0.3);
        shape.bezierCurveTo(-0.085, 0.42, -0.04, 0.5, 0, 0.5);

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