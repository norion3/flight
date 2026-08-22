import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【極点ロックのない完全な無限回転】
 * OrbitControls のカメラ回転機能は極付近でジンバルロックを起こすため、enableRotate = false に設定。
 * 代わりに、ユーザーのスワイプ量から「地球儀グループ自体のクォータニオン」を直接回転させる
 * カスタムロジック（慣性ダンピング付き）を実装し、上下左右シームレスな操作感を実現しています。
 */
export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 無限回転（クォータニオン制御）用変数
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.previousMousePosition = { x: 0, y: 0 };
        this.angularVelocity = { x: 0, y: 0 };

        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // スワイプとタップを分離するためのイベントバインド
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this)); // 画面外離しも検知
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
        this.controls.zoomSpeed = 1.2;
        this.controls.minDistance = 5.5;
        this.controls.maxDistance = 25.0;
        this.controls.enablePan = false;
        // OrbitControls による回転をオフにし、ズーム専用にする
        this.controls.enableRotate = false; 

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
            this.airportManager.buildAirportMarkers();
            this.hideLoader();
        } else {
            this.showError("Network Error", "地図データの取得に失敗しました。");
        }

        this.animate();
    }

    // --- カスタム無限回転 & タップ分離ロジック ---
    onPointerDown(event) {
        this.isDragging = true;
        this.dragStartPos = { x: event.clientX, y: event.clientY };
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
        this.angularVelocity = { x: 0, y: 0 };
    }

    onPointerMove(event) {
        if (!this.isDragging) return;
        
        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;
        
        // 回転速度の更新（スワイプ感度の調整）
        this.angularVelocity.x = deltaY * 0.005; // 縦スワイプ
        this.angularVelocity.y = deltaX * 0.005; // 横スワイプ
        
        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onPointerUp(event) {
        if (!this.isDragging) return;
        this.isDragging = false;

        // タップ判定（指の移動距離が極めて小さい場合は「回転」ではなく「タップ」とみなす）
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            this.handleTap(event);
        }
    }

    handleTap(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const airportData = hitMesh.userData.airportData;
            this.airportManager.highlightMarker(hitMesh);
            this.showAirportInfo(airportData);
        } else {
            this.airportManager.highlightMarker(null);
            this.hideAirportInfo();
        }
    }

    showAirportInfo(data) {
        const card = document.getElementById('airport-info-card');
        const hint = document.getElementById('hint-text');
        if (!card) return;

        document.getElementById('airport-name').innerText = data.name;
        document.getElementById('airport-code').innerText = data.id;
        document.getElementById('airport-country').innerText = data.country;
        
        const typeEl = document.getElementById('airport-type');
        if (data.type === 'major') {
            typeEl.innerText = 'Major Hub';
            typeEl.className = 'text-xs font-semibold text-yellow-400 uppercase tracking-wider';
        } else if (data.type === 'local') {
            typeEl.innerText = 'Local Airport';
            typeEl.className = 'text-xs font-semibold text-cyan-400 uppercase tracking-wider';
        } else {
            typeEl.innerText = 'Fictional Node';
            typeEl.className = 'text-xs font-semibold text-emerald-400 uppercase tracking-wider';
        }

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
        
        // --- カスタムクォータニオン回転（慣性ダンピング処理） ---
        if (!this.isDragging) {
            this.angularVelocity.x *= 0.95; // 慣性の減衰率
            this.angularVelocity.y *= 0.95;
        }

        if (Math.abs(this.angularVelocity.x) > 0.0001 || Math.abs(this.angularVelocity.y) > 0.0001) {
            // カメラの向きを基準にした回転軸の計算（Arcball風）
            const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
            const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
            
            const qY = new THREE.Quaternion().setFromAxisAngle(up, this.angularVelocity.y);
            const qX = new THREE.Quaternion().setFromAxisAngle(right, this.angularVelocity.x);
            
            const q = new THREE.Quaternion().multiplyQuaternions(qY, qX);
            this.globe.group.quaternion.premultiply(q);
        }

        // カメラ距離に応じたマーカースケールの補正
        this.airportManager.updateMarkerScale(this.camera);

        this.controls.update(); // ズーム処理のため呼び出し維持
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


