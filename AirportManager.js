/**
 * AI可読性・先祖返り防止コメント:
 * 【安全な最適化A：ジオメトリとマテリアルの共有化】
 * 履歴183に基づき、マーカー生成時の new THREE.MeshBasicMaterial() 等をループ外に出し、
 * 3種類の形・色を事前に作成して全マーカーで共有（使い回し）するように修正しました。
 * 見た目を一切変えずにメモリ使用量とGC負荷を劇的に下げています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';
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
        // ★最適化A: ジオメトリとマテリアルを1回だけ作成して共有する
        const geoMajor = new THREE.CircleGeometry(0.025, 16);
        const geoLocal = new THREE.CircleGeometry(0.015, 16);
        const geoFictional = new THREE.CircleGeometry(0.012, 16);

        const matMajor = new THREE.MeshBasicMaterial({ 
            color: CONFIG.COLORS.MARKER_MAJOR, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false 
        });
        const matLocal = new THREE.MeshBasicMaterial({ 
            color: CONFIG.COLORS.MARKER_LOCAL, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false 
        });
        const matFictional = new THREE.MeshBasicMaterial({ 
            color: CONFIG.COLORS.MARKER_FICTIONAL, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false 
        });

        const allAirports = [...majorNodes, ...localNodes, ...fictionalNodes];
        
        // 中心点を一度だけ定義して共有（lookAt用）
        const centerPos = new THREE.Vector3(0, 0, 0);
        
        allAirports.forEach(data => {
            let geometry = geoLocal;
            let material = matLocal;

            if (data.type === 'major') {
                geometry = geoMajor;
                material = matMajor;
            } else if (data.type === 'fictional') {
                geometry = geoFictional;
                material = matFictional;
            }

            // ★ループ内では共有データを使ってMeshだけを作成する
            const mesh = new THREE.Mesh(geometry, material);
            
            const pos = Utils.latLonToVector3(data.lat, data.lon, CONFIG.GLOBE_RADIUS + 0.005);
            mesh.position.copy(pos);
            mesh.lookAt(centerPos);

            mesh.userData = { airportData: data };
            
            this.globeGroup.add(mesh);
            this.markers.push(mesh);
            this.airportMap.set(data.id, data);
        });
    }

    getAirportById(id) {
        return this.airportMap.get(id);
    }

    highlightOrigin(mesh) {
        if (this.originHighlightMesh) {
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
                color: 0xffd700,
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
                color: 0x00ffff,
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