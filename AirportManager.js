import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
import { AIRPORTS } from './AirportData.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 世界の主要空港マーカーを3D空間（地球表面）へ描画し、拡大縮小に100%追従させるマネージャー。
 * 【デザイン仕様】
 * - 中心発光点（Inner Core）＋ 外周ネオンリング（Outer Ring）の二重構造。
 * - タッチ・クリック判定領域（hitBox）を視覚表示の約3倍に大きく設定し、指での操作誤作動を劇的に軽減します。
 */
export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.airportGroup = new THREE.Group();
        this.globeGroup.add(this.airportGroup);

        this.markers = []; // 将来のレイキャスト（タップ検知）用参照配列
    }

    buildAirportMarkers() {
        // 空港マーカーの共通ジオメトリ・マテリアル
        const coreGeo = new THREE.SphereGeometry(0.025, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // 中心高輝度ホワイト

        const ringGeo = new THREE.RingGeometry(0.04, 0.06, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.COASTLINE,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        });

        // 将来の Raycaster（タッチ判定）用見えないクリック領域
        const hitGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });

        AIRPORTS.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS + 0.02);
            const markerGroup = new THREE.Group();
            markerGroup.position.copy(pos);

            // 球面の法線ベクトルに合わせてリングを球面に沿わせる回転設定
            markerGroup.lookAt(pos.clone().multiplyScalar(2));

            // 1. 中心の白く光る点
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            markerGroup.add(coreMesh);

            // 2. 外周のネオンリング
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            markerGroup.add(ringMesh);

            // 3. 広範囲タッチターゲット判定用の不可視メッシュ
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { airportData: airport }; // 空港情報を保持
            markerGroup.add(hitMesh);

            this.airportGroup.add(markerGroup);
            this.markers.push(hitMesh);
        });
    }
}

