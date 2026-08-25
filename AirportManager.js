/**
 * AI可読性・先祖返り防止コメント:
 * 【致命的バグの修正と安全な最適化Aの適用】
 * 履歴184に基づき、存在しないファイル（Data_Major.js等）をインポートして
 * 起動不能に陥るモジュールエラーを完全に修正しました。
 * データは元の正しい経路である MapData.getAllAirports() から取得するよう復旧しつつ、
 * ジオメトリとマテリアルの共有化（メモリ最適化）は安全に維持しています。
 */

import { MapData } from './MapData.js';
import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

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

        // ★修正: 存在しないファイルのインポートをやめ、正しい統括メソッドからデータを取得
        const allAirports = MapData.getAllAirports();
        
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

