import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 【スマート・レイキャスト（優先順位付きタップ判定）とUIの洗練化】
 * 光線が貫通したすべてのヒットボックスから、「Major(1) > Local(2) > Fictional(3)」の
 * 優先度で最も高いものを選択します。
 * また、没入感を高めるため、画面下部のヒントテキストUIに対する操作ロジックを削除しています。
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
        
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
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
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.airportManager.markers);

        if (intersects.length > 0) {
            let bestHit = null;
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

            if (bestHit) {
                const airportData = bestHit.userData.airportData;
                this.airportManager.highlightMarker(bestHit);
                this.showAirportInfo(airportData);
            }
        } else {
            this.airportManager.highlightMarker(null);
            this.hideAirportInfo();
        }
    }

    showAirportInfo(data) {
        const card = document.getElementById('airport-info-card');
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
            typeEl.className = 'text-xs font-semibold text-orange-400 uppercase tracking-wider';
        } else {
            typeEl.innerText = 'Fictional Node';
            typeEl.className = 'text-xs font-semibold text-emerald-400 uppercase tracking-wider';
        }

        card.classList.remove('translate-y-12', 'opacity-0');
    }

    hideAirportInfo() {
        const card = document.getElementById('airport-info-card');
        if (card) card.classList.add('translate-y-12', 'opacity-0');
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.airportManager.updateMarkerScale(this.camera);
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


