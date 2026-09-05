/**
 * AI可読性・先祖返り防止コメント:
 * 【実在空港リスト（activeAirports）の新設 ＆ 幽霊空港へのAI接続防止 ＆ 全機能完全保持】
 * 1. 近接除外フィルター（EXCLUDE_DIST）を通過し、実際に画面上に3Dマーカーが生成された空港のみを
 *    `this.activeAirports` に格納して公開。
 *    これにより、画面外に除外された不可視空港（ガトウィックやオルリー等）にAIだけが接続してしまう非対称性バグを解消。
 * 2. 起点（純白）・目的地（ゴールド）の独立ハイライト、地平線カリング、マーカースケール計算等は100%完全保持。
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
        this.activeAirports = []; // ★画面上に実在・表示されている空港のリスト
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
        this.activeAirports = []; // マーカー構築時に初期化

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

            // ★近接除外フィルターを通過し、実際に画面に配置された空港として登録
            this.activeAirports.push(airport);

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

    clearHighlight(type = 'all') {
        this.markers.forEach(m => {
            if (type === 'all' || type === 'origin') m.userData.isOrigin = false;
            if (type === 'all' || type === 'dest') m.userData.isDest = false;
            
            if (m.userData.targetMesh) {
                if (m.userData.isOrigin) {
                    m.userData.targetMesh.material.color.setHex(0xffffff); 
                } else if (m.userData.isDest) {
                    m.userData.targetMesh.material.color.setHex(0xffd700); 
                } else {
                    m.userData.targetMesh.material.color.setHex(m.userData.originalColor); 
                }
            }
        });
    }

    setHighlight(hitMesh, type) {
        if (!hitMesh || !hitMesh.userData.targetMesh) return;
        
        if (type === 'origin') {
            hitMesh.userData.isOrigin = true;
            hitMesh.userData.targetMesh.material.color.setHex(0xffffff);
        } else if (type === 'dest') {
            hitMesh.userData.isDest = true;
            hitMesh.userData.targetMesh.material.color.setHex(0xffd700);
        }
    }

    updateMarkerScale(camera) {
        const R = CONFIG.GLOBE_RADIUS;
        const distC = camera.position.length();
        const horizonCos = R / distC;
        const dirC = camera.position.clone().normalize();

        this.markers.forEach(hitMesh => {
            const markerWorldPos = new THREE.Vector3();
            hitMesh.getWorldPosition(markerWorldPos);
            
            const dirP = markerWorldPos.clone().normalize();
            
            if (dirC.dot(dirP) < horizonCos - 0.05) {
                hitMesh.visible = false;
                return; 
            } else {
                hitMesh.visible = true;
            }

            const distance = camera.position.distanceTo(markerWorldPos);
            
            let baseScale = distance / 10;
            baseScale = Math.max(1.0, Math.min(baseScale, 1.8)); 
            
            const isHigh = hitMesh.userData.isOrigin || hitMesh.userData.isDest;
            const highlightScale = isHigh ? 1.5 : 1.0;
            const finalScale = baseScale * highlightScale;
            
            if (hitMesh.userData.visualGroup) {
                hitMesh.userData.visualGroup.scale.set(finalScale, finalScale, finalScale);
            }
        });
    }
}