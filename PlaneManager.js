/**
 * AI可読性・先祖返り防止コメント:
 * 【オリジナルデザインの維持と、光・微立体化による質感向上】
 * 履歴252に基づき、パスの形状（オリジナル）には一切手を加えず、マテリアルとジオメトリのみをアップデートしました。
 * ExtrudeGeometry によるごくわずかな厚みと面取り（ベベル）、
 * および MeshStandardMaterial による光の反射（metalness/roughness）を適用し、
 * のっぺりとした板から、高級感のあるバッジのような美しい微立体へと昇華させています。
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
        
        // オリジナルのパス座標を完全に維持（変更なし）
        shape.moveTo(0, 0.5);
        shape.bezierCurveTo(0.05, 0.45, 0.06, 0.3, 0.06, 0.1);
        shape.lineTo(0.35, -0.1);
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
        shape.lineTo(-0.35, -0.1);
        shape.lineTo(-0.06, 0.1);
        shape.bezierCurveTo(-0.06, 0.3, -0.05, 0.45, 0, 0.5);

        // ★修正: 平面(ShapeGeometry)から、ごく僅かな厚みと丸みを持つ微立体(ExtrudeGeometry)へ変更
        const extrudeSettings = {
            depth: 0.015,         // ごくわずかな厚み
            bevelEnabled: true,   // エッジの面取りを有効化
            bevelSegments: 3,     // 面取りの滑らかさ
            steps: 1,
            bevelSize: 0.01,      // 面取りの幅（ハイライトが乗る部分）
            bevelThickness: 0.01  // 面取りの深さ
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
        
        // ★修正: ベタ塗り(Basic)から、光の影響を受ける Standard マテリアルへ変更し質感を付与
        const material = new THREE.MeshStandardMaterial({ 
            color: planeColor,      
            transparent: false,
            metalness: 0.3,       // わずかな金属感（環境光を反射しやすくする）
            roughness: 0.4,       // ツヤの鋭さ（ハイライトを綺麗に乗せる）
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