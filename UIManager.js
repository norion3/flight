/**
 * AI可読性・先祖返り防止コメント:
 * 【ライバル画面・4〜6位の洗練された縦型順位バッジレイアウト ＆ 長文トーストの安全な自動縮小・折り返し対応】
 * 1. `updateRivalsPanel` において、4位〜6位の表示を数字（モノスペース太字）と「位」ラベルによる
 * 専用の縦型デザインバッジ（flex-col）へ整形し、1〜3位のメダル絵文字と美しく調和。
 * 2. 期末決算モーダル（showSettlementModal）、突発イベントモーダル、上部HUD（年間客数・累計客数）、
 * 折れ線グラフ描画、各画面の個別最適高さ等の既存機能は100%完全保持。
 * 3. showToast および showWithdrawToast において、テキストが長い場合に画面端に余裕（max-w-[92vw]）を持たせ、
 * 基本は1行（w-fit）、どうしても溢れる場合のみ適切に折り返す（break-words）安全な設計を実装しました。
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
        this.connectingCard = document.getElementById('connecting-card');
        
        this.btnPanelUpgrades = document.getElementById('btn-panel-upgrades');
        this.btnPanelRivals = document.getElementById('btn-panel-rivals');
        this.btnPanelOverview = document.getElementById('btn-panel-overview');
        
        this.panelUpgrades = document.getElementById('panel-upgrades');
        this.panelRivals = document.getElementById('panel-rivals');
        this.panelOverview = document.getElementById('panel-overview');

        this.bottomSheet = document.getElementById('bottom-sheet');
        
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');

        this.hudFunds = document.getElementById('hud-funds');
        this.hudIncome = document.getElementById('hud-income');
        this.hudYear = document.getElementById('hud-year');

        this.graphCanvas = document.getElementById('overview-graph');
        this.graphTabContainer = document.getElementById('graph-tabs');
        this.currentGraphTab = 'funds'; // 'funds', 'income', 'passengers', 'planes', 'satisfaction', 'share'
        this.lastHistoryData = null;
        this.lastCompanies = null;

        this._setupListeners();
        this._initFleetPrices();
        this._initGraphTabs();

        this.toastTimeout = null;
    }

    _setupListeners() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onConnectRequested) this.onConnectRequested();
        });
        
        document.getElementById('btn-cancel-connect').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onRouteCanceled) this.onRouteCanceled();
        });

        document.getElementById('btn-confirm-route').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed('add');
        });
        
        document.getElementById('btn-remove-route').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed('remove');
        });
        
        document.getElementById('btn-cancel-route').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onRouteCanceled) this.onRouteCanceled();
        });

        this.fabBuy.addEventListener('click', () => {
            this.soundManager.playTapSound();
            this.toggleBuyMenu();
        });

        document.getElementById('btn-buy-small').addEventListener('click', () => { this._handleBuyPlane('small'); });
        document.getElementById('btn-buy-medium').addEventListener('click', () => { this._handleBuyPlane('medium'); });
        document.getElementById('btn-buy-large').addEventListener('click', () => { this._handleBuyPlane('large'); });
        document.getElementById('btn-buy-super').addEventListener('click', () => { this._handleBuyPlane('super'); });

        document.getElementById('btn-sell-small').addEventListener('click', () => { this._handleSellPlane('small'); });
        document.getElementById('btn-sell-medium').addEventListener('click', () => { this._handleSellPlane('medium'); });
        document.getElementById('btn-sell-large').addEventListener('click', () => { this._handleSellPlane('large'); });
        document.getElementById('btn-sell-super').addEventListener('click', () => { this._handleSellPlane('super'); });

        this.btnZoomIn.addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onZoomIn) this.onZoomIn();
        });
        
        this.btnZoomOut.addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (this.onZoomOut) this.onZoomOut();
        });

        this.btnPanelUpgrades.addEventListener('click', () => this.switchPanel('upgrades'));
        this.btnPanelRivals.addEventListener('click', () => this.switchPanel('rivals'));
        this.btnPanelOverview.addEventListener('click', () => this.switchPanel('overview'));
    }

    _initFleetPrices() {
        const typeKeys = ['small', 'medium', 'large', 'super'];
        typeKeys.forEach(type => {
            const conf = CONFIG.ECONOMY.PLANES[type];
            if (conf) {
                const priceEl = document.getElementById(`price-${type}`);
                if (priceEl) priceEl.innerText = this._formatMoneyShort(conf.cost);
            }
        });
    }

    _initGraphTabs() {
        const tabs = [
            { id: 'funds', label: '資産', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'income', label: '収益', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'passengers', label: '客数', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'planes', label: '機体数', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
            { id: 'satisfaction', label: '満足度', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'share', label: 'シェア', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' }
        ];

        this.graphTabContainer.innerHTML = '';
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors border ${
                this.currentGraphTab === tab.id 
                ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`;
            btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${tab.icon}"></path>
                </svg>
                <span class="text-[9px] font-bold">${tab.label}</span>
            `;
            btn.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this.currentGraphTab = tab.id;
                this._updateGraphTabUI();
                if (this.onGraphTabChanged) this.onGraphTabChanged();
            });
            this.graphTabContainer.appendChild(btn);
        });
    }

    _updateGraphTabUI() {
        Array.from(this.graphTabContainer.children).forEach((btn, index) => {
            const tabs = ['funds', 'income', 'passengers', 'planes', 'satisfaction', 'share'];
            const tabId = tabs[index];
            if (this.currentGraphTab === tabId) {
                btn.className = 'flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors border bg-emerald-900/50 border-emerald-500/50 text-emerald-400';
            } else {
                btn.className = 'flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors border bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-700/50 hover:text-slate-200';
            }
        });
    }

    _handleBuyPlane(type) {
        this.soundManager.playTapSound();
        if (this.onBuyPlane) this.onBuyPlane(type);
    }

    _handleSellPlane(type) {
        this.soundManager.playTapSound();
        if (this.onSellPlane) this.onSellPlane(type);
    }

    updateHUD(funds, income, year, isAnnualUpdate = false) {
        const prevFunds = parseFloat(this.hudFunds.innerText.replace(/[^0-9.-]+/g,"")) * 1000000;
        
        this.hudFunds.innerText = this._formatMoneyShort(funds);
        this.hudIncome.innerText = (income >= 0 ? '+' : '') + this._formatMoneyShort(income) + '/s';
        
        if (income >= 0) {
            this.hudIncome.classList.remove('text-rose-400');
            this.hudIncome.classList.add('text-emerald-400');
        } else {
            this.hudIncome.classList.remove('text-emerald-400');
            this.hudIncome.classList.add('text-rose-400');
        }

        if (this.hudYear.innerText !== `Year ${year}`) {
            this.hudYear.innerText = `Year ${year}`;
            this.hudYear.classList.add('text-emerald-400', 'scale-110');
            setTimeout(() => {
                this.hudYear.classList.remove('text-emerald-400', 'scale-110');
            }, 500);
        }

        if (isAnnualUpdate && Math.abs(funds - prevFunds) > 100000) {
            const deltaEl = document.createElement('div');
            const diff = funds - prevFunds;
            deltaEl.innerText = (diff >= 0 ? '+' : '') + this._formatMoneyShort(diff);
            deltaEl.className = `absolute -bottom-5 right-0 text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'} opacity-0 transition-all duration-1000`;
            this.hudFunds.parentElement.appendChild(deltaEl);
            
            setTimeout(() => {
                deltaEl.classList.remove('opacity-0', '-bottom-5');
                deltaEl.classList.add('opacity-100', '-bottom-1');
                
                setTimeout(() => {
                    deltaEl.classList.remove('opacity-100');
                    deltaEl.classList.add('opacity-0');
                    setTimeout(() => deltaEl.remove(), 1000);
                }, 2000);
            }, 50);
        }
    }

    showAirportInfo(data, currConns, maxConns) {
        this.hideAll();
        document.getElementById('info-name').innerText = data.name;
        document.getElementById('info-country').innerText = data.country;
        
        let typeStr = "Local";
        if (data.type === 'major') typeStr = "Major Hub";
        if (data.type === 'fictional') typeStr = "Outpost";
        
        document.getElementById('info-type').innerText = typeStr;
        document.getElementById('info-conns').innerText = `${currConns} / ${maxConns}`;
        
        const btnConnect = document.getElementById('btn-connect');
        if (currConns >= maxConns) {
            btnConnect.disabled = true;
            btnConnect.classList.add('opacity-50', 'cursor-not-allowed');
            btnConnect.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                枠が満杯です
            `;
        } else {
            btnConnect.disabled = false;
            btnConnect.classList.remove('opacity-50', 'cursor-not-allowed');
            btnConnect.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                航路を開拓
            `;
        }

        this.infoCard.classList.remove('translate-y-full');
    }

    setConnectingMode() {
        this.hideAll();
        this.connectingCard.classList.remove('-translate-y-full');
    }

    showRouteConfirm(origin, dest, isConnected, routeCost, currentFunds) {
        this.hideAll();
        document.getElementById('route-origin').innerText = origin.id;
        document.getElementById('route-dest').innerText = dest.id;
        
        const costEl = document.getElementById('route-cost');
        const btnConfirm = document.getElementById('btn-confirm-route');
        const btnRemove = document.getElementById('btn-remove-route');
        const refundInfo = document.getElementById('route-refund-info');

        if (isConnected) {
            costEl.innerText = "就航済みの路線です";
            costEl.classList.remove('text-slate-300', 'text-rose-400');
            costEl.classList.add('text-emerald-400');
            btnConfirm.classList.add('hidden');
            btnRemove.classList.remove('hidden');
            refundInfo.classList.remove('hidden');
            refundInfo.innerText = `（廃止時 50%返還: +${this._formatMoneyShort(Math.floor(routeCost * 0.5))}）`;
        } else {
            costEl.innerText = `コスト: ${this._formatMoneyShort(routeCost)}`;
            costEl.classList.remove('text-emerald-400');
            
            if (currentFunds >= routeCost) {
                costEl.classList.add('text-slate-300');
                costEl.classList.remove('text-rose-400');
                btnConfirm.disabled = false;
                btnConfirm.classList.remove('opacity-50');
            } else {
                costEl.classList.add('text-rose-400');
                costEl.classList.remove('text-slate-300');
                btnConfirm.disabled = true;
                btnConfirm.classList.add('opacity-50');
            }
            
            btnConfirm.classList.remove('hidden');
            btnRemove.classList.add('hidden');
            refundInfo.classList.add('hidden');
        }

        this.routeCard.classList.remove('translate-y-full');
    }

    checkRouteConfirmButton(currentFunds) {
        if (!this.routeCard.classList.contains('translate-y-full')) {
            const btnConfirm = document.getElementById('btn-confirm-route');
            if (!btnConfirm.classList.contains('hidden')) {
                const costText = document.getElementById('route-cost').innerText;
                const costMatch = costText.match(/[\d.]+/);
                if (costMatch) {
                    let costValue = parseFloat(costMatch[0]);
                    if (costText.includes('B')) costValue *= 1000000000;
                    else if (costText.includes('M')) costValue *= 1000000;
                    else if (costText.includes('K')) costValue *= 1000;

                    const costEl = document.getElementById('route-cost');
                    if (currentFunds >= costValue) {
                        btnConfirm.disabled = false;
                        btnConfirm.classList.remove('opacity-50');
                        costEl.classList.add('text-slate-300');
                        costEl.classList.remove('text-rose-400');
                    } else {
                        btnConfirm.disabled = true;
                        btnConfirm.classList.add('opacity-50');
                        costEl.classList.add('text-rose-400');
                        costEl.classList.remove('text-slate-300');
                    }
                }
            }
        }
    }

    toggleBuyMenu() {
        if (this.buyMenu.classList.contains('translate-y-full')) {
            this.hideAllCards();
            if (this.onFleetMenuOpen) this.onFleetMenuOpen();
            this.buyMenu.classList.remove('translate-y-full');
            this.fabBuy.classList.add('bg-emerald-600', 'rotate-45');
            this.fabBuy.classList.remove('bg-emerald-500');
        } else {
            this.buyMenu.classList.add('translate-y-full');
            this.fabBuy.classList.remove('bg-emerald-600', 'rotate-45');
            this.fabBuy.classList.add('bg-emerald-500');
        }
    }

    updateFleetPanel(counts) {
        document.getElementById('count-small').innerText = counts.small || 0;
        document.getElementById('count-medium').innerText = counts.medium || 0;
        document.getElementById('count-large').innerText = counts.large || 0;
        document.getElementById('count-super').innerText = counts.super || 0;

        const disableSell = (id, count) => {
            const btn = document.getElementById(id);
            if (count > 0) {
                btn.disabled = false;
                btn.classList.remove('opacity-30', 'cursor-not-allowed');
                btn.classList.add('hover:bg-rose-900/50', 'hover:text-rose-400');
            } else {
                btn.disabled = true;
                btn.classList.add('opacity-30', 'cursor-not-allowed');
                btn.classList.remove('hover:bg-rose-900/50', 'hover:text-rose-400');
            }
        };

        disableSell('btn-sell-small', counts.small || 0);
        disableSell('btn-sell-medium', counts.medium || 0);
        disableSell('btn-sell-large', counts.large || 0);
        disableSell('btn-sell-super', counts.super || 0);
    }

    showToast(message, type = 'info') {
        const icon = document.getElementById('toast-icon');
        const msg = document.getElementById('toast-message');
        
        msg.innerText = message;
        
        // ★長文対応: whitespace-nowrapを外し、w-fitとmax-w-[92vw]で「基本1行・限界時のみ折り返し」を実現
        msg.className = "text-xs font-bold break-words";
        this.toast.className = "fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border opacity-0 pointer-events-none transition-opacity duration-300 z-50 flex items-center gap-2 w-fit max-w-[92vw] sm:max-w-[80vw] text-center";

        if (type === 'success') {
            this.toast.classList.add('bg-emerald-900/90', 'border-emerald-500', 'text-emerald-100');
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
            icon.classList.add('text-emerald-400');
        } else if (type === 'error') {
            this.toast.classList.add('bg-rose-900/90', 'border-rose-500', 'text-rose-100');
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            icon.classList.add('text-rose-400');
        } else {
            this.toast.classList.add('bg-slate-900/90', 'border-slate-500', 'text-slate-100');
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
            icon.classList.add('text-slate-400');
        }

        this.toast.classList.remove('opacity-0');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.add('opacity-0');
            setTimeout(() => {
                this.toast.className = "fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border opacity-0 pointer-events-none transition-opacity duration-300 z-50 flex items-center gap-2 w-fit max-w-[92vw] sm:max-w-[80vw] text-center";
            }, 300);
        }, 3000);
    }

    showWithdrawToast(message, companyId) {
        const icon = document.getElementById('toast-icon');
        const msg = document.getElementById('toast-message');
        
        msg.innerText = message;
        
        // ★長文対応
        msg.className = "text-xs font-bold break-words";
        this.toast.className = "fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border opacity-0 pointer-events-none transition-opacity duration-300 z-50 flex items-center gap-2 w-fit max-w-[92vw] sm:max-w-[80vw] text-center";

        const company = CONFIG.COMPANIES.find(c => c.id === companyId);
        let hexColor = '#94a3b8';
        if (company) {
            hexColor = '#' + company.routeColor.toString(16).padStart(6, '0');
        }
        
        this.toast.style.backgroundColor = 'rgba(15, 23, 42, 0.95)'; 
        this.toast.style.borderColor = hexColor;
        this.toast.style.color = '#f8fafc';
        
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
        icon.style.color = hexColor;

        this.toast.classList.remove('opacity-0');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.add('opacity-0');
            setTimeout(() => {
                this.toast.style.backgroundColor = '';
                this.toast.style.borderColor = '';
                this.toast.style.color = '';
                icon.style.color = '';
            }, 300);
        }, 4500); 
    }

    hideAllCards() {
        this.infoCard.classList.add('translate-y-full');
        this.routeCard.classList.add('translate-y-full');
        this.connectingCard.classList.add('-translate-y-full');
    }

    hideAll() {
        this.hideAllCards();
        this.buyMenu.classList.add('translate-y-full');
        this.fabBuy.classList.remove('bg-emerald-600', 'rotate-45');
        this.fabBuy.classList.add('bg-emerald-500');
        this.hideBottomSheet();
    }

    updateZoomButtonsState(canZoomIn, canZoomOut) {
        if (canZoomIn) {
            this.btnZoomIn.classList.remove('opacity-30', 'cursor-not-allowed');
        } else {
            this.btnZoomIn.classList.add('opacity-30', 'cursor-not-allowed');
        }
        
        if (canZoomOut) {
            this.btnZoomOut.classList.remove('opacity-30', 'cursor-not-allowed');
        } else {
            this.btnZoomOut.classList.add('opacity-30', 'cursor-not-allowed');
        }
    }

    _formatMoneyShort(value) {
        const absVal = Math.abs(value);
        if (absVal >= 1000000000) return `$ ${(value / 1000000000).toFixed(1)}B`;
        if (absVal >= 1000000) return `$ ${(value / 1000000).toFixed(1)}M`;
        if (absVal >= 1000) return `$ ${Math.floor(value / 1000)}K`;
        return `$ ${Math.floor(value)}`;
    }

    switchPanel(panelId) {
        this.soundManager.playTapSound();
        this.hideAllCards();
        
        const isCurrentlyOpen = !this.bottomSheet.classList.contains('translate-y-full') && 
                                !document.getElementById(`panel-${panelId}`).classList.contains('hidden');

        this.panelUpgrades.classList.add('hidden');
        this.panelRivals.classList.add('hidden');
        this.panelOverview.classList.add('hidden');
        
        this.btnPanelUpgrades.classList.remove('text-emerald-400');
        this.btnPanelRivals.classList.remove('text-emerald-400');
        this.btnPanelOverview.classList.remove('text-emerald-400');

        if (isCurrentlyOpen) {
            this.hideBottomSheet();
        } else {
            const targetPanel = document.getElementById(`panel-${panelId}`);
            targetPanel.classList.remove('hidden');
            
            // パネルごとに最適な高さを設定
            let targetHeight = '410px';
            if (panelId === 'rivals') targetHeight = '450px';
            if (panelId === 'upgrades') targetHeight = '410px';
            if (panelId === 'overview') targetHeight = '540px';
            
            this.bottomSheet.style.height = targetHeight;
            this.bottomSheet.classList.remove('translate-y-full');

            if (panelId === 'upgrades') this.btnPanelUpgrades.classList.add('text-emerald-400');
            if (panelId === 'rivals') this.btnPanelRivals.classList.add('text-emerald-400');
            if (panelId === 'overview') this.btnPanelOverview.classList.add('text-emerald-400');

            if (this.onPanelOpened) this.onPanelOpened(`panel-${panelId}`);
        }
    }

    hideBottomSheet() {
        this.bottomSheet.classList.add('translate-y-full');
        this.btnPanelUpgrades.classList.remove('text-emerald-400');
        this.btnPanelRivals.classList.remove('text-emerald-400');
        this.btnPanelOverview.classList.remove('text-emerald-400');
    }

    isRivalsPanelOpen() {
        return !this.bottomSheet.classList.contains('translate-y-full') && !this.panelRivals.classList.contains('hidden');
    }

    isOverviewPanelOpen() {
        return !this.bottomSheet.classList.contains('translate-y-full') && !this.panelOverview.classList.contains('hidden');
    }

    updateUpgradePanel(upgradeManager, currentFunds) {
        this.panelUpgrades.innerHTML = '';
        
        for (const key in UPGRADE_DATA) {
            const data = UPGRADE_DATA[key];
            const currentLevel = upgradeManager.getCurrentLevel(key);
            const currentStep = upgradeManager.getCurrentStep(key);
            const maxLevel = upgradeManager.getMaxLevel(key);
            
            const nextCost = upgradeManager.getNextCost(key);
            const isMax = currentLevel >= maxLevel;
            const canAfford = !isMax && currentFunds >= nextCost;

            let stepDots = '';
            if (!isMax) {
                const totalSteps = 5; 
                for (let i = 0; i < totalSteps; i++) {
                    const isFilled = i < currentStep;
                    stepDots += `<div class="w-2 h-2 rounded-full ${isFilled ? 'bg-emerald-400' : 'bg-slate-700'}"></div>`;
                }
            }

            let nextCostStr = isMax ? 'MAX' : `Cost: ${this._formatMoneyShort(nextCost)}`;
            let buttonClass = isMax 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' 
                : canAfford 
                    ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50 hover:bg-emerald-800/50' 
                    : 'bg-slate-800/50 text-rose-400 border-rose-900/50 cursor-not-allowed opacity-70';

            const itemHtml = `
                <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-2 relative overflow-hidden">
                    ${isMax ? '<div class="absolute inset-0 bg-slate-950/40 pointer-events-none"></div>' : ''}
                    <div class="flex justify-between items-center z-10">
                        <div>
                            <div class="text-sm font-bold text-slate-200">${data.name}</div>
                            <div class="text-[10px] text-slate-400 font-mono">Level ${currentLevel} <span class="text-slate-600">/</span> ${maxLevel}</div>
                        </div>
                        <button id="btn-upg-${key}" class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${buttonClass}" ${isMax || !canAfford ? 'disabled' : ''}>
                            ${isMax ? '完了' : '投資'}
                        </button>
                    </div>
                    
                    ${!isMax ? `
                    <div class="flex justify-between items-center z-10 mt-1">
                        <div class="flex gap-1">
                            ${stepDots}
                        </div>
                        <div class="text-[10px] font-mono ${canAfford ? 'text-emerald-400/80' : 'text-rose-400/80'}">${nextCostStr}</div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const div = document.createElement('div');
            div.innerHTML = itemHtml;
            this.panelUpgrades.appendChild(div.firstElementChild);

            const btn = document.getElementById(`btn-upg-${key}`);
            if (btn && !isMax && canAfford) {
                btn.addEventListener('click', () => {
                    if (this.onUpgradeRequested) this.onUpgradeRequested(key);
                });
            }
        }
    }

    updateRivalsPanel(stats) {
        this.panelRivals.innerHTML = '';
        
        stats.forEach((stat, index) => {
            let rankBadge = '';
            let medalColor = '';
            
            if (index === 0) {
                rankBadge = '🥇';
                medalColor = 'text-yellow-400';
            } else if (index === 1) {
                rankBadge = '🥈';
                medalColor = 'text-slate-300';
            } else if (index === 2) {
                rankBadge = '🥉';
                medalColor = 'text-amber-600';
            } else {
                // ★4〜6位の専用デザイン（数字＋「位」の縦型レイアウト）
                rankBadge = `
                    <div class="flex flex-col items-center justify-center leading-none">
                        <span class="text-base font-mono font-bold text-slate-400">${index + 1}</span>
                        <span class="text-[8px] text-slate-500 font-bold -mt-0.5">位</span>
                    </div>
                `;
                medalColor = 'text-slate-500';
            }

            const isPlayer = stat.isPlayer;
            const bgClass = isPlayer ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-slate-900/80 border-slate-700/50';
            const nameColor = isPlayer ? 'text-emerald-400' : 'text-slate-200';
            const shareColor = isPlayer ? 'text-emerald-400' : 'text-slate-300';
            
            const companyColorHex = isPlayer ? '#34d399' : (CONFIG.COMPANIES.find(c => c.id === stat.id)?.routeColor.toString(16).padStart(6, '0') || 'ffffff');

            const itemHtml = `
                <div class="${bgClass} p-2 rounded-xl border flex items-center gap-3 relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1 opacity-80" style="background-color: #${companyColorHex}"></div>
                    
                    <div class="w-8 flex justify-center items-center text-xl pl-1 ${medalColor}">
                        ${rankBadge}
                    </div>
                    
                    <div class="flex-1 flex flex-col gap-0.5">
                        <div class="text-xs font-bold ${nameColor} flex items-center gap-1.5">
                            ${stat.name}
                            ${isPlayer ? '<span class="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">自社</span>' : ''}
                        </div>
                        <div class="flex gap-3 text-[9px] text-slate-400 font-mono">
                            <div class="flex items-center gap-0.5" title="機体数">
                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                                ${stat.planeCount}
                            </div>
                            <div class="flex items-center gap-0.5" title="路線数">
                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                ${stat.routeCount}
                            </div>
                            <div class="flex items-center gap-0.5" title="総資産">
                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                ${this._formatMoneyShort(stat.assetValue)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1 min-w-[50px]">
                        <div class="text-[8px] text-slate-500 font-bold mb--1">世界シェア</div>
                        <div class="text-sm font-mono font-bold ${shareColor}">${(stat.globalShare * 100).toFixed(1)}<span class="text-[9px] text-slate-400 ml-0.5">%</span></div>
                    </div>
                </div>
            `;
            
            const div = document.createElement('div');
            div.innerHTML = itemHtml;
            this.panelRivals.appendChild(div.firstElementChild);
        });
    }

    updateOverviewPanel(historyData, companies) {
        this.lastHistoryData = historyData;
        this.lastCompanies = companies;

        if (!historyData || historyData.length === 0) return;

        const currentData = historyData[historyData.length - 1];
        if (!currentData || !currentData.player) return;

        let playerValue = 0;
        let aiMaxValue = 0;
        let aiMaxId = null;

        for (const compId in currentData) {
            const d = currentData[compId];
            let val = 0;
            switch(this.currentGraphTab) {
                case 'funds': val = d.funds; break;
                case 'income': val = d.income; break;
                case 'passengers': val = d.passengers; break;
                case 'planes': val = d.planes; break;
                case 'satisfaction': val = d.satisfaction; break;
                case 'share': val = d.share; break;
            }

            if (compId === 'player') {
                playerValue = val;
            } else {
                if (val > aiMaxValue) {
                    aiMaxValue = val;
                    aiMaxId = compId;
                }
            }
        }

        const statsContainer = document.getElementById('overview-current-stats');
        statsContainer.innerHTML = '';

        let titleStr = "";
        let formatFn = (v) => v;

        switch(this.currentGraphTab) {
            case 'funds':
                titleStr = "総資産額";
                formatFn = (v) => this._formatMoneyShort(v);
                break;
            case 'income':
                titleStr = "推定月収";
                formatFn = (v) => this._formatMoneyShort(v);
                break;
            case 'passengers':
                titleStr = "年間客数";
                formatFn = (v) => this._formatMoneyShort(v).replace('$', '') + '人';
                break;
            case 'planes':
                titleStr = "運航機材数";
                formatFn = (v) => Math.floor(v) + ' 機';
                break;
            case 'satisfaction':
                titleStr = "顧客満足度";
                formatFn = (v) => Math.floor(v) + ' pt';
                break;
            case 'share':
                titleStr = "世界シェア";
                formatFn = (v) => (v * 100).toFixed(1) + '%';
                break;
        }

        const barHtml = this._createComparisonBar(titleStr, playerValue, aiMaxValue, formatFn);
        statsContainer.innerHTML = barHtml;

        this._drawGraph(historyData, companies);
    }

    _createComparisonBar(title, playerVal, rivalVal, formatFn) {
        const playerDisplay = formatFn(playerVal);
        const rivalDisplay = formatFn(rivalVal);

        const maxVal = Math.max(playerVal, rivalVal);
        const pPct = maxVal > 0.0001 ? Math.min(100, Math.max(0, (playerVal / maxVal) * 100)) : 0;
        const rPct = maxVal > 0.0001 ? Math.min(100, Math.max(0, (rivalVal / maxVal) * 100)) : 0;

        return `
        <div>
            <div class="flex justify-between text-[10px] font-bold mb-1.5">
                <span class="text-slate-300">${title}</span>
                <span class="font-mono text-slate-200">自社 ${playerDisplay} <span class="text-slate-600 font-normal mx-0.5">/</span> 他社 ${rivalDisplay}</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-slate-500 w-6">自社</span>
                    <div class="flex-1 bg-slate-950/80 border border-slate-700/50 rounded-full h-1.5 overflow-hidden flex shadow-inner">
                        <div class="h-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)] transition-all duration-500" style="width: ${pPct}%"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-slate-500 w-6">他社</span>
                    <div class="flex-1 bg-slate-950/80 border border-slate-700/50 rounded-full h-1.5 overflow-hidden flex shadow-inner">
                        <div class="h-full bg-slate-400 shadow-[0_0_5px_rgba(148,163,184,0.3)] transition-all duration-500" style="width: ${rPct}%"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    _drawGraph(historyData, companies) {
        const svg = document.getElementById('graph-svg');
        const xTicks = document.getElementById('graph-x-ticks');
        const xLabels = document.getElementById('graph-x-labels');
        
        const w = this.graphCanvas.clientWidth;
        const h = this.graphCanvas.clientHeight;
        
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        
        const paths = svg.querySelectorAll('.graph-line');
        paths.forEach(p => p.remove());
        xTicks.innerHTML = '';
        xLabels.innerHTML = '';

        if (historyData.length < 2) return;

        let maxVal = 0.0001;
        let minVal = 0;
        
        if (this.currentGraphTab === 'income') {
            minVal = 999999999999;
        }

        historyData.forEach(data => {
            companies.forEach(comp => {
                if (!data[comp.id]) return;
                
                let val = 0;
                switch(this.currentGraphTab) {
                    case 'funds': val = data[comp.id].funds; break;
                    case 'income': val = data[comp.id].income; break;
                    case 'passengers': val = data[comp.id].passengers; break;
                    case 'planes': val = data[comp.id].planes; break;
                    case 'satisfaction': val = data[comp.id].satisfaction; break;
                    case 'share': val = data[comp.id].share; break;
                }
                if (val > maxVal) maxVal = val;
                
                if (this.currentGraphTab === 'income' && val < minVal) {
                    minVal = val;
                }
            });
        });

        if (this.currentGraphTab !== 'income') {
            minVal = 0;
        }

        if (minVal > 0) minVal = 0; 
        
        maxVal = maxVal * 1.1; 
        const range = maxVal - minVal;

        const maxPoints = 24; 
        let displayData = historyData;
        if (historyData.length > maxPoints) {
            displayData = historyData.slice(historyData.length - maxPoints);
        }

        const pX = (index) => {
            if (displayData.length <= 1) return 0;
            return (index / (displayData.length - 1)) * w;
        };

        const pY = (val) => {
            if (range === 0) return h;
            const normalized = (val - minVal) / range;
            return h - (normalized * h);
        };

        if (minVal < 0) {
            const zeroY = pY(0);
            const zeroLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            zeroLine.setAttribute('x1', 0);
            zeroLine.setAttribute('y1', zeroY);
            zeroLine.setAttribute('x2', w);
            zeroLine.setAttribute('y2', zeroY);
            zeroLine.setAttribute('stroke', '#334155');
            zeroLine.setAttribute('stroke-width', '1');
            zeroLine.setAttribute('stroke-dasharray', '4 4');
            zeroLine.classList.add('graph-line');
            svg.appendChild(zeroLine);
        }

        companies.forEach(comp => {
            const points = [];
            displayData.forEach((data, i) => {
                if (!data[comp.id]) return;
                let val = 0;
                switch(this.currentGraphTab) {
                    case 'funds': val = data[comp.id].funds; break;
                    case 'income': val = data[comp.id].income; break;
                    case 'passengers': val = data[comp.id].passengers; break;
                    case 'planes': val = data[comp.id].planes; break;
                    case 'satisfaction': val = data[comp.id].satisfaction; break;
                    case 'share': val = data[comp.id].share; break;
                }
                points.push({ x: pX(i), y: pY(val) });
            });

            if (points.length > 1) {
                let d = `M ${points[0].x},${points[0].y}`;
                
                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const cx = (p0.x + p1.x) / 2;
                    d += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
                }

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                
                const hexColor = '#' + comp.routeColor.toString(16).padStart(6, '0');
                path.setAttribute('stroke', hexColor);
                path.setAttribute('stroke-width', comp.id === 'player' ? '2.5' : '1.5');
                path.setAttribute('stroke-linecap', 'round');
                
                if (comp.id !== 'player') {
                    path.setAttribute('opacity', '0.6');
                } else {
                    const indicator = document.getElementById('graph-player-indicator');
                    if (indicator && points.length > 0) {
                        const lastP = points[points.length - 1];
                        indicator.setAttribute('cx', lastP.x);
                        indicator.setAttribute('cy', lastP.y);
                        indicator.classList.remove('opacity-0');
                    }
                }
                
                path.classList.add('graph-line');
                svg.appendChild(path);
            }
        });

        const numLabels = Math.min(6, displayData.length);
        for (let i = 0; i < numLabels; i++) {
            const index = Math.floor(i * (displayData.length - 1) / Math.max(1, (numLabels - 1)));
            const data = displayData[index];
            if (!data) continue;

            const xPos = pX(index);
            
            const tick = document.createElement('div');
            tick.className = 'absolute top-0 bottom-0 border-l border-slate-700/30';
            tick.style.left = `${xPos}px`;
            xTicks.appendChild(tick);

            const label = document.createElement('div');
            label.className = 'absolute top-0 text-[9px] text-slate-500 font-mono transform -translate-x-1/2';
            label.style.left = `${xPos}px`;
            label.innerText = data.month; 
            xLabels.appendChild(label);
        }
    }

    // Phase 6: 期末決算モーダル制御
    showSettlementModal(settlementData, onNextQuarter, onExitGame) {
        this.soundManager.playNoticeSound();
        this._isSettlementModalOpen = true;

        let modal = document.getElementById('settlement-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settlement-modal';
            modal.className = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm opacity-0 transition-opacity duration-500";
            document.body.appendChild(modal);
        }

        const isBlack = settlementData.netIncome >= 0;
        const colorClass = isBlack ? 'text-emerald-400' : 'text-rose-400';
        const sign = isBlack ? '+' : '';

        modal.innerHTML = `
            <div class="bg-slate-900 border ${isBlack ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]'} rounded-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform duration-500" id="settlement-content">
                
                <div class="bg-slate-950/80 p-4 border-b border-slate-800 text-center relative">
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <div class="absolute -top-10 -right-10 w-32 h-32 ${isBlack ? 'bg-emerald-500/10' : 'bg-rose-500/10'} rounded-full blur-2xl"></div>
                    </div>
                    <div class="text-xs text-slate-400 font-bold mb-1">年度末 決算報告</div>
                    <div class="text-xl font-bold ${colorClass}">Year ${settlementData.year} 終了</div>
                </div>

                <div class="p-5 flex flex-col gap-4">
                    <div class="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                        <div class="text-[10px] text-slate-500 font-bold mb-2">当期 最終利益</div>
                        <div class="text-2xl font-mono font-bold ${colorClass} text-right">
                            ${sign}${this._formatMoneyShort(settlementData.netIncome)}
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800/30">
                            <div class="text-[9px] text-slate-500 mb-1">総売上</div>
                            <div class="text-sm font-mono text-slate-300">${this._formatMoneyShort(settlementData.grossIncome)}</div>
                        </div>
                        <div class="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800/30">
                            <div class="text-[9px] text-slate-500 mb-1">維持費・経費</div>
                            <div class="text-sm font-mono text-slate-300">-${this._formatMoneyShort(settlementData.upkeep)}</div>
                        </div>
                        <div class="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800/30">
                            <div class="text-[9px] text-slate-500 mb-1">年間輸送客数</div>
                            <div class="text-sm font-mono text-emerald-400 font-bold">${this._formatMoneyShort(settlementData.yearlyPassengers).replace('$', '')} 人</div>
                        </div>
                        <div class="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800/30">
                            <div class="text-[9px] text-slate-500 mb-1">最高記録 (ハイスコア)</div>
                            <div class="text-sm font-mono text-amber-400">${this._formatMoneyShort(settlementData.bestPassengers).replace('$', '')} 人</div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <button id="btn-settle-next" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg">
                            次期へ進む (Year ${settlementData.year + 1})
                        </button>
                        <button id="btn-settle-exit" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 transition-colors">
                            経営を終了して再起動
                        </button>
                    </div>
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('settlement-content').classList.remove('scale-95');
        });

        document.getElementById('btn-settle-next').addEventListener('click', () => {
            this.soundManager.playTapSound();
            modal.classList.add('opacity-0');
            document.getElementById('settlement-content').classList.add('scale-95');
            setTimeout(() => {
                modal.remove();
                this._isSettlementModalOpen = false;
                if (onNextQuarter) onNextQuarter();
            }, 500);
        });

        document.getElementById('btn-settle-exit').addEventListener('click', () => {
            this.soundManager.playTapSound();
            if (onExitGame) onExitGame();
        });
    }

    isSettlementModalOpen() {
        return this._isSettlementModalOpen === true;
    }

    showEventModal(eventData, onOptionSelected) {
        this.soundManager.playNoticeSound();

        let modal = document.getElementById('event-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal';
            modal.className = "fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md opacity-0 transition-opacity duration-300";
            document.body.appendChild(modal);
        }

        let optionsHtml = '';
        eventData.options.forEach((opt, index) => {
            const cost = opt.getCost(eventData.ctx);
            let costStr = '';
            if (cost > 0) {
                costStr = `<span class="text-rose-400 font-mono ml-2">-${this._formatMoneyShort(cost)}</span>`;
            } else if (cost < 0) {
                costStr = `<span class="text-emerald-400 font-mono ml-2">+${this._formatMoneyShort(Math.abs(cost))}</span>`;
            }

            optionsHtml += `
                <button data-index="${index}" class="event-option-btn w-full text-left p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500 transition-colors flex justify-between items-center group">
                    <span class="text-sm font-bold text-slate-200 group-hover:text-white">${opt.text}</span>
                    ${costStr}
                </button>
            `;
        });

        modal.innerHTML = `
            <div class="bg-slate-900 border border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] rounded-2xl w-full max-w-sm overflow-hidden transform scale-95 transition-transform duration-300" id="event-content">
                <div class="bg-indigo-950/80 p-4 border-b border-indigo-900/50 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <div class="text-[10px] text-indigo-300 font-bold mb-0.5">経営判断イベント</div>
                        <div class="text-base font-bold text-white leading-tight">${eventData.title}</div>
                    </div>
                </div>
                <div class="p-5">
                    <p class="text-sm text-slate-300 mb-6 leading-relaxed">${eventData.description}</p>
                    <div class="flex flex-col gap-3">
                        ${optionsHtml}
                    </div>
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('event-content').classList.remove('scale-95');
        });

        const btns = modal.querySelectorAll('.event-option-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playTapSound();
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                const selectedOption = eventData.options[index];
                
                modal.classList.add('opacity-0');
                document.getElementById('event-content').classList.add('scale-95');
                
                setTimeout(() => {
                    modal.remove();
                    if (onOptionSelected) onOptionSelected(selectedOption);
                }, 300);
            });
        });
    }
}