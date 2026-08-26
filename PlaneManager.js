/**
 * AI可読性・先祖返り防止コメント:
 * 【大口径エンジンの胴体寄せによるデザイン・視認性の最適化】
 * 履歴263に基づき、厚み(depth: 0.12)とマルチマテリアル（明るさと影の両立）を100%保護しつつ、
 * エンジンの幅を太くし、配置を極限まで胴体側に寄せる（翼根付近に配置する）ようパスを修正しました。
 * 現代の大型旅客機のデザイン工学（力学的なセオリー）に合致し、
 * シルエットのコントラストが極大化することで、箱庭空間での視認性が最高レベルに引き上げられています。
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
        
        // オリジナルのパス構造を維持しつつ、主翼前縁に太く胴体寄りの大口径エンジンを追加
        shape.moveTo(0, 0.5);
        shape.bezierCurveTo(0.05, 0.45, 0.06, 0.3, 0.06, 0.1);
        
        // --- 右翼前縁（双発機シルエット：胴体に寄せた太く巨大なエンジン） ---
        shape.lineTo(0.096, 0.075);   // 付け根からすぐエンジン内側へ（胴体に極限まで寄せる）
        shape.lineTo(0.096, 0.16);    // 前方に力強く大きく突き出す
        shape.lineTo(0.183, 0.16);    // エンジンの幅（主翼の約30%を占める大口径化）
        shape.lineTo(0.183, 0.015);   // 前縁ラインに戻る
        shape.lineTo(0.35, -0.1);     // 翼端へ
        // -----------------------------
        
        shape.lineTo(0.35, -0.2);
        shape.lineTo(0.06, -0.15);
        shape.lineTo(0.05, -0.35);
        shape.lineTo(0.15, -0.45);
        shape.lineTo(0.15, -0.5);
        shape.lineTo(0.02, -0.48);
        shape.lineTo(0, -0.5);
        shape.lineTo(-0.02, -0.48);
        shape.lineTo(-0.15, -0.5);
        shape.lineTo(-0.15, -0.45);
        shape.lineTo(-0.05, -0.35);
        shape.lineTo(-0.06, -0.15);
        shape.lineTo(-0.35, -0.2);
        shape.lineTo(-0.35, -0.1);  // 左翼端
        
        // --- 左翼前縁（双発機シルエット：完全対称） ---
        shape.lineTo(-0.183, 0.015);  // 翼端からエンジン外側へ
        shape.lineTo(-0.183, 0.16);   // 前方に突き出す
        shape.lineTo(-0.096, 0.16);   // エンジンの幅
        shape.lineTo(-0.096, 0.075);  // 前縁ラインに戻る
        // -----------------------------

        shape.lineTo(-0.06, 0.1);
        shape.bezierCurveTo(-0.06, 0.3, -0.05, 0.45, 0, 0.5);

        // ★維持: デザイン工学に基づき、重厚感を極大化させる厚み(0.12)
        const extrudeSettings = {
            depth: 0.12,          
            bevelEnabled: true,   // エッジの面取り（アウトライン効果）
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.005,
            bevelThickness: 0.005
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center(); // 厚みを持たせた後も中心を合わせる
        
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
        
        // ★維持: 「明るさ」と「分厚さ」を両立するマルチマテリアル設定
        const baseColor = new THREE.Color(planeColor);
        
        // 1. 表面・裏面用マテリアル（元の明るく鮮やかな色）
        const matFront = new THREE.MeshBasicMaterial({ 
            color: baseColor,      
            transparent: false,
            side: THREE.DoubleSide
        });
        
        // 2. 側面用マテリアル（厚みの部分。暗く沈ませない程度に影を表現する色）
        const sideColor = baseColor.clone().multiplyScalar(0.65); 
        const matSide = new THREE.MeshBasicMaterial({
            color: sideColor,
            transparent: false,
            side: THREE.DoubleSide
        });

        // ジオメトリにマテリアルの配列を渡す（インデックス0が表裏、インデックス1が側面になる）
        const mesh = new THREE.Mesh(this.baseGeometry, [matFront, matSide]);
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