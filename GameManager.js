/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: 経済ループの結合と動的化】
 * 設計書に基づき、`EconomyManager` をインスタンス化し、メインループ(`animate`)へ接続しました。
 * 1. 機体の購入時(`onBuyPlane`)、売却時(`onSellPlane`)、空路開拓時(`onRouteActionConfirmed`)のそれぞれに、
 * `canAfford` による資金チェックと増減処理を安全に挟み込みました。
 * 2. フェーズ1における「上限5機の制限」を導入し、購入前に枠の空きをチェックする処理を追加しています。
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
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.uiManager = new UIManager();
        
        // ★追加: 金庫番(EconomyManager)のインスタンス化
        this.economyManager = new EconomyManager(this.uiManager);
        
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager);

        this.uiManager.onConnectRequested = () => {
            this.state = STATE_CONNECTING;
            this.selectedOrigin = this.selectedHitMesh; 
            
            this.airportManager.clearHighlight('all');
            this.airportManager.setHighlight(this.selectedOrigin, 'origin');
            
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
                    // ★追加: 空路開拓の事前資金チェック
                    if (!this.economyManager.canAfford(CONFIG.ECONOMY.ROUTE_COST)) {
                        this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                        return;
                    }
                    
                    const success = this.networkManager.addRoute(originData, destData); // デフォルトで player
                    if (success) {
                        this.economyManager.deductFunds(CONFIG.ECONOMY.ROUTE_COST); // ★追加: 資金の減算
                        this.planeManager.wakeUpPlanes();
                        this.uiManager.showRouteConfirm(originData, destData, true);
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                    }
                } else if (actionType === 'remove') {
                    this.networkManager.removeRoute(originData, destData); // デフォルトで player
                    this.planeManager.checkAndReassignPlanes();
                    
                    if (this.networkManager.canConnect(originData, destData)) {
                        this.uiManager.showRouteConfirm(originData, destData, false);
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
                    }
                }
            }
        };

        this.uiManager.onFleetMenuOpen = () => {
            const counts = this.planeManager.getPlaneCounts('player');
            this.uiManager.updateFleetPanel(counts);
        };

        this.uiManager.onBuyPlane = (type) => {
            const cost = CONFIG.ECONOMY.PLANE_COSTS[type] || 10000000;
            
            // ★追加: 機体購入の事前資金チェック
            if (!this.economyManager.canAfford(cost)) {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                return;
            }
            
            // ★追加: フリート上限(5機)の制御
            const counts = this.planeManager.getPlaneCounts('player');
            const totalPlanes = Object.values(counts).reduce((a, b) => a + b, 0);
            if (totalPlanes >= this.economyManager.maxPlanes) {
                this.uiManager.showToast(window.APP_LANG.toastLimitPlanes);
                return;
            }

            const success = this.planeManager.addPlane(type);
            if (!success) {
                this.uiManager.showToast(window.APP_LANG.toastNoRoute);
            } else {
                this.economyManager.deductFunds(cost); // ★追加: 資金減算
                const newCounts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(newCounts);
            }
        };

        this.uiManager.onSellPlane = (type) => {
            const success = this.planeManager.sellPlane(type);
            if (success) {
                // ★追加: 売却時の資金払い戻し処理
                const cost = CONFIG.ECONOMY.PLANE_COSTS[type] || 10000000;
                const refund = cost * CONFIG.ECONOMY.PLANE_SELL_RATES;
                this.economyManager.addFunds(refund);

                const counts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(counts);
            }
        };

        this.uiManager.onZoomIn = () => this.zoomCamera(-4.0);
        this.uiManager.onZoomOut = () => this.zoomCamera(4.0);

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
        this.airportManager.clearHighlight('all'); 
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
        
        this.controls.minDistance = 7.5; 
        this.controls.maxDistance = 25.0;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI - 0.1;

        this.controls.addEventListener('change', () => this.checkZoomLimit());

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(CONFIG.COLORS.COASTLINE, 0.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
    }

    zoomCamera(deltaAmount) {
        const currentDist = this.camera.position.distanceTo(this.controls.target);
        if (this.targetDistance === null) this.targetDistance = currentDist;
        
        this.targetDistance += deltaAmount;
        this.targetDistance = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, this.targetDistance));
        
        this.checkZoomLimit(); 
    }

    checkZoomLimit() {
        const currentDist = this.camera.position.distanceTo(this.controls.target);
        const target = this.targetDistance !== null ? this.targetDistance : currentDist;
        
        const canZoomIn = target > this.controls.minDistance + 0.01;
        const canZoomOut = target < this.controls.maxDistance - 0.01;
        
        this.uiManager.updateZoomButtonsState(canZoomIn, canZoomOut);
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
            this.checkZoomLimit(); 
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
                
                this.airportManager.clearHighlight('all');
                this.airportManager.setHighlight(bestHit, 'dest');
                
                const currConns = this.networkManager.getConnectionCount(data.id);
                const maxConns = this.networkManager.MAX_CONNECTIONS[data.type];
                
                this.uiManager.showAirportInfo(data, currConns, maxConns);
            } else {
                this.resetState();
            }
        } else if (this.state === STATE_CONNECTING) {
            if (bestHit) {
                if (bestHit === this.selectedOrigin) return;

                if (!this.selectedOrigin) {
                    this.selectedOrigin = this.selectedHitMesh;
                }
                this.selectedDestination = bestHit;
                
                this.airportManager.clearHighlight('dest');
                this.airportManager.setHighlight(this.selectedDestination, 'dest');
                
                const originData = this.selectedOrigin.userData.airportData;
                const destData = this.selectedDestination.userData.airportData;

                const isConnected = this.networkManager.isConnected(originData.id, destData.id);

                if (isConnected) {
                    this.uiManager.showRouteConfirm(originData, destData, true); 
                } else {
                    const posA = Utils.latLonToVector3(originData.lat, originData.lon, CONFIG.GLOBE_RADIUS);
                    const posB = Utils.latLonToVector3(destData.lat, destData.lon, CONFIG.GLOBE_RADIUS);
                    const distance = posA.distanceTo(posB);
                    const maxDistance = CONFIG.GLOBE_RADIUS * 1.25;

                    if (distance > maxDistance) {
                        this.uiManager.showToast(window.APP_LANG.toastOverDistance);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
                    } else if (this.networkManager.canConnect(originData, destData)) {
                        this.uiManager.showRouteConfirm(originData, destData, false); 
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
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
        
        // ★追加: 経済ループ（収益と客数の計算・UI更新）を毎フレーム実行
        this.economyManager.update(delta, this.planeManager.planes);
        
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
    }
}