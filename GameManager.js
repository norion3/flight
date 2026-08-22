import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * シミュレーション管理クラス。
 * 【変更点】
 * 1. OrbitControls の上下仰角制限（Polar Angle）を完全に撤去し、上下左右斜め360度際限なく自由回転できるように改修。
 * 2. `AirportManager` を読み込み、3Dネオンリング空港マーカーを起動・描画。
 */
export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);

        window.addEventListener('resize', this.onWindowResize.bind(this));
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
        // 極付近でのカメラ引っかかり・回転ブロックをなくすため、角度制限を完全削除
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // 自動回転は停止（ユーザーの自由スワイプ操作のみ）
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

