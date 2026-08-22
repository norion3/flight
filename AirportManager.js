import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS_ASIA } from './Data_Real_Asia.js';
import { AIRPORTS_AMERICAS } from './Data_Real_Americas.js';
import { AIRPORTS_EMEA } from './Data_Real_EMEA.js';
import { FICTIONAL_CSV_DATA } from './Data_Fictional.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 分割された実在空港データと圧縮された架空空港データを統合し、3階層デザインで配置します。
 * 【ゲームバランスの要: スマート間引き】
 * 実在・架空を含めると数百件になるため、Major優先、次にLocal、最後にFictionalという
 * 優先順位で近接チェックを行い、綺麗に散らばった黄金比のノード配置を実現します。
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
        
        // 圧縮CSV文字列をオブジェクト配列にパース
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

        // 優先度順（Major -> Local -> Fictional）にソートして間引き処理を確実にする
        return [...reals, ...fictionals].sort((a, b) => {
            const rank = { 'major': 1, 'local': 2, 'fictional': 3 };
            return rank[a.type] - rank[b.type];
        });
    }

    buildAirportMarkers() {
        // --- 3階層デザイン定義 ---
        // 1. Major (三重円)
        const majorCoreGeo = new THREE.SphereGeometry(0.02, 16, 16);
        const majorCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const majorRingGeo1 = new THREE.RingGeometry(0.035, 0.045, 32);
        const majorRingGeo2 = new THREE.RingGeometry(0.06, 0.065, 32);
        const majorRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });

        // 2. Local (二重円)
        const localCoreGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const localCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const localRingGeo = new THREE.RingGeometry(0.035, 0.045, 24);
        const localRingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });

        // 3. Fictional (単円 - 控えめで見失わないエメラルド色)
        const fictionalRingGeo = new THREE.RingGeometry(0.02, 0.028, 16);
        const fictionalRingMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

        // タッチ判定用（広く取る）
        const hitGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        const placedMajors = [];
        const placedLocals = [];
        const placedFictionals = [];
        
        // 【重要】間引き距離の最適化。Fictionalが消えすぎないよう距離を微調整
        const EXCLUDE_DIST_MAJOR = 0.18; 
        const EXCLUDE_DIST_LOCAL = 0.12;
        const EXCLUDE_DIST_FICTIONAL = 0.10;

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
                highlightTarget = new THREE.Mesh(fictionalRingGeo, fictionalRingMat.clone());
                markerGroup.add(highlightTarget);
            }

            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { 
                airportData: airport, 
                ringMesh: highlightTarget,
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
            if (m.userData.ringMesh) {
                m.userData.ringMesh.material.color.setHex(m.userData.originalColor);
                m.userData.isHighlighted = false;
            }
        });

        if (hitMesh && hitMesh.userData.ringMesh) {
            hitMesh.userData.ringMesh.material.color.setHex(0xffffff);
            hitMesh.userData.isHighlighted = true;
        }
    }

    // カメラ距離に応じたスケールの動的補正
    updateMarkerScale(camera) {
        this.airportGroup.children.forEach(markerGroup => {
            const markerWorldPos = new THREE.Vector3();
            markerGroup.getWorldPosition(markerWorldPos);
            const distance = camera.position.distanceTo(markerWorldPos);
            
            // 遠ざかるほどマーカーを拡大し、視認性を維持する
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


