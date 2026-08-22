import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { REAL_AIRPORTS } from './Data_RealAirports.js';
import { FICTIONAL_AIRPORTS } from './Data_FictionalAirports.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【3階層デザインとズーム視認性確保】
 * Major(三重円), Local(二重円), Fictional(単円) のデザイン階層を構築します。
 * また、縮小(引き)時にマーカーが潰れて見えなくなる問題を防ぐため、
 * updateMarkerScale(camera) メソッドでカメラ距離に応じたスケール動的補正を行います。
 */
export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.airportGroup = new THREE.Group();
        this.globeGroup.add(this.airportGroup);

        this.markers = []; // Raycaster判定用の不可視メッシュ配列
    }

    buildAirportMarkers() {
        const allAirports = [...REAL_AIRPORTS, ...FICTIONAL_AIRPORTS];

        // --- Major Hub 用デザイン（目立つ三重円） ---
        const majorCoreGeo = new THREE.SphereGeometry(0.02, 16, 16);
        const majorCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const majorInnerRingGeo = new THREE.RingGeometry(0.035, 0.045, 32);
        const majorOuterRingGeo = new THREE.RingGeometry(0.06, 0.065, 32);
        const majorRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }); // ゴールド系

        // --- Local Airport 用デザイン（標準の二重円） ---
        const localCoreGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const localCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const localRingGeo = new THREE.RingGeometry(0.035, 0.045, 24);
        const localRingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }); // シアン系

        // --- Fictional Airport 用デザイン（背景に溶け込む単円） ---
        const fictionalRingGeo = new THREE.RingGeometry(0.02, 0.025, 16);
        const fictionalRingMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }); // エメラルド系

        const hitGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        const placedMajors = [];
        const placedLocals = [];
        const MAJOR_EXCLUDE_DIST = 0.20;
        const LOCAL_EXCLUDE_DIST = 0.12;

        allAirports.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS + 0.02);

            // --- 重複・近接間引きロジック ---
            if (airport.type === 'fictional') {
                const nearMajor = placedMajors.some(p => p.distanceTo(pos) < MAJOR_EXCLUDE_DIST);
                if (nearMajor) return;
                const nearLocal = placedLocals.some(p => p.distanceTo(pos) < LOCAL_EXCLUDE_DIST);
                if (nearLocal) return;
            } else if (airport.type === 'local') {
                const nearMajor = placedMajors.some(p => p.distanceTo(pos) < MAJOR_EXCLUDE_DIST);
                if (nearMajor) return;
                const nearLocal = placedLocals.some(p => p.distanceTo(pos) < LOCAL_EXCLUDE_DIST);
                if (nearLocal) return;
                placedLocals.push(pos);
            } else {
                placedMajors.push(pos);
            }

            const markerGroup = new THREE.Group();
            markerGroup.position.copy(pos);
            markerGroup.lookAt(pos.clone().multiplyScalar(2));

            // デザイン階層の構築
            let highlightTarget; // タップ時に光らせる対象
            if (airport.type === 'major') {
                markerGroup.add(new THREE.Mesh(majorCoreGeo, majorCoreMat));
                markerGroup.add(new THREE.Mesh(majorInnerRingGeo, majorRingMat.clone()));
                highlightTarget = new THREE.Mesh(majorOuterRingGeo, majorRingMat.clone());
                markerGroup.add(highlightTarget);
            } else if (airport.type === 'local') {
                markerGroup.add(new THREE.Mesh(localCoreGeo, localCoreMat));
                highlightTarget = new THREE.Mesh(localRingGeo, localRingMat.clone());
                markerGroup.add(highlightTarget);
            } else {
                // Fictional はコアを持たず、リングのみ
                highlightTarget = new THREE.Mesh(fictionalRingGeo, fictionalRingMat.clone());
                markerGroup.add(highlightTarget);
            }

            // 当たり判定
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
            hitMesh.userData.ringMesh.material.color.setHex(0xffffff); // 白く発光
            hitMesh.userData.isHighlighted = true;
        }
    }

    // --- カメラ距離に応じたスケールの動的補正（ズーム縮小時の視認性確保） ---
    updateMarkerScale(camera) {
        this.airportGroup.children.forEach(markerGroup => {
            const markerWorldPos = new THREE.Vector3();
            markerGroup.getWorldPosition(markerWorldPos);
            
            const distance = camera.position.distanceTo(markerWorldPos);
            
            // カメラが離れるほど倍率を上げる（minDistance=5.5 のときは約1倍）
            const baseScale = Math.max(1, distance / 12); 
            
            // ヒットメッシュ(子供)を検索してハイライト状態を確認
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


