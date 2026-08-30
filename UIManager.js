/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 3: HUDのダッシュボード化対応】
 * `updateTopHUD` にて、1段目（カレンダーと資金）は `innerText` で安全に代入し、
 * 2段目（機体、収益、客数、シェア）は小さくした「単位のHTMLタグ」を描画するため、
 * `innerHTML` を用いてDOMに注入するよう改修しました。
 */

import { SoundManager } from './SoundManager.js';
import { UPGRADE_DATA } from './Data_Upgrades.js';
import { CONFIG } from './Config.js'; 

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
        this.topStatusHud = document.getElementById('top-status-hud');
        
        this.ccLayerMain = document.getElementById('cc-layer-main');
        this.ccLayerDetail = document.getElementById('cc-layer-detail');

        this.toastTimeout = null;

        this.onConnectRequested = null;
        this.onRouteActionConfirmed = null; 
        this.onRouteCanceled = null;
        this.onFleetMenuOpen = null; 
        this.onBuyPlane = null;
        this.onSellPlane = null;     
        this.onZoomIn = null;
        this.onZoomOut = null;
        this.onUpgradeRequested = null;
        this.currentRouteAction = null; 
        
        this._isUpgradesOpen = false;
        this._isBuyMenuOpen = false;
        this._isRivalsOpen = false; 
        
        this._openedRivalId = null; 

        this._initFleetPrices(); 
        this._bindEvents();
    }

    _formatMoneyShort(value) {
        if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(1)}T`;
        if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${Math.floor(value / 1000)}K`;
        return `$${Math.floor(value)}`;
    }

    _initFleetPrices() {
        ['small', 'medium', 'large', 'super'].forEach(type => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            if (!planeConf) return;

            const buyCostStr = this._formatMoneyShort(planeConf.cost);
            const sellCostStr = this._formatMoneyShort(planeConf.cost * planeConf.sellRate);

            const buyBtn = document.querySelector(`.buy-plane-btn[data-type="${type}"]`);
            if (buyBtn) {
                buyBtn.innerHTML = `<span>購入</span> <span class="font-mono text-slate-400">${buyCostStr}</span>`;
                buyBtn.disabled = true;
                buyBtn.className = `buy-plane-btn bg-slate-700 text-slate-400 opacity-70 text-[10px] font-bold py-1.5 rounded-lg transition-colors flex justify-center gap-1 disabled:pointer-events-none`;
            }

            const sellBtn = document.querySelector(`.sell-plane-btn[data-type="${type}"]`);
            if (sellBtn) {
                sellBtn.innerHTML = `<span>売却</span> <span class="font-mono text-slate-400">${sellCostStr}</span>`;
                sellBtn.disabled = true;
                sellBtn.className = `sell-plane-btn bg-slate-700 text-slate-400 opacity-70 text-[10px] font-bold py-1.5 rounded-lg transition-colors flex justify-center gap-1 disabled:pointer-events-none`;
            }
        });
    }

    _bindEvents() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onConnectRequested) this.onConnectRequested();
        });

        const cancelRoute = () => {
            this.soundManager.playTapSound();
            if (this.onRouteCanceled) this.onRouteCanceled();
            this.hideRouteConfirm();
            this.connectingCard.classList.remove('show');
            this._toggleMainButtons(true);
        };

        document.getElementById('btn-cancel-route').addEventListener('click', cancelRoute);
        document.getElementById('btn-cancel-connect').addEventListener('click', cancelRoute);

        document.getElementById('btn-action-route').addEventListener('click', () => {
            this.soundManager.playSuccessSound();
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed(this.currentRouteAction);
        });

        this.fabBuy.addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onFleetMenuOpen) this.onFleetMenuOpen(); 
            this.hideAll();
            this.buyMenu.classList.add('show');
            this._isBuyMenuOpen = true; 
            this._toggleMainButtons(false);
        });

        document.getElementById('btn-close-buy').addEventListener('click', () => {
            this.soundManager.playTapSound();
            this.buyMenu.classList.remove('show');
            this._isBuyMenuOpen = false; 
            this._toggleMainButtons(true);
        });

        const btnCloseInfo = document.getElementById('btn-close-info');
        if (btnCloseInfo) {
            btnCloseInfo.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this.hideAll();
            });
        }

        document.querySelectorAll('.buy-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) {
                    this.soundManager.playErrorSound();
                    return;
                }
                this.soundManager.playSuccessSound(); 
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
            });
        });

        document.querySelectorAll('.sell-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                this.soundManager.playSuccessSound(); 
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onSellPlane) this.onSellPlane(type);
            });
        });

        if (this.btnZoomIn) {
            this.btnZoomIn.addEventListener('click', () => {
                this.soundManager.playTapSound();
                if (this.onZoomIn) this.onZoomIn();
            });
        }
        if (this.btnZoomOut) {
            this.btnZoomOut.addEventListener('click', () => {
                this.soundManager.playTapSound();
                if (this.onZoomOut) this.onZoomOut();
            });
        }
        
        if (this.btnHelp) {
            this.btnHelp.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this.hideAll();
                if (this.helpMenu) {
                    this.helpMenu.classList.add('show');
                    this._toggleMainButtons(false);
                }
            });
        }
        
        const btnCloseHelp = document.getElementById('btn-close-help');
        if (btnCloseHelp) {
            btnCloseHelp.addEventListener('click', () => {
                this.soundManager.playTapSound();
                if (this.helpMenu) {
                    this.helpMenu.classList.remove('show');
                    this._toggleMainButtons(true);
                }
            });
        }

        if (this.btnSound) {
            this.btnSound.addEventListener('click', () => {
                const isMuted = this.soundManager.toggleMute();
                if (isMuted) {
                    this.btnSound.innerHTML = `
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            <line x1="23" y1="1" x2="1" y2="23"></line>
                        </svg>`;
                    this.btnSound.classList.replace('text-emerald-400', 'text-slate-300');
                    this.btnSound.classList.replace('border-emerald-500/50', 'border-slate-600/50');
                } else {
                    this.btnSound.innerHTML = `
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>`;
                    this.btnSound.classList.replace('text-slate-300', 'text-emerald-400');
                    this.btnSound.classList.replace('border-slate-600/50', 'border-emerald-500/50');
                }
            });
        }

        if (this.btnMainMenu) {
            this.btnMainMenu.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this.hideAll();
                this.controlCenter.classList.add('show');
                this._toggleMainButtons(false); 
            });
        }

        document.getElementById('btn-close-cc').addEventListener('click', () => {
            this.soundManager.playTapSound();
            this.controlCenter.classList.remove('show');
            this._isUpgradesOpen = false; 
            this._isRivalsOpen = false; 
            this._toggleMainButtons(true);
            setTimeout(() => {
                this._resetControlCenterView();
                this.controlCenter.classList.add('h-[400px]');
                this.controlCenter.style.height = '';
                this.controlCenter.style.maxHeight = '';
            }, 300);
        });

        document.querySelectorAll('.cc-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playTapSound();
                const targetId = e.currentTarget.getAttribute('data-target');
                
                document.querySelectorAll('#panel-upgrades, #panel-overview, #panel-rivals').forEach(el => {
                    if (el) el.classList.add('hidden');
                });
                
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    const titleText = e.currentTarget.querySelector('.text-sm').innerText;
                    document.getElementById('cc-title').innerText = titleText;
                    
                    this.ccLayerMain.style.transform = 'translateX(-100%)';
                    this.ccLayerDetail.style.transform = 'translateX(0)';
                    
                    this._isUpgradesOpen = (targetId === 'panel-upgrades');
                    this._isRivalsOpen = (targetId === 'panel-rivals');

                    if (this._isRivalsOpen) {
                        this.controlCenter.classList.remove('h-[400px]');
                        this.controlCenter.style.height = '560px';
                        this.controlCenter.style.maxHeight = '80vh';
                    } else {
                        this.controlCenter.classList.add('h-[400px]');
                        this.controlCenter.style.height = '';
                        this.controlCenter.style.maxHeight = '';
                    }
                }
            });
        });

        const btnSideBack = document.getElementById('btn-side-back');
        if (btnSideBack) {
            btnSideBack.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this._resetControlCenterView();
                this._isUpgradesOpen = false; 
                this._isRivalsOpen = false;
                
                this.controlCenter.classList.add('h-[400px]');
                this.controlCenter.style.height = '';
                this.controlCenter.style.maxHeight = '';
            });
        }

        document.querySelectorAll('.graph-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playTapSound();
                const tabs = e.currentTarget.parentElement.querySelectorAll('.graph-tab-btn');
                tabs.forEach(t => {
                    t.className = "graph-tab-btn flex-1 text-[10px] font-bold py-1.5 text-slate-400 hover:text-slate-200 rounded-md transition-colors";
                });
                e.currentTarget.className = "graph-tab-btn flex-1 text-[10px] font-bold py-1.5 bg-slate-700 text-white rounded-md shadow-sm transition-colors";
            });
        });

        const btnExitGame = document.getElementById('btn-exit-game');
        if (btnExitGame) {
            btnExitGame.addEventListener('click', () => {
                this.soundManager.playWarningSound(); 
                this.controlCenter.classList.remove('show');
                setTimeout(() => {
                    this._resetControlCenterView();
                    this.controlCenter.classList.add('h-[400px]');
                    this.controlCenter.style.height = '';
                    this.controlCenter.style.maxHeight = '';
                    
                    this.exitCard.classList.add('show');
                    this._toggleMainButtons(false);
                }, 300);
            });
        }

        const btnCancelExit = document.getElementById('btn-cancel-exit');
        if (btnCancelExit) {
            btnCancelExit.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this.exitCard.classList.remove('show');
                this._toggleMainButtons(true);
            });
        }

        const btnSubmitExit = document.getElementById('btn-submit-exit');
        if (btnSubmitExit) {
            btnSubmitExit.addEventListener('click', () => {
                this.soundManager.playSuccessSound();
                this.exitCard.classList.remove('show');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            });
        }

        let isHudOn = false;
        const btnToggleHud = document.getElementById('btn-toggle-hud');
        if (btnToggleHud) {
            const hudIndicator = btnToggleHud.querySelector('div');

            btnToggleHud.addEventListener('click', () => {
                this.soundManager.playTapSound();
                isHudOn = !isHudOn;
                if (isHudOn) {
                    btnToggleHud.classList.replace('bg-slate-700', 'bg-emerald-500');
                    hudIndicator.style.transform = 'translateX(24px)';
                    hudIndicator.classList.replace('bg-slate-400', 'bg-white');
                    this.topStatusHud.style.transform = 'translateY(0)';
                } else {
                    btnToggleHud.classList.replace('bg-emerald-500', 'bg-slate-700');
                    hudIndicator.style.transform = 'translateX(0)';
                    hudIndicator.classList.replace('bg-white', 'bg-slate-400');
                    this.topStatusHud.style.transform = 'translateY(-100%)';
                }
            });
        }
    }

    _resetControlCenterView() {
        this.ccLayerMain.style.transform = 'translateX(0)';
        this.ccLayerDetail.style.transform = 'translateX(100%)';
        document.getElementById('cc-title').innerText = 'メニュー';
    }

    _toggleMainButtons(show) {
        const scale = show ? '1' : '0';
        this.fabBuy.style.transform = `scale(${scale})`;
        if (this.zoomControls) this.zoomControls.style.transform = `scale(${scale})`;
        if (this.btnHelp) this.btnHelp.style.transform = `scale(${scale})`;
        if (this.btnSound) this.btnSound.style.transform = `scale(${scale})`;
        if (this.btnMainMenu) this.btnMainMenu.style.transform = `translate(-50%, 0) scale(${scale})`;
    }

    // ★Phase 3: HUDのダッシュボード化対応（innerHTML化）
    updateTopHUD(calendarStr, fundsStr, planesStr, incomeStr, passengersStr, shareStr) {
        const elCalendar = document.getElementById('hud-calendar');
        const elFunds = document.getElementById('hud-funds');
        const elPlanes = document.getElementById('hud-planes');
        const elIncome = document.getElementById('hud-income');
        const elPassengers = document.getElementById('hud-passengers');
        const elShare = document.getElementById('hud-share');

        if (elCalendar) elCalendar.innerText = calendarStr; 
        if (elFunds) elFunds.innerText = fundsStr;
        
        // 単位などの装飾タグを含めるため innerHTML を使用
        if (elPlanes) elPlanes.innerHTML = planesStr;
        if (elIncome) elIncome.innerHTML = incomeStr;
        if (elPassengers) elPassengers.innerHTML = passengersStr;
        if (elShare) elShare.innerHTML = shareStr;
    }

    updateFleetPanel(counts) {
        ['small', 'medium', 'large', 'super'].forEach(type => {
            const countEl = document.getElementById(`count-${type}`);
            if (countEl) countEl.innerText = counts[type] || 0;
            
            const sellBtn = document.querySelector(`.sell-plane-btn[data-type="${type}"]`);
            if (sellBtn) {
                const canSell = (counts[type] > 0);
                sellBtn.disabled = !canSell;
                
                if (canSell) {
                    sellBtn.className = `sell-plane-btn bg-rose-600 active:bg-rose-500 text-white text-[10px] font-bold py-1.5 rounded-lg shadow transition-colors flex justify-center gap-1`;
                    const priceSpan = sellBtn.querySelector('span:nth-child(2)');
                    if (priceSpan) priceSpan.className = 'font-mono text-rose-300';
                } else {
                    sellBtn.className = `sell-plane-btn bg-slate-700 text-slate-400 opacity-70 text-[10px] font-bold py-1.5 rounded-lg transition-colors flex justify-center gap-1 disabled:pointer-events-none`;
                    const priceSpan = sellBtn.querySelector('span:nth-child(2)');
                    if (priceSpan) priceSpan.className = 'font-mono text-slate-400';
                }
            }
        });
    }

    updateZoomButtonsState(canZoomIn, canZoomOut) {
        if (this.btnZoomIn) this.btnZoomIn.disabled = !canZoomIn;
        if (this.btnZoomOut) this.btnZoomOut.disabled = !canZoomOut;
    }

    showToast(message, type = 'error') {
        const baseClasses = "fixed top-40 left-1/2 transform -translate-x-1/2 -translate-y-4 px-5 py-2 text-sm font-bold rounded-full shadow-lg opacity-0 pointer-events-none transition-all duration-300 z-50 whitespace-nowrap w-max";
        
        if (type === 'error') {
            this.soundManager.playWarningSound();
            this.toast.className = `${baseClasses} bg-rose-600/90 text-white shadow-rose-900/50`;
        } else if (type === 'info') {
            this.soundManager.playEventSound();
            this.toast.className = `${baseClasses} bg-blue-600/90 text-white shadow-blue-900/50`;
        } else {
            this.soundManager.playEventSound();
            this.toast.className = `${baseClasses} bg-slate-800/95 text-cyan-400 border border-slate-700 shadow-slate-900/50`;
        }
        
        this.toast.innerText = message;
        void this.toast.offsetWidth;
        this.toast.classList.add('toast-show');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('toast-show');
        }, 3000); 
    }

    showAirportInfo(data, currentConnections, maxConnections) {
        this.soundManager.playEventSound();
        this.hideAll();
        document.getElementById('airport-name').innerText = data.name;
        document.getElementById('airport-code').innerText = data.id;
        document.getElementById('airport-country').innerText = data.country;
        document.getElementById('airport-conn').innerText = `${currentConnections}/${maxConnections}`;
        
        const typeEl = document.getElementById('airport-type');
        if (data.type === 'major') {
            typeEl.innerText = window.APP_LANG.hubMajor;
            typeEl.className = 'text-xs font-semibold text-yellow-400 uppercase tracking-wider';
        } else if (data.type === 'local') {
            typeEl.innerText = window.APP_LANG.hubLocal;
            typeEl.className = 'text-xs font-semibold text-orange-400 uppercase tracking-wider';
        } else {
            typeEl.innerText = window.APP_LANG.hubFictional;
            typeEl.className = 'text-xs font-semibold text-emerald-400 uppercase tracking-wider';
        }

        const btnConnect = document.getElementById('btn-connect');
        btnConnect.classList.remove('hidden');
        
        btnConnect.className = 'w-full py-3 rounded-xl text-white font-bold shadow-lg transition-colors bg-cyan-600 active:bg-cyan-500 shadow-cyan-900/50';

        if(currentConnections >= maxConnections) {
            btnConnect.innerText = window.APP_LANG.btnLimitAction;
        } else {
            btnConnect.innerText = window.APP_LANG.btnConnect;
        }

        this.infoCard.classList.add('show');
        this._toggleMainButtons(false);
    }

    setConnectingMode() {
        this.infoCard.classList.remove('show');
        this.connectingCard.classList.add('show');
        this._toggleMainButtons(false);
    }

    showRouteConfirm(fromData, toData, isConnected, routeCost = 50000) {
        this.soundManager.playEventSound();
        this.connectingCard.classList.remove('show');
        document.getElementById('route-from').innerText = fromData.id;
        document.getElementById('route-to').innerText = toData.id;

        const titleEl = document.getElementById('route-action-title');
        const btnAction = document.getElementById('btn-action-route');

        this.currentRouteAction = isConnected ? 'remove' : 'add';

        const formattedCost = this._formatMoneyShort(routeCost);

        if (isConnected) {
            titleEl.innerText = window.APP_LANG.routeRemoveTitle || "空路廃止";
            titleEl.className = "text-xs text-red-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-red-900/20 absolute show";
            
            btnAction.innerHTML = `
                <div class="flex items-center justify-center gap-3">
                    <span>${window.APP_LANG.btnRemoveRoute || "廃止する"}</span>
                    <span class="text-[11px] text-emerald-300 font-mono tracking-wider">+$25K</span>
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
    }

    hideRouteConfirm() {
        this.routeCard.classList.remove('show');
    }

    hideAll() {
        this.infoCard.classList.remove('show');
        this.routeCard.classList.remove('show');
        this.buyMenu.classList.remove('show');
        this.connectingCard.classList.remove('show');
        
        if (this.controlCenter && this.controlCenter.classList.contains('show')) {
            this.controlCenter.classList.remove('show');
            setTimeout(() => {
                this._resetControlCenterView();
                this.controlCenter.classList.add('h-[400px]');
                this.controlCenter.style.height = '';
                this.controlCenter.style.maxHeight = '';
            }, 300);
        }
        
        if (this.exitCard) this.exitCard.classList.remove('show');
        if (this.helpMenu) this.helpMenu.classList.remove('show'); 
        
        this._isUpgradesOpen = false;
        this._isBuyMenuOpen = false;
        this._isRivalsOpen = false; 
        this._openedRivalId = null; 
        
        this._toggleMainButtons(true);
    }

    isUpgradePanelOpen() { return this._isUpgradesOpen; }
    isBuyMenuOpen() { return this._isBuyMenuOpen; }
    isRivalsPanelOpen() { return this._isRivalsOpen; } 

    checkBuyPlaneButtons(currentFunds, currentPlanes, maxPlanes) {
        if (!this._isBuyMenuOpen) return;
        
        const isFull = currentPlanes >= maxPlanes;
        
        ['small', 'medium', 'large', 'super'].forEach(type => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            if (!planeConf) return;
            
            const btn = document.querySelector(`.buy-plane-btn[data-type="${type}"]`);
            if (!btn) return;
            
            const canAfford = currentFunds >= planeConf.cost;
            const canBuy = canAfford && !isFull;
            
            if (canBuy !== !btn.disabled) {
                if (canBuy) {
                    btn.disabled = false;
                    btn.className = `buy-plane-btn bg-emerald-600 active:bg-emerald-500 text-white text-[10px] font-bold py-1.5 rounded-lg shadow transition-colors flex justify-center gap-1`;
                    const textSpan = btn.querySelector('span:nth-child(1)');
                    if (textSpan) textSpan.innerText = '購入';
                    const priceSpan = btn.querySelector('span:nth-child(2)');
                    if (priceSpan) priceSpan.className = 'font-mono text-emerald-200';
                } else {
                    btn.disabled = true;
                    btn.className = `buy-plane-btn bg-slate-700 text-slate-400 opacity-70 text-[10px] font-bold py-1.5 rounded-lg transition-colors flex justify-center gap-1 disabled:pointer-events-none`;
                    
                    const textSpan = btn.querySelector('span:nth-child(1)');
                    if (textSpan) textSpan.innerText = isFull ? '上限到達' : '購入';
                    
                    const priceSpan = btn.querySelector('span:nth-child(2)');
                    if (priceSpan) priceSpan.className = 'font-mono text-slate-400';
                }
            } else {
                if (!canBuy) {
                    const textSpan = btn.querySelector('span:nth-child(1)');
                    if (textSpan) {
                        const expectedText = isFull ? '上限到達' : '購入';
                        if (textSpan.innerText !== expectedText) {
                            textSpan.innerText = expectedText;
                        }
                    }
                }
            }
        });
    }

    checkUpgradeButtons(upgradeManager, currentFunds) {
        const panel = document.getElementById('panel-upgrades');
        if (!panel) return;

        const buttons = panel.querySelectorAll('.upgrade-action-btn');
        buttons.forEach(btn => {
            const upgradeId = btn.getAttribute('data-id');
            const nextCost = upgradeManager.getNextCost(upgradeId);
            
            if (nextCost === null) return;

            const canAfford = currentFunds >= nextCost;
            
            if (canAfford !== !btn.disabled) {
                if (canAfford) {
                    btn.disabled = false;
                    if (btn.classList.contains('bg-slate-700') && btn.innerHTML.includes('昇格')) {
                        btn.className = `upgrade-action-btn bg-yellow-500 active:bg-yellow-400 text-slate-900 shadow-md active:scale-95 text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center flex flex-col items-center justify-center leading-none`;
                        const span = btn.querySelector('span');
                        if(span) span.className = 'text-[9px] mb-1 font-sans font-black tracking-widest text-slate-900';
                    } else if (btn.classList.contains('bg-slate-700')) {
                        btn.className = `upgrade-action-btn bg-emerald-500 active:bg-emerald-400 text-white shadow-md active:scale-95 text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center`;
                    }
                } else {
                    btn.disabled = true;
                    if (btn.innerHTML.includes('昇格')) {
                        btn.className = `upgrade-action-btn bg-slate-700 text-slate-400 opacity-70 text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center flex flex-col items-center justify-center leading-none disabled:pointer-events-none`;
                        const span = btn.querySelector('span');
                        if(span) span.className = 'text-[9px] mb-1 font-sans font-black tracking-widest text-slate-500';
                    } else {
                        btn.className = `upgrade-action-btn bg-slate-700 text-slate-400 opacity-70 text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center disabled:pointer-events-none`;
                    }
                }
            }
        });
    }

    updateRivalsPanel(stats) {
        const panel = document.getElementById('panel-rivals');
        if (!panel) return;

        let html = ``; 
        
        const playerStat = stats.find(s => s.isPlayer) || stats[0];
        
        const topRivalStat = stats.find(s => !s.isPlayer) || stats[0];

        stats.forEach((stat, index) => {
            const rank = index + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span class="text-slate-500 ml-1">${rank}位</span>`;
            
            const isPlayer = stat.isPlayer;
            const shareStr = (stat.globalShare * 100).toFixed(1) + '%';
            const assetStr = this._formatMoneyShort(stat.assetValue);
            
            const bgColor = isPlayer ? 'bg-slate-700/80 border-emerald-500/50' : 'bg-slate-800 border-transparent';
            const titleColor = isPlayer ? 'text-emerald-400' : 'text-slate-200';
            const shortName = isPlayer ? '自' : stat.id.replace('rival_', '').toUpperCase();
            
            let rivalColorClass = 'bg-blue-500';
            if (stat.id === 'rival_as') rivalColorClass = 'bg-yellow-500';
            if (stat.id === 'rival_af') rivalColorClass = 'bg-pink-500';
            if (stat.id === 'rival_am') rivalColorClass = 'bg-red-500';
            if (stat.id === 'rival_oc') rivalColorClass = 'bg-purple-500';
            const iconBg = isPlayer ? 'bg-emerald-600' : rivalColorClass;

            const isOpen = (this._openedRivalId === stat.id);
            const contentClass = isOpen ? '' : 'hidden';
            const iconClass = isOpen ? 'rotate-180' : '';

            const compareStat = isPlayer ? topRivalStat : stat;
            const compareShareStr = (compareStat.globalShare * 100).toFixed(1) + '%';
            const compareAssetStr = this._formatMoneyShort(compareStat.assetValue);

            html += `
            <div class="rounded-xl border ${bgColor} shadow-inner overflow-hidden transition-all mb-1.5" data-rival-id="${stat.id}">
                <button class="rival-accordion-btn w-full flex items-center justify-between p-3 active:bg-slate-700/50 transition-colors">
                    <div class="flex items-center gap-2">
                        <div class="w-6 text-center text-sm">${rankIcon}</div>
                        <div class="w-7 h-7 rounded-full ${iconBg} flex items-center justify-center font-bold text-white text-[10px] shadow">${shortName}</div>
                        <div class="text-left ml-1">
                            <div class="text-sm font-bold ${titleColor} leading-tight">${stat.name} ${isPlayer ? '★' : ''}</div>
                            <div class="text-[10px] text-slate-400 mt-0.5">シェア <span class="font-mono text-slate-300">${shareStr}</span> / 資産 <span class="font-mono text-slate-300">${assetStr}</span></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="accordion-icon text-slate-500 transition-transform duration-300 ${iconClass}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </button>
                
                <div class="${contentClass} p-3 pt-0 border-t border-slate-700/50 mt-1 rival-accordion-content">
                    <div class="mt-3 flex flex-col gap-3">
                        ${this._createCompareBarHtml('👑 世界シェア率', playerStat.globalShare, compareStat.globalShare, (playerStat.globalShare*100).toFixed(1)+'%', compareShareStr, compareStat.name)}
                        ${this._createCompareBarHtml('💰 推定企業総資産', playerStat.assetValue, compareStat.assetValue, this._formatMoneyShort(playerStat.assetValue), compareAssetStr, compareStat.name)}
                        ${this._createCompareBarHtml('⭐ 顧客満足度', playerStat.satisfaction, compareStat.satisfaction, playerStat.satisfaction, compareStat.satisfaction, compareStat.name)}
                        ${this._createCompareBarHtml('🌐 総路線数', playerStat.routeCount, compareStat.routeCount, playerStat.routeCount, compareStat.routeCount, compareStat.name)}
                        ${this._createCompareBarHtml('✈️ 稼働機体数', playerStat.planeCount, compareStat.planeCount, playerStat.planeCount, compareStat.planeCount, compareStat.name)}
                    </div>
                </div>
            </div>`;
        });

        panel.innerHTML = html;

        panel.querySelectorAll('.rival-accordion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playTapSound();
                const parentDiv = e.currentTarget.closest('[data-rival-id]');
                const rivalId = parentDiv.getAttribute('data-rival-id');
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('.accordion-icon');
                
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                    this._openedRivalId = rivalId; 
                } else {
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-180');
                    if (this._openedRivalId === rivalId) {
                        this._openedRivalId = null; 
                    }
                }
            });
        });
    }

    _createCompareBarHtml(title, playerVal, rivalVal, playerDisplay, rivalDisplay, rivalName) {
        const total = Math.max(playerVal + rivalVal, 0.0001);
        const pPct = (playerVal / total) * 100;
        const rPct = (rivalVal / total) * 100;
        
        let resultText = '';
        let resultColor = '';
        
        if (playerVal > rivalVal) {
            resultText = '(勝ち!)';
            resultColor = 'text-emerald-400';
        } else if (playerVal < rivalVal) {
            resultText = '(負け)';
            resultColor = 'text-rose-400';
        } else {
            resultText = '(互角)';
            resultColor = 'text-slate-400';
        }

        const shortRivalName = rivalName.length > 8 ? rivalName.substring(0, 8) + '.' : rivalName;

        return `
        <div>
            <div class="flex justify-between text-[10px] font-bold mb-1.5">
                <span class="text-slate-300">${title}</span>
                <span>自社 ${playerDisplay} <span class="text-slate-600 font-normal mx-0.5">vs</span> ${shortRivalName} ${rivalDisplay} <span class="${resultColor} ml-0.5">${resultText}</span></span>
            </div>
            <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-slate-500 w-6">自社</span>
                    <div class="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden flex shadow-inner">
                        <div class="h-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)] transition-all duration-500" style="width: ${pPct}%"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-slate-500 w-6">敵</span>
                    <div class="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden flex shadow-inner">
                        <div class="h-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.3)] transition-all duration-500" style="width: ${rPct}%"></div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    updateUpgradePanel(upgradeManager, currentFunds) {
        const panel = document.getElementById('panel-upgrades');
        if (!panel) return;

        const categories = [
            { id: 'special', title: '特別拡張枠', keys: ['fleet_capacity'], color: 'text-amber-400' },
            { id: 'finance', title: '財務・運航', keys: ['ticket_price', 'flight_speed', 'cabin_comfort'], color: 'text-cyan-400' },
            { id: 'staff',   title: '人員・スタッフ', keys: ['pilot_training', 'ground_ops', 'hr_management'], color: 'text-cyan-400' },
            { id: 'service', title: 'サービス', keys: ['catering', 'entertainment', 'vip_lounge'], color: 'text-cyan-400' }
        ];

        let html = '';

        categories.forEach(cat => {
            html += `<div class="text-xs font-bold ${cat.color} mt-2 mb-1 tracking-widest uppercase">${cat.title}</div>`;

            cat.keys.forEach(key => {
                const data = UPGRADE_DATA[key];
                if (!data) return;

                const currentLevel = upgradeManager.getCurrentLevel(key);
                const currentStep = upgradeManager.getCurrentStep(key); 
                const maxLevel = upgradeManager.getMaxLevel(key);
                const nextCost = upgradeManager.getNextCost(key);
                
                const currentLevelData = data.levels.find(l => l.level === currentLevel);
                let currentStepData = null;
                if (currentLevelData && currentLevelData.steps) {
                    currentStepData = currentLevelData.steps.find(s => s.step === currentStep);
                }

                const isMax = currentLevel >= maxLevel;

                let nextStepData = null;
                if (!isMax) {
                    const nLvlData = data.levels.find(l => l.level === currentLevel);
                    if (nLvlData && nLvlData.steps) {
                        nextStepData = nLvlData.steps.find(s => s.step === (currentStep + 1));
                    }
                }

                let dotsHtml = '';
                for (let i = 0; i < 5; i++) {
                    if (isMax || i <= currentStep) {
                        const dotColor = key === 'fleet_capacity' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.3)]' : 
                                         (cat.id === 'staff' ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]');
                        dotsHtml += `<div class="h-1.5 w-full ${dotColor} rounded-full transition-all duration-300"></div>`;
                    } else {
                        dotsHtml += `<div class="h-1.5 w-full bg-slate-700 rounded-full transition-all duration-300"></div>`;
                    }
                }

                let effectText = 'MAX レベル達成';
                let effectColor = 'text-slate-400';
                
                if (nextStepData && currentStepData) {
                    if (nextStepData.capacity !== undefined) effectText = `上限 ${currentStepData.capacity} ➔ ${nextStepData.capacity} 機`;
                    else if (nextStepData.speedMultiplier !== undefined) effectText = `フライト時間短縮 ${Math.round((currentStepData.speedMultiplier - 1) * 100)}% ➔ ${Math.round((nextStepData.speedMultiplier - 1) * 100)}%`;
                    else if (nextStepData.bonusIncomeRate !== undefined) effectText = `収益ボーナス +${Math.round(currentStepData.bonusIncomeRate * 100)}% ➔ +${Math.round(nextStepData.bonusIncomeRate * 100)}%`;
                    else if (nextStepData.bonusSatisfaction !== undefined) effectText = `顧客満足度 +${currentStepData.bonusSatisfaction} ➔ +${nextStepData.bonusSatisfaction}`;
                    
                    if (key === 'fleet_capacity') effectColor = 'text-amber-400';
                    else if (cat.id === 'staff') effectColor = 'text-blue-400';
                    else effectColor = 'text-emerald-400';
                } else if (isMax && currentStepData) {
                    if (currentStepData.capacity !== undefined) effectText = `機体上限 ${currentStepData.capacity} 機 (MAX)`;
                    else if (currentStepData.speedMultiplier !== undefined) effectText = `フライト時間短縮 ${Math.round((currentStepData.speedMultiplier - 1) * 100)}% (MAX)`;
                    else if (currentStepData.bonusIncomeRate !== undefined) effectText = `収益ボーナス +${Math.round(currentStepData.bonusIncomeRate * 100)}% (MAX)`;
                    else if (currentStepData.bonusSatisfaction !== undefined) effectText = `顧客満足度 +${currentStepData.bonusSatisfaction} (MAX)`;
                }

                let btnHtml = '';
                if (isMax) {
                    btnHtml = `<button class="bg-slate-700 text-slate-400 text-[12px] font-bold px-3 py-2.5 rounded-lg shadow-md font-mono tracking-wide shrink-0 min-w-[70px] text-center disabled:pointer-events-none" disabled>MAX</button>`;
                } else {
                    const canAfford = currentFunds >= nextCost;
                    const costStr = this._formatMoneyShort(nextCost);
                    
                    if (currentStep === 4) {
                        const btnClass = canAfford ? 
                            `bg-yellow-500 active:bg-yellow-400 text-slate-900 shadow-md active:scale-95` : 
                            `bg-slate-700 text-slate-400 opacity-70 disabled:pointer-events-none`;
                            
                        btnHtml = `
                            <button class="upgrade-action-btn ${btnClass} text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center flex flex-col items-center justify-center leading-none" data-id="${key}" ${canAfford ? '' : 'disabled'}>
                                <span class="text-[9px] mb-1 font-sans font-black tracking-widest ${canAfford ? 'text-slate-900' : 'text-slate-500'}">昇格</span>
                                <span>${costStr}</span>
                            </button>
                        `;
                    } else {
                        const btnClass = canAfford ? 
                            `bg-emerald-500 active:bg-emerald-400 text-white shadow-md active:scale-95` : 
                            `bg-slate-700 text-slate-400 opacity-70 disabled:pointer-events-none`;
                        
                        btnHtml = `<button class="upgrade-action-btn ${btnClass} text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center" data-id="${key}" ${canAfford ? '' : 'disabled'}>${costStr}</button>`;
                    }
                }

                const displayLevel = isMax ? 'MAX' : `Lv ${currentLevel + 1}`;

                html += `
                <div class="flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-transparent shadow-inner mb-2">
                    <div class="flex-1 pr-3">
                        <div class="text-sm font-bold text-slate-200 flex items-baseline">
                            ${data.name} <span class="text-slate-400 text-[10px] ml-1.5 font-mono">${displayLevel}</span>
                        </div>
                        <div class="text-[11px] font-bold ${effectColor} mt-0.5">${effectText}</div>
                        <div class="flex gap-1 mt-1.5">${dotsHtml}</div>
                    </div>
                    ${btnHtml}
                </div>`;
            });
        });

        html += `<div class="h-4"></div>`;
        panel.innerHTML = html;

        panel.querySelectorAll('.upgrade-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.disabled) {
                    this.soundManager.playErrorSound();
                    return;
                }
                const upgradeId = e.currentTarget.getAttribute('data-id');
                if (this.onUpgradeRequested) {
                    this.onUpgradeRequested(upgradeId);
                }
            });
        });
    }
}