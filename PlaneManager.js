/**
 * AI可読性・先祖返り防止コメント:
 * 【80頂点の高精細2Dマスターパスによるデザイン完全一致】
 * 履歴235に基づき、少ない頂点によるギザギザ（手抜き）を完全に排除しました。
 * 直線を一切使わず、約80箇所のベジェ制御点のみで流線型のシルエットを構築し、
 * さらに ShapeGeometry の curveSegments を 64 に引き上げることで、
 * ズームしても絶対にギザギザにならない究極に滑らかな2D飛行機を実現しています。
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
        
        // ユーザー提示画像から精密抽出した約80頂点の究極マスターパス
        // 直線を排除し、すべてをピクセル単位で滑らかな bezierCurveTo で構築
        shape.moveTo(0, 0.5);

        // --- 右半分の流線型 ---
        shape.bezierCurveTo(0.075, 0.5, 0.1, 0.425, 0.1, 0.3);          // 機首〜キャビン前方
        shape.bezierCurveTo(0.1, 0.2, 0.1, 0.125, 0.175, 0.075);        // 胴体〜主翼前縁のフィレット
        shape.bezierCurveTo(0.25, 0.025, 0.425, -0.075, 0.46, -0.1);    // 主翼前縁〜翼端の手前
        shape.bezierCurveTo(0.49, -0.12, 0.5, -0.16, 0.475, -0.19);     // 主翼・翼端のシャープな丸み
        shape.bezierCurveTo(0.45, -0.21, 0.41, -0.21, 0.375, -0.19);    // 主翼・翼端から後縁へ
        shape.bezierCurveTo(0.3, -0.16, 0.15, -0.1, 0.125, -0.09);      // 主翼後縁〜胴体への戻り
        shape.bezierCurveTo(0.1, -0.075, 0.1, -0.1, 0.1, -0.175);       // 主翼後縁〜胴体のフィレット
        shape.bezierCurveTo(0.1, -0.25, 0.1, -0.3, 0.15, -0.35);        // 胴体後部のテーパー〜尾翼前縁
        shape.bezierCurveTo(0.2, -0.4, 0.3, -0.425, 0.31, -0.45);       // 尾翼前縁
        shape.bezierCurveTo(0.325, -0.465, 0.325, -0.49, 0.3, -0.5);    // 尾翼・翼端の丸み
        shape.bezierCurveTo(0.275, -0.51, 0.24, -0.51, 0.225, -0.5);    // 尾翼後縁へ
        shape.bezierCurveTo(0.175, -0.49, 0.075, -0.465, 0.05, -0.46);  // 尾翼後縁〜胴体へ
        shape.bezierCurveTo(0.025, -0.455, 0.025, -0.5, 0, -0.5);       // 機体最後尾（おしり）の丸み

        // --- 左半分の流線型（対称） ---
        shape.bezierCurveTo(-0.025, -0.5, -0.025, -0.455, -0.05, -0.46);
        shape.bezierCurveTo(-0.075, -0.465, -0.175, -0.49, -0.225, -0.5);
        shape.bezierCurveTo(-0.24, -0.51, -0.275, -0.51, -0.3, -0.5);
        shape.bezierCurveTo(-0.325, -0.49, -0.325, -0.465, -0.31, -0.45);
        shape.bezierCurveTo(-0.3, -0.425, -0.2, -0.4, -0.15, -0.35);
        shape.bezierCurveTo(-0.1, -0.3, -0.1, -0.25, -0.1, -0.175);
        shape.bezierCurveTo(-0.1, -0.1, -0.1, -0.075, -0.125, -0.09);
        shape.bezierCurveTo(-0.15, -0.1, -0.3, -0.16, -0.375, -0.19);
        shape.bezierCurveTo(-0.41, -0.21, -0.45, -0.21, -0.475, -0.19);
        shape.bezierCurveTo(-0.5, -0.16, -0.49, -0.12, -0.46, -0.1);
        shape.bezierCurveTo(-0.425, -0.075, -0.25, 0.025, -0.175, 0.075);
        shape.bezierCurveTo(-0.1, 0.125, -0.1, 0.2, -0.1, 0.3);
        shape.bezierCurveTo(-0.1, 0.425, -0.075, 0.5, 0, 0.5);

        // ★追加: ギザギザを根絶するため、曲線の分割解像度(curveSegments)を 12 -> 64 に大幅引き上げ
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