/**
 * AI可読性・先祖返り防止コメント:
 * 【起点と目的地のハイライト独立管理】
 * 履歴204に基づき、ハイライト状態を isOrigin と isDest に分離しました。
 * 3Dメッシュを新しく追加する重い処理には先祖返りせず、既存のエコな「色書き換え処理」
 * のみを利用し、起点（シアン色）と目的地（白色）を同時に美しく光らせる仕組みを実現しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS_ASIA } from './Data_Real_Asia.js';
import { AIRPORTS_AMERICAS } from './Data_Real_Americas.js';
import { AIRPORTS_EMEA } from './Data_Real_EMEA.js';
import { fictionalNodes } from './Data_Fictional.js'; 

export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.airportGroup = new THREE.Group();
        this.globeGroup.add(this.airportGroup);

        this.markers = []; 
        this.allAirports = this._compileAllAirports();
    }

    _compileAllAirports() {
        const reals = [...AIRPORTS_ASIA, ...AIRPORTS_AMERICAS, ...AIRPORTS_EMEA];
        
        return [...reals, ...fictionalNodes].sort((a, b) => {
            const rank = { 'major': 1, 'local': 2, 'fictional': 3 };
            return rank[a.type] - rank[b.type];
        });
    }

    getAirportById(id) {
        return this.allAirports.find(a => a.id === id);
    }

    buildAirportMarkers() {
        const majorCoreGeo = new THREE.SphereGeometry(0.02, 16, 16);
        const majorCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const majorRingGeo1 = new THREE.RingGeometry(0.035, 0.045, 32);
        const majorRingGeo2 = new THREE.RingGeometry(0.06, 0.065, 32);
        const majorRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });

        const localCoreGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const localCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const localRingGeo = new THREE.RingGeometry(0.035, 0.045, 24);
        const localRingMat = new THREE.MeshBasicMaterial({ color: 0xfb923c, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });

        const fictionalGeo = new THREE.OctahedronGeometry(0.025, 0);
        const fictionalMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.9 });

        const placedMajors = [];
        const placedLocals = [];
        const placedFictionals = [];
        
        const EXCLUDE_DIST_MAJOR = 0.16; 
        const EXCLUDE_DIST_LOCAL = 0.09;
        const EXCLUDE_DIST_FICTIONAL = 0.06;

        this.allAirports.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS + 0.02);

            if (airport.type === 'fictional') {
                if (placedMajors.some(p => p.distanceTo(pos) < EXCLUDE_DIST_MAJOR)) return;
                if (placedLocals.some(p => p.distanceTo(pos) < EXCLUDE_DIST_LOCAL)) return;
                if (placedFictionals.some(p => p.distanceTo(pos) < EXCLUDE_DIST_FICTIONAL)) return;
                placedFictionals.push(pos);
            } else if (airport.type === 'local') {
                if (placedMajors.some(p => p.distanceTo(pos) < EXCLUDE_DIST_MAJOR)) return;
                if (placedLocals.some(p => p.distanceTo(pos) < EXCLUDE_DIST_LOCAL)) return;
                placedLocals.push(pos);
            } else {
                placedMajors.push(pos);
            }

            const markerGroup = new THREE.Group();
            const visualGroup = new THREE.Group();
            
            markerGroup.position.copy(pos);
            markerGroup.lookAt(pos.clone().multiplyScalar(2));

            let highlightTarget;
            if (airport.type === 'major') {
                visualGroup.add(new THREE.Mesh(majorCoreGeo, majorCoreMat));
                visualGroup.add(new THREE.Mesh(majorRingGeo1, majorRingMat.clone()));
                highlightTarget = new THREE.Mesh(majorRingGeo2, majorRingMat.clone());
                visualGroup.add(highlightTarget);
            } else if (airport.type === 'local') {
                visualGroup.add(new THREE.Mesh(localCoreGeo, localCoreMat));
                highlightTarget = new THREE.Mesh(localRingGeo, localRingMat.clone());
                visualGroup.add(highlightTarget);
            } else {
                highlightTarget = new THREE.Mesh(fictionalGeo, fictionalMat.clone());
                visualGroup.add(highlightTarget);
            }

            markerGroup.add(visualGroup);

            // ★修正: 起点(origin)と目的地(dest)のフラグを独立させる
            markerGroup.userData = { 
                airportData: airport, 
                targetMesh: highlightTarget,
                originalColor: highlightTarget.material.color.getHex(),
                isOrigin: false,
                isDest: false,
                visualGroup: visualGroup
            };

            this.airportGroup.add(markerGroup);
            this.markers.push(markerGroup);
        });
    }

    // ★修正: 種類（'all', 'origin', 'dest'）を指定してハイライトを消去する
    clearHighlight(type = 'all') {
        this.markers.forEach(m => {
            if (type === 'all' || type === 'origin') m.userData.isOrigin = false;
            if (type === 'all' || type === 'dest') m.userData.isDest = false;
            
            if (m.userData.targetMesh) {
                if (m.userData.isOrigin) {
                    m.userData.targetMesh.material.color.setHex(0x00e5ff); // シアンで維持
                } else if (m.userData.isDest) {
                    m.userData.targetMesh.material.color.setHex(0xffffff); // 白で維持
                } else {
                    m.userData.targetMesh.material.color.setHex(m.userData.originalColor); // 元の色に戻す
                }
            }
        });
    }

    // ★修正: 種類を指定してハイライトする（起点はシアン、目的地は白）
    setHighlight(hitMesh, type) {
        if (!hitMesh || !hitMesh.userData.targetMesh) return;
        
        if (type === 'origin') {
            hitMesh.userData.isOrigin = true;
            hitMesh.userData.targetMesh.material.color.setHex(0x00e5ff);
        } else if (type === 'dest') {
            hitMesh.userData.isDest = true;
            hitMesh.userData.targetMesh.material.color.setHex(0xffffff);
        }
    }

    updateMarkerScale(camera) {
        this.markers.forEach(hitMesh => {
            const markerWorldPos = new THREE.Vector3();
            hitMesh.getWorldPosition(markerWorldPos);
            const distance = camera.position.distanceTo(markerWorldPos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 1.8)); 
            
            // ★修正: どちらかのハイライト状態であれば 1.5 倍にする
            const isHigh = hitMesh.userData.isOrigin || hitMesh.userData.isDest;
            const highlightScale = isHigh ? 1.5 : 1.0;
            const finalScale = baseScale * highlightScale;
            
            if (hitMesh.userData.visualGroup) {
                hitMesh.userData.visualGroup.scale.set(finalScale, finalScale, finalScale);
            }
        });
    }
}