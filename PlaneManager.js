/**
 * AI可読性・先祖返り防止コメント:
 * 【共有ジオメトリ完全保護（描画消失バグ根絶） ＆ 旧機体メッシュ解放 ＆ 全機能完全保持】
 * 1. `removeAllPlanes`, `sellIdlePlane`, `sellPlane` 内で誤って共有の `this.baseGeometry` を
 *    `dispose()` していた処理を完全排除。個別マテリアルのみを解放するように修正し、
 *    機体売却・再起後に新機体が透明化したりWebGL頂点エラーが発生する重大リスクを100%根絶。
 * 2. 所属全機体の3Dメッシュを scene/planeGroup から安全に remove し配列から完全削除する機能、
 *    弾丸型エンジン翼形状、遊休機体優先売却、機体追従、カメラ距離別スケーリング等は100%完全保持。
 * 3. 【追加】就航アクティブ制に基づき、機体がフライト・割り当てられた路線の就航フラグを有効化。
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
        
        shape.moveTo(0, 0.5);
        shape.bezierCurveTo(0.05, 0.45, 0.06, 0.3, 0.06, 0.1); 
        
        // --- 右翼前縁（隙間拡大・弾丸型エンジン） ---
        shape.lineTo(0.10, 0.072);    
        shape.lineTo(0.10, 0.12);     
        shape.lineTo(0.13, 0.14);     // 先端の尖り
        shape.lineTo(0.16, 0.12);     
        shape.lineTo(0.16, 0.031);    
        shape.lineTo(0.35, -0.1);     
        // -----------------------------
        
        shape.lineTo(0.35, -0.2);
        shape.lineTo(0.06, -0.15);
        shape.lineTo(0.05, -0.35);    
        
        // 尾翼（短縮・バランス最適化）
        shape.lineTo(0.12, -0.45);    
        shape.lineTo(0.12, -0.5);     
        shape.lineTo(0.02, -0.48);    
        shape.lineTo(0, -0.5);
        
        shape.lineTo(-0.02, -0.48);
        shape.lineTo(-0.12, -0.5);
        shape.lineTo(-0.12, -0.45);
        shape.lineTo(-0.05, -0.35);
        shape.lineTo(-0.06, -0.15);
        shape.lineTo(-0.35, -0.2);
        shape.lineTo(-0.35, -0.1);    
        
        // --- 左翼前縁（完全対称） ---
        shape.lineTo(-0.16, 0.031);  
        shape.lineTo(-0.16, 0.12);   
        shape.lineTo(-0.13, 0.14);   // 先端の尖り
        shape.lineTo(-0.10, 0.12);   
        shape.lineTo(-0.10, 0.072);  
        // -----------------------------

        shape.lineTo(-0.06, 0.1);
        shape.bezierCurveTo(-0.06, 0.3, -0.05, 0.45, 0, 0.5);

        const extrudeSettings = {
            depth: 0.12,          
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.005,
            bevelThickness: 0.005
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center(); 
        
        return geometry;
    }

    _getRouteBySeparation(airportId, companyId) {
        const routes = this.networkManager.network[companyId][airportId];
        if (!routes || routes.length === 0) return null;

        const minProgresses = {};
        routes.forEach(r => minProgresses[r.id] = 1.0);

        this.planes.forEach(plane => {
            if (plane.companyId === companyId && plane.currentRoute && plane.currentAirportId === airportId) {
                const toId = plane.currentRoute.id;
                if (minProgresses[toId] !== undefined) {
                    if (plane.progress < minProgresses[toId]) {
                        minProgresses[toId] = plane.progress;
                    }
                }
            }
        });

        let totalWeight = 0;
        const weights = routes.map(route => {
            const w = minProgresses[route.id] + 0.05; 
            totalWeight += w;
            return w;
        });

        let randomValue = Math.random() * totalWeight;
        for (let i = 0; i < routes.length; i++) {
            randomValue -= weights[i];
            if (randomValue <= 0) {
                return routes[i];
            }
        }
        
        return routes[routes.length - 1];
    }

    getPlaneCounts(companyId = 'player') {
        const counts = { small: 0, medium: 0, large: 0, super: 0 };
        this.planes.forEach(plane => {
            if (plane.companyId === companyId && counts[plane.sizeType] !== undefined) {
                counts[plane.sizeType]++;
            }
        });
        return counts;
    }

    /**
     * 指定会社の全機体3Dメッシュを完全に破棄・解放し、配列からも全削除する
     * ※共有ジオメトリ（this.baseGeometry）は保護し、個別マテリアルのみ破棄
     */
    removeAllPlanes(companyId) {
        for (let i = this.planes.length - 1; i >= 0; i--) {
            const plane = this.planes[i];
            if (plane.companyId === companyId) {
                this.planeGroup.remove(plane.mesh);
                // ★修正: 共有ジオメトリ baseGeometry は破棄せず、マテリアルのみ解放
                if (plane.mesh.material) {
                    if (Array.isArray(plane.mesh.material)) {
                        plane.mesh.material.forEach(m => m.dispose());
                    } else {
                        plane.mesh.material.dispose();
                    }
                }
                this.planes.splice(i, 1);
            }
        }
    }

    // 航路を持たない「遊休状態」の機体を特定して売却・削除するメソッド
    sellIdlePlane(companyId) {
        for (let i = this.planes.length - 1; i >= 0; i--) {
            const plane = this.planes[i];
            if (plane.companyId === companyId && !plane.currentRoute) {
                const sizeType = plane.sizeType;
                
                this.planeGroup.remove(plane.mesh);
                // ★修正: 共有ジオメトリ baseGeometry は破棄せず、マテリアルのみ解放
                if (plane.mesh.material) {
                    if (Array.isArray(plane.mesh.material)) {
                        plane.mesh.material.forEach(m => m.dispose());
                    } else {
                        plane.mesh.material.dispose();
                    }
                }
                
                this.planes.splice(i, 1);
                return sizeType; // 売却した機体のサイズタイプを返す
            }
        }
        return null;
    }

    sellPlane(sizeType, companyId = 'player') {
        // 遊休機体を優先して検索
        let targetIndex = -1;
        for (let i = this.planes.length - 1; i >= 0; i--) {
            const plane = this.planes[i];
            if (plane.companyId === companyId && plane.sizeType === sizeType && !plane.currentRoute) {
                targetIndex = i;
                break;
            }
        }

        // 遊休機体がなければ稼働中の機体を検索
        if (targetIndex === -1) {
            for (let i = this.planes.length - 1; i >= 0; i--) {
                const plane = this.planes[i];
                if (plane.companyId === companyId && plane.sizeType === sizeType) {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex !== -1) {
            const plane = this.planes[targetIndex];
            this.planeGroup.remove(plane.mesh);
            
            // ★修正: 共有ジオメトリ baseGeometry は破棄せず、マテリアルのみ解放
            if (plane.mesh.material) {
                if (Array.isArray(plane.mesh.material)) {
                    plane.mesh.material.forEach(m => m.dispose());
                } else {
                    plane.mesh.material.dispose();
                }
            }
            
            this.planes.splice(targetIndex, 1);
            return true;
        }
        return false; 
    }

    addPlane(sizeType, companyId = 'player') {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport(companyId);
        if (!spawnAirportId) return false; 

        const routeData = this._getRouteBySeparation(spawnAirportId, companyId);
        if (!routeData) return false;

        // ★就航アクティブ制: 機体が割り当てられた路線の就航フラグを有効化
        routeData.isOperational = true;
        if (this.networkManager.setRouteOperational) {
            this.networkManager.setRouteOperational(spawnAirportId, routeData.id, companyId);
        }

        let scale = 0.11;
        let speed = 0.20; 
        if (sizeType === 'small') { scale = 0.09; speed = 0.20; }
        else if (sizeType === 'medium') { scale = 0.11; speed = 0.18; }
        else if (sizeType === 'large') { scale = 0.13; speed = 0.16; }
        else if (sizeType === 'super') { scale = 0.15; speed = 0.14; }

        const compIndex = CONFIG.COMPANIES.findIndex(c => c.id === companyId);
        const comp = CONFIG.COMPANIES[compIndex];
        const planeColor = comp ? comp.planeColor : 0x34d399;
        
        const baseColor = new THREE.Color(planeColor);
        
        const matFront = new THREE.MeshBasicMaterial({ 
            color: baseColor,      
            transparent: false,
            side: THREE.DoubleSide
        });
        
        const sideColor = baseColor.clone().multiplyScalar(0.65); 
        const matSide = new THREE.MeshBasicMaterial({
            color: sideColor,
            transparent: false,
            side: THREE.DoubleSide
        });

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
            altitudeOffset: altitudeOffset,
            sizeType: sizeType 
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
            nextRoute = this._getRouteBySeparation(spawnAirportId, plane.companyId);
        }

        if (!nextRoute) {
            spawnAirportId = this.networkManager.getRandomConnectedAirport(plane.companyId);
            if (spawnAirportId) {
                nextRoute = this._getRouteBySeparation(spawnAirportId, plane.companyId);
            }
        }

        if (!nextRoute) {
            plane.mesh.visible = false;
            plane.currentAirportId = null;
            plane.currentRoute = null;
            plane.progress = 0;
            return;
        }

        // ★就航アクティブ制: 再割り当てされた路線の就航フラグを有効化
        nextRoute.isOperational = true;
        if (this.networkManager.setRouteOperational) {
            this.networkManager.setRouteOperational(spawnAirportId, nextRoute.id, plane.companyId);
        }

        plane.mesh.visible = true; 
        plane.currentAirportId = spawnAirportId;
        plane.currentRoute = nextRoute;
        plane.progress = 0;
    }

    wakeUpPlanes(companyId = 'player') {
        this.planes.forEach(plane => {
            if (plane.companyId === companyId && !plane.currentRoute) {
                this._reassignPlane(plane);
            }
        });
    }

    updateScale(camera) {
        const R = CONFIG.GLOBE_RADIUS;
        const distC = camera.position.length();
        const horizonCos = R / distC;
        const dirC = camera.position.clone().normalize();

        this.planes.forEach(plane => {
            if (!plane.currentRoute) {
                plane.mesh.visible = false;
                return;
            }

            const pos = new THREE.Vector3();
            plane.mesh.getWorldPosition(pos);
            
            const dirP = pos.clone().normalize();
            
            if (dirC.dot(dirP) < horizonCos - 0.05) {
                plane.mesh.visible = false;
                return; 
            } else {
                plane.mesh.visible = true;
            }

            const distance = camera.position.distanceTo(pos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 1.8)); 
            
            const finalScale = plane.originalScale * baseScale;
            plane.mesh.scale.set(finalScale, finalScale, finalScale);
        });
    }

    update(delta, speedMultiplier = 1.0) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            if (!plane.currentRoute) continue;

            // ★就航アクティブ制: 飛行中機体の路線を就航済みに更新
            if (!plane.currentRoute.isOperational) {
                plane.currentRoute.isOperational = true;
                if (this.networkManager.setRouteOperational) {
                    this.networkManager.setRouteOperational(plane.currentAirportId, plane.currentRoute.id, plane.companyId);
                }
            }

            const curve = plane.currentRoute.curve;
            const length = plane.currentRoute.length;
            
            const currentSpeed = plane.companyId === 'player' ? plane.baseSpeed * speedMultiplier : plane.baseSpeed;
            
            const speedFactor = currentSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                const nextAirportId = plane.currentRoute.id;
                const nextRoute = this._getRouteBySeparation(nextAirportId, plane.companyId);
                
                if (nextRoute) {
                    // ★次便の就航フラグを有効化
                    nextRoute.isOperational = true;
                    if (this.networkManager.setRouteOperational) {
                        this.networkManager.setRouteOperational(nextAirportId, nextRoute.id, plane.companyId);
                    }
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
                    const trueUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
                    const targetMatrix = new THREE.Matrix4().makeBasis(right, tangent, trueUp);
                    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
                    
                    plane.mesh.quaternion.slerp(targetQuaternion, 3.5 * delta);
                }
            }
        }
    }
}