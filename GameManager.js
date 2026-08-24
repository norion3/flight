/**
 * AI可読性・先祖返り防止コメント:
 * 【安全マージンをとった航続距離の制限】
 * 履歴161に基づき、Utils をインポートし、空路開拓時に「2点間の3D直線距離」を測定する
 * ロジックを追加しました。
 * 距離が地球儀半径の1.25倍を超える場合、地中貫通バグを防ぎ、かつハブ空港の構築を促すため、
 * 開拓をブロックして「航続距離を超えています」という警告を表示させます。
 */

import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';
import { UIManager } from './UIManager.js';
import { NetworkManager } from './NetworkManager.js';
import { PlaneManager } from './PlaneManager.js';
import { Utils } from './Utils.js'; // ★追加: 距離測定のためインポート

const STATE_IDLE = 0;
const STATE_CONNECTING = 1;

export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.state = STATE_IDLE;
        this.selectedOrigin = null;

        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);
        this.networkManager = new NetworkManager(this.scene, this.globe.group);
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.uiManager = new UIManager();

        this.uiManager.onConnectRequested = () => {
            this.state = STATE_CONNECTING;
            this.airportManager.highlightMarker(this.selectedHitMesh);
            this.uiManager.setConnectingMode();
        };

        this.uiManager.onRouteCanceled = () => {
            this.resetState();
        };

        this.uiManager.onRouteActionConfirmed = (actionType) => {
            if (this.selectedOrigin && this.selectedDestination) {
                const originData = this.selectedOrigin.userData.airportData;
                const destData = this.selectedDestination.userData.airportData;

                if (actionType === 'add') {
                    this.networkManager.addRoute(originData, destData);
                    this.planeManager.wakeUpPlanes();
                } else if (actionType === 'remove') {
                    this.networkManager.removeRoute(originData, destData);
                    this.planeManager.checkAndReassignPlanes();
                }
            }
            this.resetState();
        };

        this.uiManager.onBuyPlane = (type) => {
            const success = this.planeManager.addPlane(type);
            if (!success) {
                this.uiManager.showToast(window.APP_LANG.toastNoRoute);
            }
        };

        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.selectedHitMesh = null;
        this.selectedDestination = null;

        this.clock = new THREE.Clock();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resetState() {
        this.state = STATE_IDLE;
        this.selectedOrigin = null;
        this.selectedDestination = null;
        this.selectedHitMesh = null;
        this.airportManager.highlightMarker(null);
        this.uiManager.hideAll();
    }

    initThree() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const jpLat = 35.6; 
        const jpLon = 139.7; 
        const distance = 22.0; 
        const phi = (90 - jpLat) * (Math.PI / 180);
        const theta = (jpLon + 180) * (Math.PI / 180);
        
        this.camera.position.set(
            -(distance * Math.sin(phi) * Math.cos(theta)),
            distance * Math.cos(phi),
            distance * Math.sin(phi) * Math.sin(theta)
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = 5.5;
        this.controls.maxDistance = 25.0;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI - 0.1;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(CONFIG.COLORS.COASTLINE, 0.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
    }

    async start() {
        this.globe.buildBase();

        const success = await this.mapData.loadData();
        if (success) {
            this.globe.buildCoastlines(this.mapData.coastlinePoints);
            this.airportManager.buildAirportMarkers();
            
            this.initStarterPack();
            
            this.hideLoader();
        } else {
            this.showError("Error", window.APP_LANG.errMapLoad);
        }

        this.animate();
    }

    initStarterPack() {
        const hnd = this.airportManager.getAirportById('HND'); 
        const cts = this.airportManager.getAirportById('CTS'); 
        const fuk = this.airportManager.getAirportById('FUK'); 

        if (hnd && cts) this.networkManager.addRoute(hnd, cts);
        if (hnd && fuk) this.networkManager.addRoute(hnd, fuk);

        this.planeManager.addPlane('small');
        this.planeManager.addPlane('small');
    }

    onPointerDown(event) {
        this.isDragging = false;
        this.dragStartPos = { x: event.clientX, y: event.clientY };
    }

    onPointerUp(event) {
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            this.handleTap(event);
        }
    }

    handleTap(event) {
        if (event.target !== this.renderer.domElement) return;

        const tapX = event.clientX;
        const tapY = event.clientY;
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;

        const maxDist = 45; 
        
        let bestHit = null;
        let minDistance = maxDist;

        this.airportManager.markers.forEach(hitMesh => {
            const pos = new THREE.Vector3();
            hitMesh.getWorldPosition(pos);

            const cameraToMarker = this.camera.position.clone().sub(pos);
            const normal = pos.clone().normalize();
            if (cameraToMarker.dot(normal) < 0) return; 

            const proj = pos.clone().project(this.camera);

            const screenX = (proj.x * widthHalf) + widthHalf;
            const screenY = -(proj.y * heightHalf) + heightHalf;

            const dx = tapX - screenX;
            const dy = tapY - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDistance) {
                minDistance = dist;
                bestHit = hitMesh;
            }
        });

        if (this.state === STATE_IDLE) {
            if (bestHit) {
                this.selectedHitMesh = bestHit;
                const data = bestHit.userData.airportData;
                this.airportManager.highlightMarker(bestHit);
                
                const currConns = this.networkManager.getConnectionCount(data.id);
                const maxConns = this.networkManager.MAX_CONNECTIONS[data.type];
                
                this.uiManager.showAirportInfo(data, currConns, maxConns);
            } else {
                this.resetState();
            }
        } else if (this.state === STATE_CONNECTING) {
            if (bestHit && bestHit !== this.selectedHitMesh) {
                this.selectedOrigin = this.selectedHitMesh;
                this.selectedDestination = bestHit;
                
                const originData = this.selectedOrigin.userData.airportData;
                const destData = this.selectedDestination.userData.airportData;

                const isConnected = this.networkManager.isConnected(originData.id, destData.id);

                if (isConnected) {
                    this.airportManager.highlightMarker(this.selectedDestination);
                    this.uiManager.showRouteConfirm(originData, destData, true); 
                } else {
                    // ★追加: 黄金の航続距離制限ロジック（安全マージン 1.25倍）
                    const posA = Utils.latLonToVector3(originData.lat, originData.lon, CONFIG.GLOBE_RADIUS);
                    const posB = Utils.latLonToVector3(destData.lat, destData.lon, CONFIG.GLOBE_RADIUS);
                    const distance = posA.distanceTo(posB);
                    const maxDistance = CONFIG.GLOBE_RADIUS * 1.25;

                    if (distance > maxDistance) {
                        // 制限距離オーバー時は弾く
                        this.uiManager.showToast(window.APP_LANG.toastOverDistance);
                        this.resetState();
                    } else if (this.networkManager.canConnect(originData, destData)) {
                        this.airportManager.highlightMarker(this.selectedDestination);
                        this.uiManager.showRouteConfirm(originData, destData, false); 
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                        this.resetState();
                    }
                }
            } else {
                this.resetState();
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();

        this.airportManager.updateMarkerScale(this.camera);
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta);
        
        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    hideLoader() {
        this.loaderUI.classList.add('opacity-0');
        setTimeout(() => this.loaderUI.remove(), 500);
    }

    showError(title, msg) {
        this.loaderUI.querySelector('h2').innerText = title;
        this.loaderUI.querySelector('p').innerText = msg;
    }
}