import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * シミュレーション管理クラス。
 * 【変更点】
 * THREE.Raycaster を組み込み、pointerdown (タップ/クリック) イベントで空港マーカーを検出。
 * 選択された空港情報を UI (HTML側の #airport-info-card) へ動的に流し込み表示します。
 */
export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);

        // Raycaster (タップ検出用) の初期化
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        // マウス/タッチイベントのバインド
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(CONFIG.COLORS.BACKGROUND, 0.015);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 14);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.7;
        this.controls.zoomSpeed = 1.2;
        this.controls.minDistance = 5.5;
        this.controls.maxDistance = 25.0;
        this.controls.enablePan = false;

        // 【360度無限全方向回転の解放】
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(CONFIG.COLORS.COASTLINE, 0.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
    }

    async start() {
        this.globe.buildBase();
        this.globe.focusJapan();

        const success = await this.mapData.loadData();
        if (success) {
            this.globe.buildCoastlines(this.mapData.coastlinePoints);
            // 世界主要空港の3Dネオンリングマーカーを生成
            this.airportManager.buildAirportMarkers();
            this.hideLoader();
        } else {
            this.showError("Network Error", "地図データの取得に失敗しました。再読み込みしてください。");
        }

        this.animate();
    }

    // --- タップ検出ロジック ---
    onPointerDown(event) {
        // スクリーン座標を NDC (正規化デバイス座標: -1〜+1) へ変換
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // カメラからタップした位置へ光線(Ray)を飛ばす
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // AirportManager に登録された判定用メッシュ群との交差をチェック
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers);

        if (intersects.length > 0) {
            // 最も手前にある空港を取得
            const hitMesh = intersects[0].object;
            const airportData = hitMesh.userData.airportData;
            
            // マーカーをハイライト
            this.airportManager.highlightMarker(hitMesh);
            // UIカードに情報を表示
            this.showAirportInfo(airportData);
        } else {
            // 空や海をタップした場合はハイライトとUIを消去
            this.airportManager.highlightMarker(null);
            this.hideAirportInfo();
        }
    }

    showAirportInfo(data) {
        const card = document.getElementById('airport-info-card');
        const hint = document.getElementById('hint-text');
        if (!card) return;

        // データを流し込む
        document.getElementById('airport-name').innerText = data.name;
        document.getElementById('airport-code').innerText = data.id;
        document.getElementById('airport-country').innerText = data.country;
        
        const typeEl = document.getElementById('airport-type');
        if (data.type === 'major') {
            typeEl.innerText = 'Major Hub';
            typeEl.className = 'text-xs font-semibold text-cyan-400 uppercase tracking-wider';
        } else {
            typeEl.innerText = 'Local Airport';
            typeEl.className = 'text-xs font-semibold text-slate-400 uppercase tracking-wider';
        }

        // ヒントを消してカードを下からスライドイン
        if (hint) hint.classList.add('opacity-0');
        card.classList.remove('translate-y-12', 'opacity-0');
    }

    hideAirportInfo() {
        const card = document.getElementById('airport-info-card');
        const hint = document.getElementById('hint-text');
        if (card) card.classList.add('translate-y-12', 'opacity-0');
        if (hint) hint.classList.remove('opacity-0');
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
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


