/**
 * AI可読性・先祖返り防止コメント:
 * 【ハイライト機能の分離とバグ復旧】
 * 履歴176に基づき、起動不能バグを修正しました。
 * 1. 架空のメソッドを廃止し、3つのデータファイル（Major, Local, Fictional）から直接結合する元の設計に復旧。
 * 2. Three.js r128 互換のため、removeFromParent() を使用せず parent.remove() に修正。
 * 連続操作中に「起点（出発地）」を見失わないよう、ハイライトを独立管理しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
// ★修正1: 正しいデータソースの直接インポート
import { majorNodes } from './Data_Major.js';
import { localNodes } from './Data_Local.js';
import { fictionalNodes } from './Data_Fictional.js';

export class AirportManager {
    constructor(scene, globeGroup) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.markers = [];
        this.airportMap = new Map();
        
        this.originHighlightMesh = null;
        this.destHighlightMesh = null;
    }

    buildAirportMarkers() {
        const createMarker = (data, color, size) => {
            const geometry = new THREE.CircleGeometry(size, 16);
            const material = new THREE.MeshBasicMaterial({ 
                color: color, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                depthTest: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            const pos = Utils.latLonToVector3(data.lat, data.lon, CONFIG.GLOBE_RADIUS + 0.005);
            mesh.position.copy(pos);
            mesh.lookAt(new THREE.Vector3(0,0,0));

            mesh.userData = { airportData: data };
            
            this.globeGroup.add(mesh);
            this.markers.push(mesh);
            this.airportMap.set(data.id, data);
        };

        // ★修正1: 存在しない架空メソッドを廃止し、3つの配列を結合する正しい処理に復旧
        const allAirports = [...majorNodes, ...localNodes, ...fictionalNodes];
        
        allAirports.forEach(data => {
            let color = CONFIG.COLORS.MARKER_LOCAL;
            let size = 0.015;
            if (data.type === 'major') {
                color = CONFIG.COLORS.MARKER_MAJOR;
                size = 0.025;
            } else if (data.type === 'fictional') {
                color = CONFIG.COLORS.MARKER_FICTIONAL;
                size = 0.012;
            }
            createMarker(data, color, size);
        });
    }

    getAirportById(id) {
        return this.airportMap.get(id);
    }

    highlightOrigin(mesh) {
        if (this.originHighlightMesh) {
            // ★修正2: r128互換の安全なオブジェクト削除方法
            if (this.originHighlightMesh.parent) {
                this.originHighlightMesh.parent.remove(this.originHighlightMesh);
            }
            this.originHighlightMesh.geometry.dispose();
            this.originHighlightMesh.material.dispose();
            this.originHighlightMesh = null;
        }
        if (mesh) {
            const geo = new THREE.RingGeometry(0.04, 0.05, 32);
            const mat = new THREE.MeshBasicMaterial({ 
                color: 0xffd700, // 黄金色
                side: THREE.DoubleSide, 
                transparent: true, 
                opacity: 0.9,
                depthTest: false
            });
            this.originHighlightMesh = new THREE.Mesh(geo, mat);
            mesh.add(this.originHighlightMesh);
        }
    }

    highlightDestination(mesh) {
        if (this.destHighlightMesh) {
            // ★修正2: r128互換の安全なオブジェクト削除方法
            if (this.destHighlightMesh.parent) {
                this.destHighlightMesh.parent.remove(this.destHighlightMesh);
            }
            this.destHighlightMesh.geometry.dispose();
            this.destHighlightMesh.material.dispose();
            this.destHighlightMesh = null;
        }
        if (mesh) {
            const geo = new THREE.RingGeometry(0.03, 0.04, 32);
            const mat = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, // シアン
                side: THREE.DoubleSide, 
                transparent: true, 
                opacity: 0.8,
                depthTest: false
            });
            this.destHighlightMesh = new THREE.Mesh(geo, mat);
            mesh.add(this.destHighlightMesh);
        }
    }

    clearHighlights() {
        this.highlightOrigin(null);
        this.highlightDestination(null);
    }

    updateMarkerScale(camera) {
        const camPos = camera.position;
        this.markers.forEach(mesh => {
            const dist = camPos.distanceTo(mesh.position);
            const scale = Math.max(0.5, Math.min(2.5, dist / 10));
            mesh.scale.set(scale, scale, scale);
        });
    }
}