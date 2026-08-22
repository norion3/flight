import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';
import { UIManager } from './UIManager.js';
import { RouteManager } from './RouteManager.js';
import { PlaneManager } from './PlaneManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【初期スターターパックとエラー通知】
 * 履歴61に基づき、ゲーム開始直後に initStarterPack() を実行し、
 * 国内ルート（羽田〜新千歳、羽田〜福岡）と小型機2機を初期配置します。
 * また、ルートがない状態で飛行機を購入しようとした際などに、
 * uiManager.showToast() を用いてプレイヤーに明確な理由（エラー通知）を伝えます。
 */

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
        this.routeManager = new RouteManager(this.scene, this.globe.group);
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.routeManager);
        this.uiManager = new UIManager();

        // --- UIイベントのバインド ---
        this.uiManager.onConnectRequested = () => {
            this.state = STATE_CONNECTING;
            this.airportManager.highlightMarker(this.selectedHitMesh);
            this.uiManager.setConnectingMode();
        };

        this.uiManager.onRouteCanceled = () => {
            this.resetState();
        };

        this.uiManager.onRouteConfirmed = () => {
            if (this.selectedOrigin && this.selectedDestination) {
                this.routeManager.addRoute(this.selectedOrigin.userData.airportData, this.selectedDestination.userData.airportData);
            }
            this.resetState();
        };

        this.uiManager.onBuyPlane = (type) => {
            const success = this.planeManager.addPlane(type);
            if (!success) {
                // ルートがない場合は購入できず、Toastで理由を伝える
                this.uiManager.showToast("先にルートを開通してください");
            }
        };

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
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
        this.scene.fog = new THREE.FogExp2(CONFIG.COLORS.BACKGROUND, 0.015);

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
            
            // 地形・空港の構築完了後に、初期空路と飛行機を配置する
            this.initStarterPack();
            
            this.hideLoader();
        } else {
            this.showError("Network Error", "地図データの取得に失敗しました。");
        }

        this.animate();
    }

    // ゲーム開始時から飛んでいる様子を見せるための初期配置
    initStarterPack() {
        const hnd = this.airportManager.getAirportById('HND'); // 羽田
        const cts = this.airportManager.getAirportById('CTS'); // 新千歳
        const fuk = this.airportManager.getAirportById('FUK'); // 福岡

        // 国内2本のルートを強制開通
        if (hnd && cts) this.routeManager.addRoute(hnd, cts);
        if (hnd && fuk) this.routeManager.addRoute(hnd, fuk);

        // 小型の飛行機を2機スポーン
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

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers);

        let bestHit = null;
        if (intersects.length > 0) {
            let bestRank = 999;
            const rankMap = { 'major': 1, 'local': 2, 'fictional': 3 };

            for (let i = 0; i < intersects.length; i++) {
                const hit = intersects[i];
                const data = hit.object.userData.airportData;
                const rank = rankMap[data.type] || 999;
                if (rank < bestRank) {
                    bestRank = rank;
                    bestHit = hit.object;
                }
                if (bestRank === 1) break;
            }
        }

        if (this.state === STATE_IDLE) {
            if (bestHit) {
                this.selectedHitMesh = bestHit;
                const data = bestHit.userData.airportData;
                this.airportManager.highlightMarker(bestHit);
                
                const currConns = this.routeManager.getConnectionCount(data.id);
                const maxConns = this.routeManager.MAX_CONNECTIONS[data.type];
                
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

                if (this.routeManager.canConnect(originData, destData)) {
                    this.airportManager.highlightMarker(this.selectedDestination);
                    this.uiManager.showRouteConfirm(originData, destData);
                } else {
                    // エラー通知を出して状態をリセット
                    this.uiManager.showToast("接続上限、または既に接続済みです");
                    this.resetState();
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


