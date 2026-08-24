/**
 * AI可読性・先祖返り防止コメント:
 * 【ダブル・ハイライト機能の分離】
 * 履歴174に基づき、既存の highlightMarker を廃止し、
 * highlightOrigin (起点・黄色) と highlightDestination (行先・シアン) に分離。
 * 連続開拓中に出発地を見失う迷子問題を解消し、お絵かきUXを視覚的に支援します。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.markers = [];
        
        // ★修正: 起点用と行先用の2つのリングを生成
        this.highlightOriginRing = this.createHighlightRing(CONFIG.COLORS.HIGHLIGHT); // 黄色系 (起点)
        this.highlightDestRing = this.createHighlightRing(0x00ffff); // シアン系 (行先)

        this.globeGroup.add(this.highlightOriginRing);
        this.globeGroup.add(this.highlightDestRing);
    }

    createHighlightRing(color) {
        const geometry = new THREE.RingGeometry(1.2, 1.4, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            depthTest: false
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.visible = false;
        ring.renderOrder = 999;
        return ring;
    }

    buildAirportMarkers() {
        this.markers = [];
        const allAirports = [
            ...window.MAP_DATA.majors,
            ...window.MAP_DATA.locals,
            ...window.MAP_DATA.fictionals
        ];

        allAirports.forEach(airport => {
            const pos = Utils.latLonToVector3(airport.lat, airport.lon, CONFIG.GLOBE_RADIUS);
            
            let color, radius;
            if (airport.type === 'major') {
                color = CONFIG.COLORS.MARKER_MAJOR;
                radius = 0.4;
            } else if (airport.type === 'local') {
                color = CONFIG.COLORS.MARKER_LOCAL;
                radius = 0.25;
            } else {
                color = CONFIG.COLORS.MARKER_FICTIONAL;
                radius = 0.25;
            }

            const geometry = new THREE.CircleGeometry(radius, 32);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                depthWrite: false
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(pos);
            mesh.lookAt(new THREE.Vector3(0,0,0));
            
            const normal = pos.clone().normalize();
            mesh.position.add(normal.multiplyScalar(0.02)); 

            mesh.userData = { airportData: airport };
            
            this.globeGroup.add(mesh);
            this.markers.push(mesh);
        });
    }

    // 後方互換・単一選択用
    highlightMarker(mesh) {
        this.highlightOrigin(mesh);
        this.highlightDestination(null);
    }

    // ★追加: 起点専用のハイライト
    highlightOrigin(mesh) {
        if (!mesh) {
            this.highlightOriginRing.visible = false;
            return;
        }
        mesh.getWorldPosition(this.highlightOriginRing.position);
        this.highlightOriginRing.quaternion.copy(mesh.quaternion);
        const normal = this.highlightOriginRing.position.clone().normalize();
        this.highlightOriginRing.position.add(normal.multiplyScalar(0.01));
        this.highlightOriginRing.visible = true;
    }

    // ★追加: 行先専用のハイライト
    highlightDestination(mesh) {
        if (!mesh) {
            this.highlightDestRing.visible = false;
            return;
        }
        mesh.getWorldPosition(this.highlightDestRing.position);
        this.highlightDestRing.quaternion.copy(mesh.quaternion);
        const normal = this.highlightDestRing.position.clone().normalize();
        this.highlightDestRing.position.add(normal.multiplyScalar(0.01));
        this.highlightDestRing.visible = true;
    }

    updateMarkerScale(camera) {
        const dist = camera.position.length();
        let scale = 1.0;
        
        if (dist > 15) {
            scale = 1.0 + (dist - 15) * 0.05;
        }

        this.markers.forEach(marker => {
            marker.scale.set(scale, scale, 1);
        });

        // ハイライトリングもカメラ距離に応じてスケールさせる
        if (this.highlightOriginRing.visible) {
            this.highlightOriginRing.scale.set(scale, scale, 1);
        }
        if (this.highlightDestRing.visible) {
            this.highlightDestRing.scale.set(scale, scale, 1);
        }
    }
}