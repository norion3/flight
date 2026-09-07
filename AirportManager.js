/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 5: 主要空港開発（全80空港）2ビット・ビットマップ極小QRセーブ＆完全復元】
 * 1. 【2ビット圧縮保存（exportDevLevels）】画面上の全主要空港（type === 'major'）のLv 0〜3を
 *    2ビットずつパック（4空港/1バイト）し、わずか27文字（約20バイト）のBase64文字列として極小出力。
 * 2. 【一括完全復元（restoreDevLevels）】読み込んだ極小ビット文字列をデコードし、
 *    全主要空港の3Dタワー（Lv 0〜3）と自社エメラルドマテリアルを一瞬で再構築。
 * 3. 3Dタワー造形（スリム・先細り・透明感）、地平線ディゾルブ、ハイライト等は100%完全保持。
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
            let majorRings = [];

            if (airport.type === 'major') {
                const coreMesh = new THREE.Mesh(majorCoreGeo, majorCoreMat);
                const r1 = new THREE.Mesh(majorRingGeo1, majorRingMat.clone());
                highlightTarget = new THREE.Mesh(majorRingGeo2, majorRingMat.clone());
                
                visualGroup.add(coreMesh);
                visualGroup.add(r1);
                visualGroup.add(highlightTarget);
                
                majorRings = [r1, highlightTarget];
            } else if (airport.type === 'local') {
                visualGroup.add(new THREE.Mesh(localCoreGeo, localCoreMat));
                highlightTarget = new THREE.Mesh(localRingGeo, localRingMat.clone());
                visualGroup.add(highlightTarget);
            } else {
                highlightTarget = new THREE.Mesh(fictionalGeo, fictionalMat.clone());
                visualGroup.add(highlightTarget);
            }

            markerGroup.add(visualGroup);

            // ★Phase 1 テスト表示設定: 日本周辺の初期視界で Lv 1〜3 を一斉比較
            let initialDevLevel = 0;
            if (airport.id === 'HND') initialDevLevel = 1;      // 羽田: Lv 1（低層ベース）
            else if (airport.id === 'NRT') initialDevLevel = 2; // 成田: Lv 2（中層タワー）
            else if (airport.id === 'ICN') initialDevLevel = 3; // 仁川: Lv 3（完成・高層尖塔）

            markerGroup.userData = { 
                airportData: airport, 
                targetMesh: highlightTarget,
                originalColor: highlightTarget.material.color.getHex(),
                isOrigin: false,
                isDest: false,
                visualGroup: visualGroup,
                majorRings: majorRings,
                devLevel: 0,
                towerGroup: null,
                fadeMaterials: []
            };

            this.airportGroup.add(markerGroup);
            this.markers.push(markerGroup);

            if (initialDevLevel > 0) {
                this.setAirportDevLevel(markerGroup, initialDevLevel);
            }
        });
    }

    /**
     * 空港の3Dタワー造形（オベリスク・テーパー先細り光柱 ＋ 頂点リング ＋ 自社エメラルドマテリアル）
     */
    setAirportDevLevel(markerGroup, level) {
        if (!markerGroup || !markerGroup.userData) return;
        const u = markerGroup.userData;
        u.devLevel = level;

        // 既存タワーの消去
        if (u.towerGroup) {
            u.visualGroup.remove(u.towerGroup);
            u.towerGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            u.towerGroup = null;
            u.fadeMaterials = [];
        }

        if (level <= 0) {
            // Lv 0: 通常の黄金二重リングへ復帰
            if (u.majorRings && u.majorRings.length > 0) {
                u.majorRings.forEach(r => {
                    r.material.color.setHex(0xfde047);
                    r.material.opacity = 0.9;
                });
            }
            u.originalColor = 0xfde047;
            return;
        }

        // Lv 1〜3: 地表リングを自社カラー（エメラルド 0x34d399）へ染める
        const playerEmeraldHex = 0x34d399;
        if (u.majorRings && u.majorRings.length > 0) {
            u.majorRings.forEach(r => {
                r.material.color.setHex(playerEmeraldHex);
                r.material.opacity = 0.95;
            });
        }
        u.originalColor = playerEmeraldHex;

        const towerGroup = new THREE.Group();
        const fadeMats = [];

        // 黄金比率寸法: Lv 1: 0.08 / Lv 2: 0.16 / Lv 3: 0.24 (地球半径5.0比 1.6%〜4.8%)
        const heights = [0, 0.08, 0.16, 0.24];
        const h = heights[level] || 0.08;
        
        // ★デザインブラッシュアップ: 太さを約37%スリム化（0.06 ➔ 0.038）し、先細りテーパーを鋭角化（55%）
        const radiusBottom = 0.038;
        const radiusTop = radiusBottom * 0.55; 

        // 1. 半透明オベリスク・シリンダー光柱（ワイヤー感を減らし8角形で透明度0.22のホログラムガラス調へ）
        const cylinderGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, h, 8, 1, true);
        const cylinderMat = new THREE.MeshBasicMaterial({
            color: playerEmeraldHex,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
        // markerGroupは法線方向を向いているため、Z+方向へ向けて配置
        cylinderMesh.rotation.x = Math.PI / 2;
        cylinderMesh.position.z = h / 2;
        towerGroup.add(cylinderMesh);
        fadeMats.push(cylinderMat);

        // 2. タワー四隅のネオンエッジライン（透明度を控えめにして密集地でのゴチャつきを抑制）
        const edgesGeo = new THREE.EdgesGeometry(cylinderGeo);
        const edgesMat = new THREE.LineBasicMaterial({
            color: 0x6ee7b7,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        const edgesLines = new THREE.LineSegments(edgesGeo, edgesMat);
        edgesLines.rotation.x = Math.PI / 2;
        edgesLines.position.z = h / 2;
        towerGroup.add(edgesLines);
        fadeMats.push(edgesMat);

        // 3. 頂点リング（スリムな先細り形状に合わせて繊細な二重リングを形成）
        const topRingGeo = new THREE.RingGeometry(radiusTop * 0.65, radiusTop, 24);
        const topRingMat = new THREE.MeshBasicMaterial({
            color: 0xa7f3d0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.90,
            depthWrite: false
        });
        const topRingMesh = new THREE.Mesh(topRingGeo, topRingMat);
        topRingMesh.position.z = h;
        towerGroup.add(topRingMesh);
        fadeMats.push(topRingMat);

        // 4. 頂点ビーコン光点（管制シグナル・プロポーションに合わせて繊細化）
        const beaconGeo = new THREE.SphereGeometry(0.008, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthWrite: false
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.z = h + 0.004;
        towerGroup.add(beaconMesh);
        fadeMats.push(beaconMat);

        u.towerGroup = towerGroup;
        u.fadeMaterials = fadeMats;
        u.visualGroup.add(towerGroup);
    }

    /**
     * ★Phase 5: 全主要空港（約80箇所）のLv0〜3を2ビットずつパックし極小Base64文字列（約27文字）で出力
     */
    exportDevLevels() {
        const majors = this.markers.filter(m => m.userData.airportData && m.userData.airportData.type === 'major');
        if (majors.length === 0) return '';

        // すべて未開発（Lv 0）なら空文字を返してQR容量を節約
        const hasAnyDev = majors.some(m => (m.userData.devLevel || 0) > 0);
        if (!hasAnyDev) return '';

        let chars = [];
        for (let i = 0; i < majors.length; i += 4) {
            let b = 0;
            for (let j = 0; j < 4; j++) {
                if (i + j < majors.length) {
                    const lvl = (majors[i + j].userData.devLevel || 0) & 0x03;
                    b |= (lvl << (j * 2));
                }
            }
            chars.push(String.fromCharCode(b));
        }
        return btoa(chars.join(''));
    }

    /**
     * ★Phase 5: 極小Base64文字列から全主要空港の3Dタワーを完全一括復元
     */
    restoreDevLevels(str) {
        const majors = this.markers.filter(m => m.userData.airportData && m.userData.airportData.type === 'major');
        if (majors.length === 0) return;

        // 文字列がない場合は全主要空港を Lv 0 にリセット
        if (!str) {
            majors.forEach(m => this.setAirportDevLevel(m, 0));
            return;
        }

        try {
            const bin = atob(str);
            let airportIdx = 0;
            for (let i = 0; i < bin.length && airportIdx < majors.length; i++) {
                const b = bin.charCodeAt(i);
                for (let j = 0; j < 4 && airportIdx < majors.length; j++) {
                    const lvl = (b >> (j * 2)) & 0x03;
                    this.setAirportDevLevel(majors[airportIdx], lvl);
                    airportIdx++;
                }
            }
        } catch (e) {
            console.error('[AirportManager] restoreDevLevels error:', e);
        }
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
            const cosTheta = dirC.dot(dirP);
            
            if (cosTheta < horizonCos - 0.05) {
                hitMesh.visible = false;
                return; 
            } else {
                hitMesh.visible = true;
            }

            // ★ホライゾン・ディゾルブ: 地平線の境目でタワー先端だけが宇宙に浮遊するのを防ぐフェード処理
            if (hitMesh.userData.fadeMaterials && hitMesh.userData.fadeMaterials.length > 0) {
                const diff = cosTheta - horizonCos;
                let fadeFactor = 1.0;
                if (diff < 0.15) {
                    fadeFactor = Math.max(0, diff / 0.15);
                }
                hitMesh.userData.fadeMaterials.forEach(mat => {
                    if (mat._baseOpacity === undefined) mat._baseOpacity = mat.opacity;
                    mat.opacity = mat._baseOpacity * fadeFactor;
                });
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