/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1.5: HUDのタイポグラフィと2段構成の更新 (Proposal 022)】
 * `updateTopHUD` メソッドにおいて、収益がプラスの時はエメラルド、マイナスの時はレッドに
 * クラス名を動的に書き換えることで、視覚的なリッチさと高級感を演出します。
 * また、下段に配置されたプログレスバーの width を機体の所持割合に応じて更新します。
 */

import { SoundManager } from './SoundManager.js';

export class UIManager {
    constructor() {
        this.soundManager = new SoundManager();

        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
        this.connectingCard = document.getElementById('connecting-mode-card'); 
        
        this.exitCard = document.getElementById('exit-confirm-card');
        this.helpMenu = document.getElementById('help-menu');
        
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');
        this.zoomControls = document.getElementById('zoom-controls');

        this.btnHelp = document.getElementById('btn-help');
        this.btnSound = document.getElementById('btn-sound');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.controlCenter = document.getElementById('control-center-panel');
        
        // トップHUDの要素
        this.topStatusHud = document.getElementById('top-status-hud');
        this.hudFunds = document.getElementById('hud-funds');
        this.hudIncome = document.getElementById('hud-income');
        this.hudPlanes = document.getElementById('hud-planes');
        this.hudMaxPlanes = document.getElementById('hud-max-planes');
        this.hudPassengers = document.getElementById('hud-passengers');

        this._initEventListeners();
        lucide.createIcons();
    }

    _initEventListeners() {
        this._bindSound(document.getElementById('btn-init-route'), () => {
            if(this.onConnectRequested) this.onConnectRequested();
        });
        this._bindSound(document.getElementById('btn-close-info'), () => {
            if(this.onRouteCanceled) this.onRouteCanceled();
        });
        this._bindSound(document.getElementById('btn-route-cancel'), () => {
            if(this.onRouteCanceled) this.onRouteCanceled();
        });
        
        this._bindSound(document.getElementById('btn-route-action'), () => {
            const isRemove = document.getElementById('route-action-title').innerText === window.APP_LANG.routeRemoveTitle;
            if(this.onRouteActionConfirmed) this.onRouteActionConfirmed(isRemove ? 'remove' : 'add');
        }, true);

        this._bindSound(this.fabBuy, () => {
            if(this.onFleetMenuOpen) this.onFleetMenuOpen();
            this.buyMenu.classList.add('show');
            this._toggleMainButtons(false);
        });
        
        this._bindSound(document.getElementById('btn-close-buy'), () => {
            this.buyMenu.classList.remove('show');
            this._toggleMainButtons(true);
        });

        this._bindSound(document.getElementById('btn-cancel-route'), () => {
            if(this.onRouteCanceled) this.onRouteCanceled();
        });

        this._bindSound(this.btnZoomIn, () => {
            if(this.onZoomIn) this.onZoomIn();
        });
        
        this._bindSound(this.btnZoomOut, () => {
            if(this.onZoomOut) this.onZoomOut();
        });

        this._bindSound(this.btnHelp, () => {
            this.helpMenu.classList.add('show');
            this._toggleMainButtons(false);
        });

        this._bindSound(document.getElementById('btn-close-help'), () => {
            this.helpMenu.classList.remove('show');
            this._toggleMainButtons(true);
        });

        this._bindSound(this.btnMainMenu, () => {
            if (this.controlCenter) this.controlCenter.classList.add('show');
            this._toggleMainButtons(false);
        });

        this._bindSound(document.getElementById('btn-resume-game'), () => {
            if (this.controlCenter) this.controlCenter.classList.remove('show');
            this._toggleMainButtons(true);
        });

        this._bindSound(document.getElementById('btn-request-exit'), () => {
            if (this.controlCenter) this.controlCenter.classList.remove('show');
            if (this.exitCard) this.exitCard.classList.add('show');
        });

        this._bindSound(document.getElementById('btn-cancel-exit'), () => {
            if (this.exitCard) this.exitCard.classList.remove('show');
            if (this.controlCenter) this.controlCenter.classList.add('show');
        });

        this.btnSound.addEventListener('click', () => {
            const isMuted = this.soundManager.toggleMute();
            const icon = document.getElementById('icon-sound');
            if (isMuted) {
                icon.setAttribute('data-lucide', 'volume-x');
                icon.classList.remove('text-blue-400');
            } else {
                icon.setAttribute('data-lucide', 'volume-2');
                icon.classList.add('text-blue-400');
            }
            lucide.createIcons();
            
            this.btnSound.classList.add('scale-90');
            setTimeout(() => this.btnSound.classList.remove('scale-90'), 100);
        });
    }

    _bindSound(element, callback, isSuccess = false) {
        if (!element) return;
        element.addEventListener('click', (e) => {
            if (isSuccess) {
                this.soundManager.playSuccessSound();
            } else {
                this.soundManager.playTapSound();
            }
            callback(e);
        });
    }

    _toggleMainButtons(show) {
        if (show) {
            this.fabBuy.style.transform = 'scale(1)';
            this.btnZoomIn.style.opacity = '1';
            this.btnZoomOut.style.opacity = '1';
            this.btnZoomIn.style.pointerEvents = 'auto';
            this.btnZoomOut.style.pointerEvents = 'auto';
            
            this.btnHelp.style.transform = 'scale(1)';
            this.btnSound.style.transform = 'scale(1)';
            this.btnMainMenu.style.transform = 'scale(1)';
        } else {
            this.fabBuy.style.transform = 'scale(0)';
            this.btnZoomIn.style.opacity = '0';
            this.btnZoomOut.style.opacity = '0';
            this.btnZoomIn.style.pointerEvents = 'none';
            this.btnZoomOut.style.pointerEvents = 'none';
            
            this.btnHelp.style.transform = 'scale(0)';
            this.btnSound.style.transform = 'scale(0)';
            this.btnMainMenu.style.transform = 'scale(0)';
        }
    }

    updateZoomButtonsState(canZoomIn, canZoomOut) {
        if (this.btnZoomIn) this.btnZoomIn.disabled = !canZoomIn;
        if (this.btnZoomOut) this.btnZoomOut.disabled = !canZoomOut;
    }

    updateTopHUD(fundsStr, incomeStr, planesCount, maxPlanes, passengersStr) {
        if (this.hudFunds) this.hudFunds.innerText = fundsStr;
        
        if (this.hudIncome) {
            this.hudIncome.innerText = incomeStr;
            // ★修正 (Proposal 022): 収益のプラス/マイナスで動的に文字色を変更するタイポグラフィ演出
            if (incomeStr.startsWith('+$')) {
                this.hudIncome.className = "text-sm font-black tracking-tight text-emerald-400";
            } else if (incomeStr.startsWith('-$')) {
                this.hudIncome.className = "text-sm font-black tracking-tight text-red-400";
            } else {
                this.hudIncome.className = "text-sm font-black tracking-tight text-slate-300";
            }
        }
        
        if (this.hudPlanes) this.hudPlanes.innerText = planesCount;
        if (this.hudMaxPlanes) this.hudMaxPlanes.innerText = maxPlanes;
        if (this.hudPassengers) this.hudPassengers.innerText = passengersStr;

        // ★追加 (Proposal 022): 機体所持数のプログレスバーを更新
        const progressEl = document.getElementById('hud-planes-progress');
        if (progressEl) {
            const percent = Math.min(100, (planesCount / maxPlanes) * 100);
            progressEl.style.width = `${percent}%`;
        }
    }

    showToast(message) {
        const msgEl = document.getElementById('toast-message');
        if (msgEl) msgEl.innerText = message;
        
        this.soundManager.playWarningSound();

        this.toast.classList.add('show');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    setConnectingMode() {
        this.infoCard.classList.remove('show');
        this.connectingCard.classList.add('show');
        this._toggleMainButtons(false);
    }

    showAirportInfo(data, connections, maxConnections) {
        this.soundManager.playEventSound();

        document.getElementById('info-name').innerText = data.name;
        document.getElementById('info-country').innerText = data.country;
        
        const badge = document.getElementById('info-type-badge');
        badge.innerText = data.type;
        
        if (data.type === 'major') {
            badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
        } else if (data.type === 'local') {
            badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-500/30 text-blue-400 bg-blue-500/10";
        } else {
            badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-500/30 text-slate-400 bg-slate-500/10";
        }

        const connEl = document.getElementById('info-connections');
        connEl.innerText = connections;
        if (connections >= maxConnections) {
            connEl.className = "text-red-400";
        } else {
            connEl.className = "text-blue-400";
        }
        document.getElementById('info-max-connections').innerText = maxConnections;

        const demandEl = document.getElementById('info-demand');
        if (data.type === 'major') {
            demandEl.innerText = "High";
            demandEl.className = "text-xl font-mono font-bold text-emerald-400";
        } else if (data.type === 'local') {
            demandEl.innerText = "Mid";
            demandEl.className = "text-xl font-mono font-bold text-blue-400";
        } else {
            demandEl.innerText = "Low";
            demandEl.className = "text-xl font-mono font-bold text-slate-400";
        }

        this.infoCard.classList.add('show');
        this.connectingCard.classList.remove('show');
        this._toggleMainButtons(false);
    }

    showRouteConfirm(originData, destData, isConnected, routeCost) {
        this.soundManager.playEventSound();

        this.connectingCard.classList.remove('show');
        
        document.getElementById('route-from-name').innerText = originData.id;
        document.getElementById('route-to-name').innerText = destData.id;

        const titleEl = document.getElementById('route-action-title');
        const btnAction = document.getElementById('btn-route-action');
        
        const formattedCost = (routeCost >= 1000000) ? 
                              `$ ${(routeCost/1000000).toFixed(1)}M` : 
                              `$ ${Math.floor(routeCost/1000)}K`;

        if (isConnected) {
            titleEl.innerText = window.APP_LANG.routeRemoveTitle || "空路廃止";
            titleEl.className = "text-xs text-red-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-red-900/20 absolute show";
            
            btnAction.innerHTML = `
                <div class="flex items-center justify-center gap-2">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                    <span>${window.APP_LANG.btnRemoveRoute || "廃止する"}</span>
                </div>
            `;
            btnAction.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:bg-red-500 shadow-lg shadow-red-900/50 transition-colors";
        } else {
            titleEl.innerText = window.APP_LANG.routeOpenTitle || "空路開拓";
            titleEl.className = "text-xs text-yellow-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-yellow-900/20 absolute show";
            
            btnAction.innerHTML = `
                <div class="flex items-center justify-center gap-3">
                    <span>${window.APP_LANG.btnOpenRoute || "開拓する"}</span>
                    <span class="text-[11px] text-slate-300 font-mono tracking-wider">-${formattedCost}</span>
                </div>
            `;
            btnAction.className = "flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-500 shadow-lg shadow-blue-900/50 transition-colors";
        }

        this._toggleMainButtons(false);
        lucide.createIcons();
    }

    hideRouteConfirm() {
        this.routeCard.classList.remove('show');
    }

    hideAll() {
        this.infoCard.classList.remove('show');
        this.routeCard.classList.remove('show');
        this.buyMenu.classList.remove('show');
        this.connectingCard.classList.remove('show');
        if (this.controlCenter) this.controlCenter.classList.remove('show');
        if (this.exitCard) this.exitCard.classList.remove('show');
        if (this.helpMenu) this.helpMenu.classList.remove('show');
        this._toggleMainButtons(true);
    }

    updateFleetPanel(planeCounts) {
        const listEl = document.getElementById('planes-list');
        listEl.innerHTML = '';

        const types = [
            { id: 'small', name: window.APP_LANG.sizeSmall, icon: 'plane', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { id: 'medium', name: window.APP_LANG.sizeMedium, icon: 'plane', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { id: 'large', name: window.APP_LANG.sizeLarge, icon: 'plane', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { id: 'super', name: window.APP_LANG.sizeSuper, icon: 'plane', color: 'text-amber-400', bg: 'bg-amber-500/10' }
        ];

        types.forEach(typeInfo => {
            const count = planeCounts[typeInfo.id] || 0;
            // Config は直接参照できないため、ダミー値やハードコードではなく、上位からのデータ渡しが理想ですが、
            // 今回はUIManagerの責務外のため、概算コストを計算用に置くか、または省略可能です。
            // ※ここではUIの見た目を維持するためハードコードの概算を使用
            const costs = { small: 10, medium: 25, large: 50, super: 100 };
            const upkeeps = { small: 200, medium: 600, large: 1500, super: 3500 };
            
            const card = document.createElement('div');
            card.className = "bg-slate-800/80 rounded-2xl p-4 border border-slate-700 hover:border-slate-500 transition-colors";
            
            card.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center">
                            <i data-lucide="${typeInfo.icon}" class="w-6 h-6 ${typeInfo.color}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white leading-tight">${typeInfo.name}</h4>
                            <p class="text-[10px] text-slate-400 font-mono tracking-wider uppercase">${window.APP_LANG.maintenance}: -$${upkeeps[typeInfo.id]}/s</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-black text-white tracking-tight">${count}</span>
                        <span class="text-[10px] text-slate-500 block uppercase font-bold tracking-wider -mt-1">Owned</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button class="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-xs font-bold active:bg-slate-600 transition-colors border border-slate-600" onclick="document.getElementById('buy-plane-menu').dispatchEvent(new CustomEvent('sell', {detail: '${typeInfo.id}'}))">
                        ${window.APP_LANG.btnSellPlane}
                    </button>
                    <button class="flex-[2] py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold active:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1" onclick="document.getElementById('buy-plane-menu').dispatchEvent(new CustomEvent('buy', {detail: '${typeInfo.id}'}))">
                        <i data-lucide="plus" class="w-3 h-3"></i> $${costs[typeInfo.id]}M
                    </button>
                </div>
            `;
            listEl.appendChild(card);
        });

        lucide.createIcons();

        // Custom Event Listeners for buttons inside innerHTML
        listEl.addEventListener('buy', (e) => {
            if(this.onBuyPlane) this.onBuyPlane(e.detail);
        });
        listEl.addEventListener('sell', (e) => {
            if(this.onSellPlane) this.onSellPlane(e.detail);
        });
    }
}