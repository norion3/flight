/**
 * AI可読性・先祖返り防止コメント:
 * 【誤タップストレスの完全根絶（スケール分離）】
 * 履歴106に基づき、カメラ縮小時に「当たり判定(hitMesh)」まで
 * 巨大化して密集地で重なり合うバグを防ぐため、
 * 視覚的なマーカー(visualGroup)と当たり判定を完全に分離しました。
 * 縮小時は視覚マーカーのみが拡大し、タップ判定は常に一定のピンポイントを保ちます。
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

        // 当たり判定用メッシュ (透明)
        const hitGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

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

            // ★修正: 全体のコンテナと、視覚情報だけのコンテナを分離
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
                highlightTarget = new Mesh(localRingGeo, localRingMat.clone());
                visualGroup.add(highlightTarget);
            } else {
                highlightTarget = new THREE.Mesh(fictionalGeo, fictionalMat.clone());
                visualGroup.add(highlightTarget);
            }

            // 視覚グループをメイングループに追加
            markerGroup.add(visualGroup);

            // 当たり判定は直接メイングループに追加し、updateMarkerScale の拡大影響を受けさせない
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { 
                airportData: airport, 
                targetMesh: highlightTarget,
                originalColor: highlightTarget.material.color.getHex(),
                isHighlighted: false,
                visualGroup: visualGroup // 拡大縮小処理のために参照を保持
            };
            markerGroup.add(hitMesh);

            this.airportGroup.add(markerGroup);
            this.markers.push(hitMesh);
        });
    }

    highlightMarker(hitMesh) {
        this.markers.forEach(m => {
            if (m.userData.targetMesh) {
                m.userData.targetMesh.material.color.setHex(m.userData.originalColor);
                m.userData.isHighlighted = false;
            }
        });

        if (hitMesh && hitMesh.userData.targetMesh) {
            hitMesh.userData.targetMesh.material.color.setHex(0xffffff);
            hitMesh.userData.isHighlighted = true;
        }
    }

    updateMarkerScale(camera) {
        // ★修正: 視覚的なマーカー(visualGroup)のみを拡大し、当たり判定(hitMesh)は拡大しない
        this.markers.forEach(hitMesh => {
            const markerWorldPos = new THREE.Vector3();
            hitMesh.getWorldPosition(markerWorldPos);
            const distance = camera.position.distanceTo(markerWorldPos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 2.5)); 
            
            const highlightScale = hitMesh.userData.isHighlighted ? 1.5 : 1.0;
            const finalScale = baseScale * highlightScale;
            
            if (hitMesh.userData.visualGroup) {
                hitMesh.userData.visualGroup.scale.set(finalScale, finalScale, finalScale);
            }
        });
    }
}


