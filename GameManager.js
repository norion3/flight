/**
 * AI可読性・先祖返り防止コメント:
 * 【EventManagerへのnetworkManager受け渡し追加 ＆ CompetitionManagerへの経過年数連携 ＆ 全機能完全保持】
 * 1. update ループ内で `this.competitionManager.update(delta, this.economyManager ? this.economyManager.year : 1)` を実行し、経過年数を確実に連携。
 * 2. Phase 6の期末決算モーダル制御（onAnnualSettlement）、ダイレクト終了合流（executeGameExit）、
 * 空路廃止時の50%返金、航路開拓ボタンのリアルタイム資金連動等は100%完全保持。
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
import { UpgradeManager } from './UpgradeManager.js';
import { CompetitionManager } from './CompetitionManager.js';
import { EventManager } from './EventManager.js';
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
        this.isPaused = false; 

        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);
        this.networkManager = new NetworkManager(this.scene, this.globe.group);
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.uiManager = new UIManager();
        
        this.economyManager = new EconomyManager(this.uiManager);
        this.upgradeManager = new UpgradeManager();
        
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager, this.economyManager);
        
        this.rivalManager.onWithdraw = (companyId, airportId) => {
            const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
            if (comp) {
                this.uiManager.showWithdrawToast(`${comp.name} が撤退・逃亡しました！`, companyId);
            }
        };

        this.competitionManager = new CompetitionManager(
            this.networkManager,
            this.upgradeManager,
            this.rivalManager,
            this.airportManager
        );

        // ★修正: networkManager を第8引数として渡す
        this.eventManager = new EventManager(
            this,
            this.uiManager,
            this.economyManager,
            this.upgradeManager,
            this.competitionManager,
            this.planeManager,
            this.rivalManager,
            this.networkManager
        );

        // Phase 6: 期末決算モーダルのハンドラ登録
        this.economyManager.onAnnualSettlement = (settlementData) => {
            this.isPaused = true;
            this.uiManager.showSettlementModal(
                settlementData,
                () => {
                    // 「次期へ進む」選択時
                    this.isPaused = false;
                    if (this.eventManager) {
                        this.eventManager.cooldownTimer = 30.0;
                    }
                },
                () => {
                    // 「経営終了・スコア送信」選択時（ダイレクト合流）
                    this.executeGameExit();
                }
            );
        };

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
                    const routeCost = this.economyManager.calculateRouteCost(originData, destData);
                    
                    if (!this.economyManager.canAfford(routeCost)) {
                        this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                        return;
                    }
                    
                    const success = this.networkManager.addRoute(originData, destData);
                    if (success) {
                        this.economyManager.deductFunds(routeCost);
                        this.planeManager.wakeUpPlanes();
                        this.uiManager.showRouteConfirm(originData, destData, true, routeCost, this.economyManager.funds);
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                    }
                } else if (actionType === 'remove') {
                    // 空路廃止時に開拓コストの50%を返金
                    const routeCost = this.economyManager.calculateRouteCost(originData, destData);
                    const refund = Math.floor(routeCost * 0.5);
                    this.economyManager.addFunds(refund);

                    this.networkManager.removeRoute(originData, destData);
                    this.planeManager.checkAndReassignPlanes();
                    
                    if (this.networkManager.canConnect(originData, destData)) {
                        this.uiManager.showRouteConfirm(originData, destData, false, routeCost, this.economyManager.funds);
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
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            const cost = planeConf ? planeConf.cost : 10000000;
            
            if (!this.economyManager.canAfford(cost)) {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                return;
            }
            
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
                this.economyManager.deductFunds(cost);
                const newCounts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(newCounts);
            }
        };

        this.uiManager.onSellPlane = (type) => {
            const success = this.planeManager.sellPlane(type);
            if (success) {
                const planeConf = CONFIG.ECONOMY.PLANES[type];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 5000000;
                this.economyManager.addFunds(refund);

                const counts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(counts);
            }
        };

        this.uiManager.onZoomIn = () => this.zoomCamera(-4.0);
        this.uiManager.onZoomOut = () => this.zoomCamera(4.0);
        
        this.uiManager.onUpgradeRequested = (upgradeId) => {
            const success = this.upgradeManager.upgrade(upgradeId, this.economyManager);
            if (success) {
                this.uiManager.soundManager.playSuccessSound();
                this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
            } else {
                this.uiManager.soundManager.playErrorSound();
                this.uiManager.showToast(window.APP_LANG.toastNoFunds, "error");
            }
        };

        this.uiManager.onPanelOpened = (panelId) => {
            if (panelId === 'panel-upgrades') {
                this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
            } else if (panelId === 'panel-rivals') {
                this.updateRivalsPanelData();
            } else if (panelId === 'panel-overview') {
                this.updateOverviewPanelData();
            }
        };

        this.uiManager.onGraphTabChanged = () => {
            this.updateOverviewPanelData();
        };

        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.selectedHitMesh = null;
        this.selectedDestination = null;

        this.clock = new THREE.Clock();
        this.rivalUiTimer = 0; 

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Phase 6: 終了確定処理（ダイレクト合流）
    executeGameExit() {
        this.uiManager.soundManager.playSuccessSound();
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    updateOverviewPanelData() {
        this.uiManager.updateOverviewPanel(this.economyManager.historyData, CONFIG.COMPANIES);
    }

    updateRivalsPanelData() {
        const stats = CONFIG.COMPANIES.map(comp => {
            let routeCount = 0;
            const net = this.networkManager.network[comp.id];
            if (net) {
                for (const origin in net) {
                    routeCount += net[origin].length;
                }
                routeCount = Math.floor(routeCount / 2); 
            }

            let planeCount = 0;
            let assetValue = 0;
            const planes = this.planeManager.planes.filter(p => p.companyId === comp.id);
            planeCount = planes.length;
            
            planes.forEach(p => {
                const conf = CONFIG.ECONOMY.PLANES[p.sizeType];
                if (conf) assetValue += conf.cost;
            });
            assetValue += routeCount * CONFIG.ECONOMY.ROUTE_BASE_COST * 2; 
            
            if (comp.id === 'player') {
                assetValue += this.economyManager.funds;
            } else {
                assetValue += this.economyManager.getAiFunds(comp.id);
            }

            let satisfaction = 0;
            if (comp.id === 'player') {
                const baseSat = this.upgradeManager.getBonuses().satisfaction || 0;
                const eventSat = this.upgradeManager.eventSatisfactionBonus || 0;
                satisfaction = Math.round(baseSat + eventSat);
            } else {
                satisfaction = Math.round(this.competitionManager.getAiSatisfaction ? this.competitionManager.getAiSatisfaction(comp.id) : 150);
            }

            const globalShare = this.competitionManager.getGlobalShare(comp.id);

            return {
                id: comp.id,
                name: comp.name,
                isPlayer: comp.id === 'player',
                routeCount,
                planeCount,
                assetValue,
                satisfaction,
                globalShare
            };
        });

        stats.sort((a, b) => b.globalShare - a.globalShare);
        this.uiManager.updateRivalsPanel(stats);
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
        // 決算モーダル表示中もタップ無効化
        if (this.isPaused || (this.eventManager && this.eventManager.isEventActive) || (this.uiManager && this.uiManager.isSettlementModalOpen && this.uiManager.isSettlementModalOpen())) return;

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
                const routeCost = this.economyManager.calculateRouteCost(originData, destData);

                if (isConnected) {
                    this.uiManager.showRouteConfirm(originData, destData, true, routeCost, this.economyManager.funds); 
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
                        this.uiManager.showRouteConfirm(originData, destData, false, routeCost, this.economyManager.funds); 
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
        const rawDelta = this.clock.getDelta();
        const delta = this.isPaused ? 0 : rawDelta;

        if (this.targetDistance !== null) {
            const currentDist = this.camera.position.distanceTo(this.controls.target);
            const diff = this.targetDistance - currentDist;
            
            if (Math.abs(diff) < 0.01) {
                this.targetDistance = null;
            } else {
                const step = diff * 10.0 * rawDelta; 
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
                this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(currentDist + step));
                this.controls.update(); 
            }
        }

        const currentBonuses = this.upgradeManager.getBonuses();
        this.economyManager.maxPlanes = currentBonuses.maxPlanes;

        this.airportManager.updateMarkerScale(this.camera);
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta, currentBonuses.speedMultiplier);

        // ★改善1＆3: CompetitionManager に経過年数（year）を連携
        this.competitionManager.update(delta, this.economyManager ? this.economyManager.year : 1);
        
        this.economyManager.update(
            delta,
            this.planeManager.planes,
            this.networkManager,
            this.upgradeManager,
            this.competitionManager,
            this.eventManager
        );
        this.rivalManager.update(delta, this.competitionManager);
        
        if (this.eventManager) {
            this.eventManager.update(delta);
        }

        // 航路開拓確認ボタンのリアルタイム資金連動チェック
        this.uiManager.checkRouteConfirmButton(this.economyManager.funds);

        this.rivalUiTimer += delta;
        if (this.rivalUiTimer > 1.0) {
            this.rivalUiTimer = 0;
            if (this.uiManager.isRivalsPanelOpen()) {
                this.updateRivalsPanelData();
            }
            if (this.uiManager.isOverviewPanelOpen()) {
                this.updateOverviewPanelData();
            }
        }

        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    hideLoader() {
        this.loaderUI.classList.add('opacity-0');
        setTimeout(() => this.loaderUI.remove(), 500);
    }

    showError(title, msg) {
        const h2 = this.loaderUI.querySelector('h2');
        const p = this.loaderUI.querySelector('p');
        if (h2) h2.innerText = title;
        if (p) p.innerText = msg;
    }
}