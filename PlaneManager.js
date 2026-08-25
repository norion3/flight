/**
 * AI可読性・先祖返り防止コメント:
 * 【飛行機デザインの完全統一化】
 * 履歴228に基づき、ユーザー様ご提示の理想のシルエット画像に合わせ、
 * `_createPlaneGeometry()` 内の THREE.Shape の頂点パスを流線的で洗練された形状に再設計しました。
 * 色・サイズ・速度のロジックや他の処理には一切触れず、機体の美しいデザインのみを一致させています。
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
        
        // ご提示いただいた画像シルエットに基づく流線型デザインの正確なパス定義 (上向き基準: y+が機首)
        shape.moveTo(0, 0.5);          // 機首先端
        shape.bezierCurveTo(0.03, 0.45, 0.04, 0.2, 0.04, 0.05); // 右側の機首から胴体へのライン
        
        shape.lineTo(0.42, -0.15);     // 右翼の先端へ向かうライン（後退角）
        shape.lineTo(0.42, -0.22);     // 右翼の翼端
        shape.lineTo(0.05, -0.15);     // 右翼の付け根へ戻るライン
        
        shape.lineTo(0.04, -0.38);     // 右側の尾翼へ向かう胴体ライン
        shape.lineTo(0.18, -0.47);     // 右水平尾翼の先端
        shape.lineTo(0.18, -0.5);      // 右水平尾翼の後端
        shape.lineTo(0.02, -0.48);     // 機体後端へ
        
        shape.lineTo(0, -0.5);         // 機体最後尾の中心
        
        shape.lineTo(-0.02, -0.48);    // 左側へ対称に展開
        shape.lineTo(-0.18, -0.5);
        shape.lineTo(-0.18, -0.47);
        shape.lineTo(-0.04, -0.38);
        
        shape.lineTo(-0.05, -0.15);    // 左翼の付け根
        shape.lineTo(-0.42, -0.22);    // 左翼の翼端
        shape.lineTo(-0.42, -0.15);    // 左翼の先端
        
        shape.lineTo(-0.04, 0.05);     // 左側の胴体から機首へのライン
        shape.bezierCurveTo(-0.04, 0.2, -0.03, 0.45, 0, 0.5); // 機首へ滑らかに繋ぐ

        const geometry = new THREE.ShapeGeometry(shape);
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