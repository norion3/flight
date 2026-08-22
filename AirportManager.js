import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS_ASIA } from './Data_Real_Asia.js';
import { AIRPORTS_AMERICAS } from './Data_Real_Americas.js';
import { AIRPORTS_EMEA } from './Data_Real_EMEA.js';
import { FICTIONAL_CSV_DATA } from './Data_Fictional.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【色彩工学と形状の記号化、およびタップ適正化】
 * Major: ゴールド/三重円 (最も目立つ)
 * Local: コーラルオレンジ/二重円 (海岸線と同化しない暖色系)
 * Fictional: ミントグリーン/極小の菱形(Octahedron) (リングによるウザさを排除)
 * 【ゴーストヒットボックス】: 
 * 見た目が極小でも絶対にタップミスしないよう、半径0.08の不可視球体を被せています。
 */
export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.airportGroup = new THREE.Group();
        this.globeGroup.add(this.airportGroup);

        this.markers = []; // Raycaster判定用
        this.allAirports = this._compileAllAirports();
    }

    _compileAllAirports() {
        const reals = [...AIRPORTS_ASIA, ...AIRPORTS_AMERICAS, ...AIRPORTS_EMEA];
        
        const fictionals = FICTIONAL_CSV_DATA.split('|').map((row, index) => {
            const [latStr, lonStr, name, country] = row.split(',');
            return {
                id: `F${index.toString().padStart(3, '0')}`,
                name: name,
                lat: parseFloat(latStr),
                lon: parseFloat(lonStr),
                country: country,
                type: 'fictional'
            };
        });

        return [...reals, ...fictionals].sort((a, b) => {
            const rank = { 'major': 1, 'local': 2, 'fictional': 3 };
            return rank[a.type] - rank[b.type];
        });
    }

    buildAirportMarkers() {
        // --- 1. Major (ゴールド / 三重円) ---
        const majorCoreGeo = new THREE.SphereGeometry(0.02, 16, 16);
        const majorCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const majorRingGeo1 = new THREE.RingGeometry(0.035, 0.045, 32);
        const majorRingGeo2 = new THREE.RingGeometry(0.06, 0.065, 32);
        const majorRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });

        // --- 2. Local (コーラルオレンジ / 二重円) ※海岸線と同化しない暖色 ---
        const localCoreGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const localCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const localRingGeo = new THREE.RingGeometry(0.035, 0.045, 24);
        const localRingMat = new THREE.MeshBasicMaterial({ color: 0xfb923c, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });

        // --- 3. Fictional (ミントグリーン / 極小の菱形(Octahedron)) ※リングのウザさを排除 ---
        const fictionalGeo = new THREE.OctahedronGeometry(0.015, 0); // 8面体で3Dの菱形（ダイヤモンド）を作る
        const fictionalMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.9 });

        // --- ゴースト・ヒットボックス (不可視のタップ専用巨大球体) ---
        // 半径を0.08に適正化。近接する羽田/成田でも判定が吸い込まれない絶妙なサイズ。
        const hitGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        const placedMajors = [];
        const placedLocals = [];
        const placedFictionals = [];
        
        const EXCLUDE_DIST_MAJOR = 0.16; 
        const EXCLUDE_DIST_LOCAL = 0.09;
        const EXCLUDE_DIST_FICTIONAL = 0.06;

        this.allAirports.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS + 0.02);

            // --- 優先度順のスマート間引き ---
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
            markerGroup.position.copy(pos);
            markerGroup.lookAt(pos.clone().multiplyScalar(2));

            let highlightTarget;
            if (airport.type === 'major') {
                markerGroup.add(new THREE.Mesh(majorCoreGeo, majorCoreMat));
                markerGroup.add(new THREE.Mesh(majorRingGeo1, majorRingMat.clone()));
                highlightTarget = new THREE.Mesh(majorRingGeo2, majorRingMat.clone());
                markerGroup.add(highlightTarget);
            } else if (airport.type === 'local') {
                markerGroup.add(new THREE.Mesh(localCoreGeo, localCoreMat));
                highlightTarget = new THREE.Mesh(localRingGeo, localRingMat.clone());
                markerGroup.add(highlightTarget);
            } else {
                highlightTarget = new THREE.Mesh(fictionalGeo, fictionalMat.clone());
                markerGroup.add(highlightTarget);
            }

            // ヒットボックス
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { 
                airportData: airport, 
                targetMesh: highlightTarget,
                originalColor: highlightTarget.material.color.getHex(),
                isHighlighted: false
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
        this.airportGroup.children.forEach(markerGroup => {
            const markerWorldPos = new THREE.Vector3();
            markerGroup.getWorldPosition(markerWorldPos);
            const distance = camera.position.distanceTo(markerWorldPos);
            
            const baseScale = Math.max(1, distance / 12); 
            
            let isHighlight = false;
            markerGroup.children.forEach(child => {
                if (child.userData && child.userData.isHighlighted) isHighlight = true;
            });

            const highlightScale = isHighlight ? 1.5 : 1.0;
            const finalScale = baseScale * highlightScale;
            
            markerGroup.scale.set(finalScale, finalScale, finalScale);
        });
    }
}


