/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.3: UpgradeManager の統合】
 * 1. UpgradeManager をインポートし、初期化。
 * 2. `setupUpgradeUI()` を追加し、UIのアップグレードボタン押下時に資金消費とレベルアップを実行。
 * 3. 毎フレームの update() で得られるボーナス値（機体上限拡張、収益倍率など）を
 * EconomyManager や PlaneManager へ渡せるよう構造を拡張しました。
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
import { UpgradeManager } from './UpgradeManager.js'; // ★Phase 2.3 追加
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
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager);
        
        this.uiManager = new UIManager();
        this.economyManager = new EconomyManager(this.uiManager);
        this.upgradeManager = new UpgradeManager(); // ★Phase 2.3 追加

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setupEvents();
        this.setupUpgradeUI(); // ★Phase 2.3 追加

        this.startSequence();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 6.0;
        this.controls.maxDistance = 25.0;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.6;
        this.controls.zoomSpeed = 0.8;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(-10, -10, -10);
        this.scene.add(backLight);

        this.clock = new THREE.Clock();
    }

    setupEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
        
        const touchHandler = (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };
        this.renderer.domElement.addEventListener('touchstart', touchHandler, {passive: true});

        // ズームボタン
        this.uiManager.btnZoomIn.addEventListener('click', () => {
            this.targetDistance = Math.max(this.controls.minDistance, this.camera.position.distanceTo(this.controls.target) - 2.0);
            this.uiManager.soundManager.playTapSound();
        });
        this.uiManager.btnZoomOut.addEventListener('click', () => {
            this.targetDistance = Math.min(this.controls.maxDistance, this.camera.position.distanceTo(this.controls.target) + 2.0);
            this.uiManager.soundManager.playTapSound();
        });

        // 機体購入・売却UI
        this.uiManager.fabBuy.addEventListener('click', () => {
            this.uiManager.toggleBuyMenu();
        });

        document.querySelectorAll('.buy-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.handleBuyPlane(type);
            });
        });

        document.querySelectorAll('.sell-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.handleSellPlane(type);
            });
        });

        // 路線開拓確認UI
        const btnCancel = this.uiManager.routeCard.querySelector('.btn-cancel');
        const btnAction = this.uiManager.routeCard.querySelector('.btn-action');
        
        btnCancel.addEventListener('click', () => {
            this.uiManager.soundManager.playCancelSound();
            this.uiManager.hideRouteConfirm();
            this.resetConnectingState();
        });

        btnAction.addEventListener('click', () => {
            if (this.state === STATE_CONNECTING && this.selectedOrigin && this.selectedDest) {
                const cost = this.networkManager.calculateConnectionCost(this.selectedOrigin, this.selectedDest);
                if (this.economyManager.funds >= cost) {
                    this.economyManager.funds -= cost;
                    this.uiManager.soundManager.playCashSound();
                    
                    this.networkManager.addRoute(this.selectedOrigin, this.selectedDest, 'player');
                    this.uiManager.showToast(`Route opened: ${this.selectedOrigin.id} - ${this.selectedDest.id}`, 'success');
                    
                    if (!this.rivalManager.isInitialized) {
                        this.rivalManager.init();
                    }
                } else {
                    this.uiManager.soundManager.playErrorSound();
                    this.uiManager.showToast("Not enough funds!", 'error');
                }
            }
            this.uiManager.hideRouteConfirm();
            this.resetConnectingState();
        });
    }

    /**
     * ★Phase 2.3 追加: アップグレードUIのボタン連動設定
     * 現状はモックアップのボタンクリックを取得し、資金消費と内部レベルアップを行います。
     * （画面表示の更新は Step 2.4 で実装します）
     */
    setupUpgradeUI() {
        const upgradeItems = document.querySelectorAll('.upgrade-item');
        upgradeItems.forEach(item => {
            const btn = item.querySelector('button');
            // データセットとして upgradeId を持たせる必要があるため仮設定（Step 2.4でHTML側も修正します）
            // 現状は見た目だけの動作確認
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 押されたボタンの親要素のタイトル等からIDを推測するか、後ほどHTMLにIDを付与します。
                // 今回は音が鳴ることだけ確認。
                this.uiManager.soundManager.playTapSound();
            });
        });
    }

    handleBuyPlane(type) {
        const cost = CONFIG.ECONOMY.PLANES[type].cost;
        const currentCount = this.planeManager.getPlaneCounts().total;
        
        // ★Phase 2.3 追加: UpgradeManager から現在の最大機体数を取得する
        const currentBonuses = this.upgradeManager.getBonuses();
        const maxCapacity = currentBonuses.maxPlanes; // 拡張された上限を取得

        if (currentCount >= maxCapacity) {
            this.uiManager.soundManager.playErrorSound();
            this.uiManager.showToast(`Hangar full! (Max ${maxCapacity})`, 'error');
            return;
        }
        
        if (this.economyManager.funds >= cost) {
            this.economyManager.funds -= cost;
            this.uiManager.soundManager.playCashSound();
            this.planeManager.addPlane('player', type);
            this.uiManager.showToast(`Purchased ${type} plane`, 'success');
        } else {
            this.uiManager.soundManager.playErrorSound();
            this.uiManager.showToast("Not enough funds!", 'error');
        }
    }

    handleSellPlane(type) {
        const planeData = CONFIG.ECONOMY.PLANES[type];
        const resellValue = planeData.cost * planeData.sellRate;
        const success = this.planeManager.sellPlane('player', type);
        
        if (success) {
            this.economyManager.funds += resellValue;
            this.uiManager.soundManager.playCashSound();
            this.uiManager.showToast(`Sold ${type} plane (+$${(resellValue/1000000).toFixed(1)}M)`, 'success');
        } else {
            this.uiManager.soundManager.playErrorSound();
            this.uiManager.showToast(`No ${type} planes to sell`, 'error');
        }
    }

    // ...以降のマウスクリック判定(onPointerDown等)は変更なし...
    
    // (省略を防ぐため、既存のレイキャスト処理等をそのまま記載します)
    onPointerDown(e) {
        this.isDragging = false;
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
    }

    onPointerMove(e) {
        if (!this.pointerDownPos) return;
        const dx = e.clientX - this.pointerDownPos.x;
        const dy = e.clientY - this.pointerDownPos.y;
        if (dx*dx + dy*dy > 25) {
            this.isDragging = true;
        }
    }

    onPointerUp(e) {
        if (this.isDragging) return;
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers, true);
        
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const airportData = hitMesh.userData.airportData;
            if (airportData) {
                this.handleAirportClick(airportData);
            }
        } else {
            if (this.state !== STATE_CONNECTING) {
                this.uiManager.hideAll();
                this.airportManager.clearHighlight();
            }
        }
    }

    handleAirportClick(airportData) {
        this.uiManager.soundManager.playEventSound();
        
        if (this.state === STATE_IDLE) {
            this.selectedOrigin = airportData;
            this.airportManager.highlightAirports(this.selectedOrigin, this.networkManager);
            
            const connCount = this.networkManager.getConnectionCount(airportData.id, 'player');
            this.uiManager.showInfoCard(airportData, connCount, this.networkManager.MAX_CONNECTIONS[airportData.type]);
            
            this.state = STATE_CONNECTING;
            this.uiManager.showConnectingMode(airportData);
            
        } else if (this.state === STATE_CONNECTING) {
            if (this.selectedOrigin.id === airportData.id) {
                this.resetConnectingState();
                this.uiManager.hideAll();
                return;
            }
            
            if (this.networkManager.isConnected(this.selectedOrigin.id, airportData.id, 'player')) {
                this.uiManager.showToast("Already connected", 'error');
                return;
            }
            
            if (!this.networkManager.canConnect(this.selectedOrigin, airportData, 'player')) {
                this.uiManager.showToast("Connection limit reached", 'error');
                return;
            }

            this.selectedDest = airportData;
            const cost = this.networkManager.calculateConnectionCost(this.selectedOrigin, this.selectedDest);
            
            const isAffordable = this.economyManager.funds >= cost;
            this.uiManager.showRouteConfirm(this.selectedOrigin, this.selectedDest, cost, isAffordable);
        }
    }

    resetConnectingState() {
        this.state = STATE_IDLE;
        this.selectedOrigin = null;
        this.selectedDest = null;
        this.airportManager.clearHighlight();
        this.uiManager.hideConnectingMode();
    }

    async startSequence() {
        this.globe.buildBase();
        
        const mapLoaded = await this.mapData.loadData();
        if (mapLoaded) {
            this.globe.buildCoastlines(this.mapData.coastlinePoints);
        } else {
            this.showError("Map Error", "Could not load map data.");
            return;
        }

        this.airportManager.buildMarkers();
        
        // 最初の機体を配布
        this.planeManager.addPlane('player', 'small');

        this.hideLoader();
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    animate() {
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
        
        // ★Phase 2.3 追加: UpgradeManager からボーナスを取得し、PlaneManagerへ渡す（速度アップ用）
        const currentBonuses = this.upgradeManager.getBonuses();
        
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta, currentBonuses.speedMultiplier); // 速度倍率を渡す
        
        // EconomyManager には upgradeManager 自身を渡し、中で bonuses を引き出して使うように変更
        this.economyManager.update(delta, this.planeManager.planes, this.networkManager, this.upgradeManager);
        this.rivalManager.update(delta);
        
        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    hideLoader() {
        this.loaderUI.classList.add('opacity-0');
        setTimeout(() => this.loaderUI.remove(), 500);
    }

    showError(title, msg) {
        this.loaderUI.querySelector('.animate-spin').style.display = 'none';
        this.loaderUI.querySelector('.text-2xl').innerText = title;
        this.loaderUI.querySelector('.text-cyan-400').innerText = msg;
        this.loaderUI.querySelector('.text-cyan-400').classList.remove('animate-pulse');
        this.loaderUI.querySelector('.text-cyan-400').classList.add('text-red-500');
    }
}