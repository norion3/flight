/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ3.1: CompetitionManagerの統合とUI描画トリガーの修正】
 * 1. ユーザー提供の完全なベースコードを維持し、タイポを完全に排除（THREE.OrbitControlsを維持）。
 * 2. CompetitionManager をインポートし、ループ内で全空港のシェアを計算。
 * 3. 投資パネル（cc-link-btn）を開いた際に `updateUpgradePanel` を呼び出してUIを初期描画する処理を確実に追加。
 * * ★【Phase 1: 競争システムの統合 (ロードマップ対応)】
 * - economyManager と rivalManager の update メソッド呼び出し時に、
 * competitionManager を引数として渡すよう改修しました。
 * - これにより、「量より質」のシェア計算結果が実際の収益減少や、ライバルの撤退ロジックへ
 * リアルタイムに流し込まれるようになり、競争システムがゲームループ上で完全に稼働し始めます。
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

        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isDragging = false;
        this.pointerDownPos = { x: 0, y: 0 };
    }

    async start() {
        this._initThreeJS();
        this._setupManagers();

        const mapLoaded = await this.mapData.loadData();
        if (!mapLoaded) {
            this.showError("エラー", window.APP_LANG.errMapLoad);
            return;
        }

        this.globe.buildBase();
        this.globe.buildCoastlines(this.mapData.coastlinePoints);
        this.airportManager.buildAirports();

        this._bindUIEvents();
        this._setupEvents();

        this.rivalManager.init();

        this.hideLoader();
        this._animate();
    }

    _initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 6.0;
        this.controls.maxDistance = 20.0;
        this.controls.rotateSpeed = 0.6;
        this.controls.zoomSpeed = 0.8;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(10, 10, 5);
        this.scene.add(dirLight);
    }

    _setupManagers() {
        this.uiManager = new UIManager();
        this.mapData = new MapData();
        this.globe = new Globe(this.scene);
        this.airportManager = new AirportManager(this.scene, this.globe.group);
        this.networkManager = new NetworkManager(this.scene, this.globe.group);
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager);
        this.economyManager = new EconomyManager(this.uiManager);
        this.upgradeManager = new UpgradeManager();
        this.competitionManager = new CompetitionManager(this.networkManager, this.upgradeManager, this.rivalManager);
    }

    _bindUIEvents() {
        this.uiManager.onConnectRequested = () => {
            if (this.selectedOrigin) {
                this.state = STATE_CONNECTING;
                this.airportManager.highlightAirport(this.selectedOrigin.id, 'origin');
                this.uiManager.setConnectingMode();
            }
        };

        this.uiManager.onRouteCanceled = () => {
            this.state = STATE_IDLE;
            this.airportManager.clearHighlights();
        };

        this.uiManager.onRouteActionConfirmed = (action) => {
            if (!this.selectedOrigin || !this.selectedDest) return;

            const originData = this.selectedOrigin.userData.airportData;
            const destData = this.selectedDest.userData.airportData;
            
            if (action === 'add') {
                const routeCost = 50000; 
                if (this.economyManager.funds >= routeCost) {
                    const success = this.networkManager.addRoute(originData, destData, 'player');
                    if (success) {
                        this.economyManager.funds -= routeCost;
                        this.planeManager.wakeUpPlanes('player');
                    }
                } else {
                    this.uiManager.showToast(window.APP_LANG.toastNoFunds, 'error');
                }
            } else if (action === 'remove') {
                const success = this.networkManager.removeRoute(originData, destData, 'player');
                if (success) {
                    this.economyManager.funds += 25000; // 売却益
                    this.planeManager.checkAndReassignPlanes('player');
                }
            }

            this.state = STATE_IDLE;
            this.airportManager.clearHighlights();
            this.uiManager.hideRouteConfirm();
            this.uiManager._toggleMainButtons(true);
        };

        this.uiManager.onBuyPlane = (type) => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            if (!planeConf) return;
            
            const currentCounts = this.planeManager.getPlaneCounts('player');
            const totalPlanes = Object.values(currentCounts).reduce((a, b) => a + b, 0);
            
            if (totalPlanes >= this.economyManager.maxPlanes) {
                this.uiManager.showToast(window.APP_LANG.toastLimitPlanes, 'error');
                return;
            }

            if (this.economyManager.funds >= planeConf.cost) {
                const success = this.planeManager.addPlane(type, 'player');
                if (success) {
                    this.economyManager.funds -= planeConf.cost;
                    // 購入後即座にUIを更新して反映させる
                    this.uiManager.updateFleetPanel(this.planeManager.getPlaneCounts('player'));
                } else {
                    this.uiManager.showToast(window.APP_LANG.toastNoRoute, 'error');
                }
            } else {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds, 'error');
            }
        };

        this.uiManager.onSellPlane = (type) => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            if (!planeConf) return;

            const success = this.planeManager.sellPlane(type, 'player');
            if (success) {
                this.economyManager.funds += (planeConf.cost * planeConf.sellRate);
                this.uiManager.updateFleetPanel(this.planeManager.getPlaneCounts('player'));
            }
        };

        this.uiManager.onFleetMenuOpen = () => {
            this.uiManager.updateFleetPanel(this.planeManager.getPlaneCounts('player'));
        };

        this.uiManager.onUpgradeRequested = (upgradeId) => {
            const success = this.upgradeManager.upgrade(upgradeId, this.economyManager);
            if (success) {
                this.uiManager.soundManager.playSuccessSound();
                this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
            }
        };

        // 投資パネルを開いた時にパネルの中身を生成するフック
        document.querySelectorAll('.cc-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                if (targetId === 'panel-upgrades') {
                    this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
                }
            });
        });

        this.uiManager.onZoomIn = () => { this._targetZoom(-3); };
        this.uiManager.onZoomOut = () => { this._targetZoom(3); };
    }

    _targetZoom(amount) {
        if (!this.camera || !this.controls) return;
        let currentDist = this.targetDistance !== null ? this.targetDistance : this.camera.position.distanceTo(this.controls.target);
        
        let newDist = currentDist + amount;
        newDist = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, newDist));
        this.targetDistance = newDist;
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const dom = this.renderer.domElement;
        
        dom.addEventListener('pointerdown', (e) => {
            this.isDragging = false;
            this.pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        
        dom.addEventListener('pointermove', (e) => {
            if (Math.abs(e.clientX - this.pointerDownPos.x) > 5 || Math.abs(e.clientY - this.pointerDownPos.y) > 5) {
                this.isDragging = true;
            }
        });
        
        dom.addEventListener('pointerup', (e) => {
            if (!this.isDragging) {
                this._onPointerClick(e);
            }
        });
    }

    _onPointerClick(event) {
        if (this.uiManager.isBuyMenuOpen() || this.uiManager.isUpgradePanelOpen()) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers, false);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            this._handleAirportClick(hitMesh);
        } else {
            if (this.state === STATE_IDLE) {
                this.uiManager.hideAll();
            }
        }
    }

    _handleAirportClick(hitMesh) {
        const data = hitMesh.userData.airportData;

        if (this.state === STATE_IDLE) {
            this.selectedOrigin = hitMesh;
            const currentConns = this.networkManager.getConnectionCount(data.id, 'player');
            const maxConns = this.networkManager.MAX_CONNECTIONS[data.type];
            this.uiManager.showAirportInfo(data, currentConns, maxConns);
            
        } else if (this.state === STATE_CONNECTING) {
            if (hitMesh === this.selectedOrigin) return;

            const originData = this.selectedOrigin.userData.airportData;
            
            const isConnected = this.networkManager.isConnected(originData.id, data.id, 'player');
            
            if (!isConnected) {
                const posOrigin = Utils.latLonToVector3(originData.lat, originData.lon, CONFIG.GLOBE_RADIUS);
                const posDest = Utils.latLonToVector3(data.lat, data.lon, CONFIG.GLOBE_RADIUS);
                
                // 航続距離のチェック
                if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) {
                    this.uiManager.showToast(window.APP_LANG.toastOverDistance, 'error');
                    return;
                }

                // 接続上限のチェック
                if (!this.networkManager.canConnect(originData, data, 'player')) {
                    this.uiManager.showToast(window.APP_LANG.toastLimit, 'error');
                    return;
                }
            }

            this.selectedDest = hitMesh;
            this.airportManager.highlightAirport(data.id, 'dest');
            
            const routeCost = 50000;
            this.uiManager.showRouteConfirm(originData, data, isConnected, routeCost);
        }
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        
        const delta = Math.min(this.clock.getDelta(), 0.1); 
        this.update(delta);
    }

    update(delta) {
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

        const currentBonuses = this.upgradeManager.getBonuses();
        this.economyManager.maxPlanes = currentBonuses.maxPlanes;

        this.airportManager.updateMarkerScale(this.camera);
        
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta, currentBonuses.speedMultiplier);

        // ★Phase 3.1 追加: 毎フレーム、全空港のシェアを再計算する
        this.competitionManager.update(delta);
        
        // ★Phase 1 修正箇所: シェア・競争ロジックの依存注入
        this.economyManager.update(delta, this.planeManager.planes, this.networkManager, this.upgradeManager, this.competitionManager);
        this.rivalManager.update(delta, this.competitionManager);
        
        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    hideLoader() {
        if(this.loaderUI) {
            this.loaderUI.classList.add('opacity-0');
            setTimeout(() => this.loaderUI.remove(), 500);
        }
    }

    showError(title, msg) {
        if(this.loaderUI) {
            this.loaderUI.innerHTML = `<div class="text-rose-500 font-bold text-lg">${title}</div><div class="text-slate-300 mt-2">${msg}</div>`;
        }
    }
}