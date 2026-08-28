/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: 経済連動ロジックのハブ結合（ネットワークボーナス対応）】
 * 履歴332に基づき、`animate` ループ内で `EconomyManager.update` を呼び出す際、
 * `this.networkManager` を追加で渡すように変更しました。
 * これにより、EconomyManagerが全空路の総延長を計算し、収益の絶対安定化が可能になります。
 */

import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';
import { UIManager } from './UIManager.js';
import { NetworkManager } from './NetworkManager.js';
import { PlaneManager } from './PlaneManager.js';
import { RivalManager } from './RivalManager.js';
import { EconomyManager } from './EconomyManager.js';
import { Utils } from './Utils.js';

const STATE_IDLE = 0;
const STATE_CONNECTING = 1;

export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.state = STATE_IDLE;
        this.selectedOrigin = null;

        this.targetDistance = null; 

        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);
        this.networkManager = new NetworkManager(this.scene, this.globe.group);
        this.uiManager = new UIManager();
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager);
        this.economyManager = new EconomyManager(this.uiManager);

        this.bindUIEvents();
        
        this.start();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 14);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 20;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.6;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);

        this.clock = new THREE.Clock();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    bindUIEvents() {
        this.uiManager.onConnectRequested = () => {
            this.state = STATE_CONNECTING;
            this.uiManager.setConnectingMode();
        };

        this.uiManager.onRouteCanceled = () => {
            this.state = STATE_IDLE;
            this.selectedOrigin = null;
            this.airportManager.clearHighlight();
        };

        this.uiManager.onRouteActionConfirmed = (action) => {
            if (this.selectedOrigin && this.selectedDest) {
                if (action === 'add') {
                    const cost = this.economyManager.calculateRouteCost(this.selectedOrigin, this.selectedDest);
                    if (this.economyManager.canAfford(cost)) {
                        this.economyManager.deductFunds(cost);
                        this.networkManager.addRoute(this.selectedOrigin, this.selectedDest);
                        this.uiManager.showToast("空路を開拓しました", "success");
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastNoFunds, "error");
                    }
                } else if (action === 'remove') {
                    this.networkManager.removeRoute(this.selectedOrigin.id, this.selectedDest.id);
                    this.uiManager.showToast("空路を廃止しました", "success");
                }
            }
            this.state = STATE_IDLE;
            this.selectedOrigin = null;
            this.selectedDest = null;
            this.airportManager.clearHighlight();
            this.uiManager.hideRouteConfirm();
            this.uiManager._toggleMainButtons(true);
        };

        this.uiManager.onFleetMenuOpen = () => {
            const counts = this.planeManager.getPlaneCounts('player');
            this.uiManager.updateFleetPanel(counts);
        };

        this.uiManager.onBuyPlane = (sizeType) => {
            const counts = this.planeManager.getPlaneCounts('player');
            const total = counts.small + counts.medium + counts.large + counts.super;
            
            if (total >= this.economyManager.maxPlanes) {
                this.uiManager.showToast(window.APP_LANG.toastLimitPlanes, "error");
                return;
            }

            const conf = CONFIG.ECONOMY.PLANES[sizeType];
            if (this.economyManager.canAfford(conf.cost)) {
                this.economyManager.deductFunds(conf.cost);
                
                const startNode = this.networkManager.getRandomConnectedAirport('player') || this.airportManager.getAirportById('HND');
                this.planeManager.addPlane(startNode, 'player', sizeType);
                this.uiManager.updateFleetPanel(this.planeManager.getPlaneCounts('player'));
            } else {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds, "error");
            }
        };

        this.uiManager.onSellPlane = (sizeType) => {
            const conf = CONFIG.ECONOMY.PLANES[sizeType];
            const refund = Math.floor(conf.cost * conf.sellRate);
            
            if (this.planeManager.sellPlane('player', sizeType)) {
                this.economyManager.addFunds(refund);
                this.uiManager.updateFleetPanel(this.planeManager.getPlaneCounts('player'));
            }
        };

        this.uiManager.onZoomIn = () => {
            this.targetDistance = Math.max(this.controls.minDistance, this.camera.position.distanceTo(this.controls.target) - 3);
        };

        this.uiManager.onZoomOut = () => {
            this.targetDistance = Math.min(this.controls.maxDistance, this.camera.position.distanceTo(this.controls.target) + 3);
        };

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.container.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.interactive-ui')) return;
            
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.airportManager.markers.map(m => m.userData.targetMesh));

            if (intersects.length > 0) {
                const hitMesh = intersects[0].object.parent.parent; 
                const airportData = hitMesh.userData.airportData;

                if (this.state === STATE_IDLE) {
                    this.airportManager.clearHighlight();
                    this.airportManager.setHighlight(hitMesh, 'origin');
                    this.selectedOrigin = airportData;
                    
                    const maxConn = this.networkManager.MAX_CONNECTIONS[airportData.type] || 3;
                    const curConn = this.networkManager.getConnectionCount(airportData.id);
                    this.uiManager.showAirportInfo(airportData, curConn, maxConn);
                    
                } else if (this.state === STATE_CONNECTING) {
                    if (this.selectedOrigin.id === airportData.id) return;
                    
                    const posOrigin = Utils.latLonToVector3(this.selectedOrigin.lat, this.selectedOrigin.lon, CONFIG.GLOBE_RADIUS);
                    const posDest = Utils.latLonToVector3(airportData.lat, airportData.lon, CONFIG.GLOBE_RADIUS);
                    const distance = posOrigin.distanceTo(posDest);
                    
                    if (distance > CONFIG.GLOBE_RADIUS * 1.5) {
                        this.uiManager.showToast(window.APP_LANG.toastOverDistance, "error");
                        return;
                    }

                    const isConnected = this.networkManager.isConnected(this.selectedOrigin.id, airportData.id);
                    
                    if (!isConnected && !this.networkManager.canConnect(this.selectedOrigin, airportData)) {
                        this.uiManager.showToast(window.APP_LANG.toastLimit, "error");
                        return;
                    }

                    this.airportManager.setHighlight(hitMesh, 'dest');
                    this.selectedDest = airportData;
                    
                    this.uiManager.showRouteConfirm(this.selectedOrigin, this.selectedDest, isConnected);
                }
            } else if (this.state === STATE_IDLE) {
                this.airportManager.clearHighlight();
                this.selectedOrigin = null;
                this.uiManager.hideAll();
            }
        });

        this.controls.addEventListener('change', () => {
            const dist = this.camera.position.distanceTo(this.controls.target);
            const canZoomIn = dist > this.controls.minDistance + 0.1;
            const canZoomOut = dist < this.controls.maxDistance - 0.1;
            this.uiManager.updateZoomButtonsState(canZoomIn, canZoomOut);
        });
    }

    async start() {
        this.globe.buildBase();
        const success = await this.mapData.loadData();
        if (success) {
            this.globe.buildCoastlines(this.mapData.coastlinePoints);
            this.airportManager.buildAirportMarkers();
            
            this.initStarterPack();
            this.rivalManager.init();

            this.hideLoader();
            this.animate();
        } else {
            this.showError("MAP LOAD FAILED", window.APP_LANG.errMapLoad);
        }
    }

    initStarterPack() {
        const hnd = this.airportManager.getAirportById('HND');
        const tpe = this.airportManager.getAirportById('TPE');
        
        if (hnd && tpe) {
            this.networkManager.addRoute(hnd, tpe, 'player');
            this.planeManager.addPlane(hnd, 'player', 'small');
            this.planeManager.addPlane(tpe, 'player', 'small');
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

        if (this.targetDistance !== null) {
            const currentDist = this.camera.position.distanceTo(this.controls.target);
            const diff = this.targetDistance - currentDist;
            
            if (Math.abs(diff) < 0.01) {
                this.targetDistance = null;
            } else {
                const step = diff * 10.0 * delta; 
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
                this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(currentDist + step));
                this.controls.update(); 
            }
        }

        this.airportManager.updateMarkerScale(this.camera);
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta);
        
        // ★修正: networkManager を渡し、全体ネットワークからのボーナス計算を可能にする
        this.economyManager.update(delta, this.planeManager.planes, this.networkManager);
        this.rivalManager.update(delta);
        
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
        this.loaderUI.querySelector('div').className = "text-5xl mb-4";
        this.loaderUI.querySelector('div').innerText = "⚠️";
    }
}