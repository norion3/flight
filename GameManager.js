import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';

/**
 * AI可読性・先祖返り防止コメント:
 * ゲームシミュレーションの統合マネージャークラス。
 * 【注意】「地球は勝手に回転しないで」の指示に基づき、animate() 内での自動回転（rotation.y += ...）は禁止されています。
 */
export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();

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

        // 【自動回転禁止】ユーザー操作のみで回転させるため、ここには回転コードを挟まないこと
        
        // --- 将来のシミュレーション拡張ポイント ---
        // if (this.airplaneManager) this.airplaneManager.update();
        // if (this.airportManager) this.airportManager.update();
        
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

