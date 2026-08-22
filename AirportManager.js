import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS } from './AirportData.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 主要(Major)とローカル(Local)の空港をデザインを分けて3D球面上に描画するマネージャー。
 * 【スマート間引きロジック】
 * 空港数が多すぎるため、Major空港の近くにあるLocal空港、およびLocal同士が密集している領域の
 * Local空港を自動的にスキップし、画面のバランス（黄金比）を保ちます。
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
        // --- Major Hub 用デザイン（目立つ二重リング） ---
        const majorCoreGeo = new THREE.SphereGeometry(0.025, 16, 16);
        const majorCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const majorRingGeo = new THREE.RingGeometry(0.04, 0.06, 32);
        const majorRingMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.COASTLINE, side: THREE.DoubleSide, transparent: true, opacity: 0.85
        });

        // --- Local Airport 用デザイン（控えめな点と極細リング） ---
        const localCoreGeo = new THREE.SphereGeometry(0.012, 8, 8);
        const localCoreMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc }); // 明るいシアン
        const localRingGeo = new THREE.RingGeometry(0.02, 0.025, 16);
        const localRingMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.4
        });

        // タッチ判定用の見えない当たり判定ボックス（指で押しやすいよう広めに設定）
        const hitGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        const placedMajors = [];
        const placedLocals = [];
        
        // --- 間引き用閾値（距離） ---
        const MAJOR_EXCLUDE_DIST = 0.20; // Majorの近くにあるLocalを消す範囲
        const LOCAL_EXCLUDE_DIST = 0.12; // Local同士が近すぎる場合に間引く範囲

        AIRPORTS.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS + 0.02);

            // --- 重複・近接間引きロジック ---
            if (airport.type === 'local') {
                const nearMajor = placedMajors.some(p => p.distanceTo(pos) < MAJOR_EXCLUDE_DIST);
                if (nearMajor) return; // Majorの近くなら間引く
                const nearLocal = placedLocals.some(p => p.distanceTo(pos) < LOCAL_EXCLUDE_DIST);
                if (nearLocal) return; // Local同士が近すぎたら間引く
                placedLocals.push(pos);
            } else {
                placedMajors.push(pos);
            }

            const markerGroup = new THREE.Group();
            markerGroup.position.copy(pos);
            markerGroup.lookAt(pos.clone().multiplyScalar(2));

            let ringMesh;
            if (airport.type === 'major') {
                markerGroup.add(new THREE.Mesh(majorCoreGeo, majorCoreMat));
                ringMesh = new THREE.Mesh(majorRingGeo, majorRingMat.clone());
                markerGroup.add(ringMesh);
            } else {
                markerGroup.add(new THREE.Mesh(localCoreGeo, localCoreMat));
                ringMesh = new THREE.Mesh(localRingGeo, localRingMat.clone());
                markerGroup.add(ringMesh);
            }

            // Raycaster用ヒットメッシュに空港情報やリングの参照を持たせる
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { 
                airportData: airport, 
                ringMesh: ringMesh,
                originalColor: ringMesh.material.color.getHex()
            };
            markerGroup.add(hitMesh);

            this.airportGroup.add(markerGroup);
            this.markers.push(hitMesh);
        });
    }

    // タップされたマーカーのハイライト（選択アニメーション）
    highlightMarker(hitMesh) {
        // 全てリセット
        this.markers.forEach(m => {
            if (m.userData.ringMesh) {
                m.userData.ringMesh.material.color.setHex(m.userData.originalColor);
                m.userData.ringMesh.scale.set(1, 1, 1);
            }
        });

        // 選択されたものをハイライト・拡大
        if (hitMesh && hitMesh.userData.ringMesh) {
            hitMesh.userData.ringMesh.material.color.setHex(0xffffff); // 白色に発光
            hitMesh.userData.ringMesh.scale.set(1.5, 1.5, 1.5);
        }
    }
}


