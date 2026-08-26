/**
 * AI可読性・先祖返り防止コメント:
 * 【確率的セパレーション（航空管制）による完璧な分散ルーティング】
 * 履歴282に基づき、「一番空いているルートを絶対選ぶ」という硬直化したロジックを廃止しました。
 * 代わりに、各ルートの「最後尾の機体の進行度(progress)」を調べ、
 * 「前の機体が進んでいる（間隔が空いている）ルートほど選ばれやすい」重み付きランダム（ルーレット）
 * を実装しました。これにより、数珠つなぎ（重なり）を完璧に防ぎつつ、
 * 長短問わずすべてのルートに別の機体が次々と進入していく自然な航空網が実現します。
 * （※機体の美しい弾丸型プロポーションや、カリングによる軽量化は100%維持しています。）
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

        // 厚み(0.12)とベベルの維持
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

    // ★進化ポイント: 確率的セパレーション（航空管制）ルーティング
    _getRouteBySeparation(airportId, companyId) {
        const routes = this.networkManager.network[companyId][airportId];
        if (!routes || routes.length === 0) return null;

        // 各ルートの「最後尾の機体の進行度(progress)」を調べる
        // 誰もいないルートは progress = 1.0 (完全に間隔が空いている) と見なす
        const minProgresses = {};
        routes.forEach(r => minProgresses[r.id] = 1.0);

        this.planes.forEach(plane => {
            if (plane.companyId === companyId && plane.currentRoute && plane.currentAirportId === airportId) {
                const toId = plane.currentRoute.id;
                if (minProgresses[toId] !== undefined) {
                    if (plane.progress < minProgresses[toId]) {
                        minProgresses[toId] = plane.progress; // より入口に近い(progressが小さい)機体で上書き
                    }
                }
            }
        });

        // 重み付きランダム（ルーレット）選択
        // progress が小さい（出発直後）ルートほど選ばれにくくし、重なり(追突)を防ぐ。
        // progress が進めば確率が回復するため、他の機体も次々と進入できるようになる。
        let totalWeight = 0;
        const weights = routes.map(route => {
            // +0.05 の下駄を履かせることで、出発直後(0.0)でも5%の確率を残し、完全なスタック(硬直)を防ぐ
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
        
        return routes[routes.length - 1]; // フォールバック
    }

    addPlane(sizeType, companyId = 'player') {
        const spawnAirportId = this.networkManager.getRandomConnectedAirport(companyId);
        if (!spawnAirportId) return false; 

        // ルーティングをセパレーションベースへ変更
        const routeData = this._getRouteBySeparation(spawnAirportId, companyId);
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
        this.planes.forEach(plane => {
            if (!plane.currentRoute) {
                plane.mesh.visible = false;
                return;
            }

            const pos = new THREE.Vector3();
            plane.mesh.getWorldPosition(pos);
            
            // 動的カリングによる裏透け防止
            const cameraToPlane = camera.position.clone().sub(pos);
            const normal = pos.clone().normalize();
            if (cameraToPlane.dot(normal) < 0) {
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

    update(delta) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            if (!plane.currentRoute) continue;

            const curve = plane.currentRoute.curve;
            const length = plane.currentRoute.length;
            
            const speedFactor = plane.baseSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                const nextAirportId = plane.currentRoute.id;
                // 到着時もセパレーションロジックで空いている間隔を選ぶ
                const nextRoute = this._getRouteBySeparation(nextAirportId, plane.companyId);
                
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