/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.4: 投資UIの動的化と連動】に加え、機体価格のハードコーディングを解消しました。
 * 1. Data_Upgrades.js と UpgradeManager の情報をもとに、投資パネル内の HTML を動的に生成します。
 * 2. プレイヤーの所持金やレベルに応じて、ボタンの表示（グレーアウト等）を制御します。
 * 3. ボタンが押された際、GameManager へイベントを発火させます。
 * 4. 【追加】 `_initFleetPrices()` にて、Config の機体価格データを読み込み、購入・売却ボタンの金額表示を動的に更新します。
 */

import { SoundManager } from './SoundManager.js';
import { UPGRADE_DATA } from './Data_Upgrades.js';
import { CONFIG } from './Config.js'; // ★追加: 機体価格の動的読み込みのため

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

        this._initFleetPrices(); // ★追加: 初期化時に機体価格をバインド
        this._bindEvents();
    }

    // ★追加: 機体の購入・売却価格をConfigから動的に表示する
    _initFleetPrices() {
        ['small', 'medium', 'large', 'super'].forEach(type => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            if (!planeConf) return;

            const buyCostStr = planeConf.cost >= 1000000 ? `$${(planeConf.cost / 1000000).toFixed(0)}M` : `$${Math.floor(planeConf.cost / 1000)}K`;
            const sellCostValue = planeConf.cost * planeConf.sellRate;
            const sellCostStr = sellCostValue >= 1000000 ? `$${(sellCostValue / 1000000).toFixed(0)}M` : `$${Math.floor(sellCostValue / 1000)}K`;

            const buyBtn = document.querySelector(`.buy-plane-btn[data-type="${type}"]`);
            if (buyBtn) {
                buyBtn.innerHTML = `<span>購入</span> <span class="font-mono text-emerald-200">${buyCostStr}</span>`;
            }

            const sellBtn = document.querySelector(`.sell-plane-btn[data-type="${type}"]`);
            if (sellBtn) {
                sellBtn.innerHTML = `<span>売却</span> <span class="font-mono text-rose-300">${sellCostStr}</span>`;
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
            this._toggleMainButtons(false);
        });

        document.getElementById('btn-close-buy').addEventListener('click', () => {
            this.soundManager.playTapSound();
            this.buyMenu.classList.remove('show');
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
                this.soundManager.playSuccessSound(); 
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
            });
        });

        document.querySelectorAll('.sell-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
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
            this._toggleMainButtons(true);
            setTimeout(() => this._resetControlCenterView(), 300);
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
                }
            });
        });

        const btnSideBack = document.getElementById('btn-side-back');
        if (btnSideBack) {
            btnSideBack.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this._resetControlCenterView();
            });
        }

        document.querySelectorAll('.rival-accordion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playTapSound();
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('.accordion-icon');
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                } else {
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-180');
                }
            });
        });

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

    updateTopHUD(fundsStr, incomeStr, planeCount, maxPlanes, passengersStr) {
        const elFunds = document.getElementById('hud-funds');
        const elIncome = document.getElementById('hud-income');
        const elPlanes = document.getElementById('hud-planes');
        const elPassengers = document.getElementById('hud-passengers');

        if (elFunds) elFunds.innerText = fundsStr;
        if (elIncome) elIncome.innerText = incomeStr;
        if (elPlanes) elPlanes.innerHTML = `${planeCount} <span class="text-slate-500 text-[10px]">/ ${maxPlanes}</span>`;
        if (elPassengers) elPassengers.innerText = passengersStr;
    }

    updateFleetPanel(counts) {
        ['small', 'medium', 'large', 'super'].forEach(type => {
            const countEl = document.getElementById(`count-${type}`);
            if (countEl) countEl.innerText = counts[type] || 0;
            
            const sellBtn = document.querySelector(`.sell-plane-btn[data-type="${type}"]`);
            if (sellBtn) {
                sellBtn.disabled = (counts[type] === 0);
            }
        });
    }

    updateZoomButtonsState(canZoomIn, canZoomOut) {
        if (this.btnZoomIn) this.btnZoomIn.disabled = !canZoomIn;
        if (this.btnZoomOut) this.btnZoomOut.disabled = !canZoomOut;
    }

    showToast(message, type = 'error') {
        const baseClasses = "fixed top-24 left-1/2 transform -translate-x-1/2 -translate-y-4 px-5 py-2 text-sm font-bold rounded-full shadow-lg opacity-0 pointer-events-none transition-all duration-300 z-50";
        
        if (type === 'error') {
            this.soundManager.playWarningSound();
            this.toast.className = `${baseClasses} bg-rose-600/90 text-white shadow-rose-900/50`;
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
        }, 2000); 
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

        const formattedCost = routeCost >= 1000000 ? `$ ${(routeCost / 1000000).toFixed(1)}M` : `$ ${Math.floor(routeCost / 1000)}K`;

        if (isConnected) {
            titleEl.innerText = window.APP_LANG.routeRemoveTitle || "空路廃止";
            titleEl.className = "text-xs text-red-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-red-900/20 absolute show";
            
            btnAction.innerHTML = `
                <div class="flex items-center justify-center gap-3">
                    <span>${window.APP_LANG.btnRemoveRoute || "廃止する"}</span>
                    <span class="text-[11px] text-emerald-300 font-mono tracking-wider">+$ 25K</span>
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
        if (this.controlCenter) this.controlCenter.classList.remove('show');
        if (this.exitCard) this.exitCard.classList.remove('show');
        if (this.helpMenu) this.helpMenu.classList.remove('show'); 
        
        this._toggleMainButtons(true);
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
                const maxLevel = upgradeManager.getMaxLevel(key);
                const nextCost = upgradeManager.getNextCost(key);
                
                const currentData = data.levels.find(l => l.level === currentLevel);
                const nextData = currentLevel < maxLevel ? data.levels.find(l => l.level === currentLevel + 1) : null;

                let dotsHtml = '';
                const displayMax = key === 'fleet_capacity' ? 4 : 5; 
                for (let i = 1; i <= displayMax; i++) {
                    if (i <= currentLevel) {
                        const dotColor = key === 'fleet_capacity' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.3)]' : 
                                         (cat.id === 'staff' ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]');
                        dotsHtml += `<div class="h-1.5 w-full ${dotColor} rounded-full"></div>`;
                    } else {
                        dotsHtml += `<div class="h-1.5 w-full bg-slate-700 rounded-full"></div>`;
                    }
                }

                let effectText = 'MAX レベル達成';
                let effectColor = 'text-slate-400';
                
                if (nextData) {
                    if (nextData.capacity !== undefined) effectText = `機体上限を ${nextData.capacity} 機へ拡張`;
                    else if (nextData.speedMultiplier !== undefined) effectText = `フライト時間 -${Math.round((nextData.speedMultiplier - 1) * 100)}%`;
                    else if (nextData.bonusIncomeRate !== undefined) effectText = `1フライトの収益 +${Math.round(nextData.bonusIncomeRate * 100)}%`;
                    else if (nextData.bonusSatisfaction !== undefined) effectText = `顧客満足度 +${nextData.bonusSatisfaction}`;
                    else if (nextData.turnaroundReduction !== undefined) effectText = `折り返し時間 -${Math.round(nextData.turnaroundReduction * 100)}%`;
                    
                    if (key === 'fleet_capacity') effectColor = 'text-amber-400';
                    else if (cat.id === 'staff') effectColor = 'text-blue-400';
                    else effectColor = 'text-emerald-400';
                }

                let btnHtml = '';
                if (currentLevel >= maxLevel) {
                    btnHtml = `<button class="bg-slate-700 text-slate-400 text-[12px] font-bold px-3 py-2.5 rounded-lg shadow-md font-mono tracking-wide shrink-0 min-w-[70px] text-center" disabled>MAX</button>`;
                } else {
                    const canAfford = currentFunds >= nextCost;
                    const btnClass = canAfford ? 
                        `bg-emerald-500 active:bg-emerald-400 text-white shadow-md active:scale-95` : 
                        `bg-slate-700 text-slate-400 opacity-70`;
                    
                    const costStr = nextCost >= 1000000 ? `$${(nextCost/1000000).toFixed(1)}M` : `$${Math.floor(nextCost/1000)}K`;

                    btnHtml = `<button class="upgrade-action-btn ${btnClass} text-[12px] font-bold px-3 py-2.5 rounded-lg transition-all font-mono tracking-wide shrink-0 min-w-[70px] text-center" data-id="${key}" ${canAfford ? '' : 'disabled'}>${costStr}</button>`;
                }

                html += `
                <div class="flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-transparent shadow-inner mb-2">
                    <div class="flex-1 pr-3">
                        <div class="text-sm font-bold text-slate-200 flex items-baseline">
                            ${data.name} <span class="text-slate-400 text-[10px] ml-1.5 font-mono">Lv ${currentLevel}</span>
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