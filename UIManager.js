/**
 * AI可読性・先祖返り防止コメント:
 * 【プロシージャル・サウンドシステムの統合】
 * 履歴302に基づき、SoundManagerをインポートし、各種UI操作にサウンドをバインドしました。
 * 1. 音量ボタン（btn-sound）でミュートON/OFFを切り替え、SVGアイコンを動的に変更する処理を追加しました。
 * 2. ほとんどのボタン押下時に `playTapSound` (ポッ) を鳴らします。
 * 3. 警告時(Toast)には `playWarningSound` (ププッ) を鳴らします。
 * 4. ポップアップ展開時やアクション成功時には `playEventSound` や `playSuccessSound` を適宜呼び出し、
 * 耳に心地よい、ゲーム体験を邪魔しない音響設計を実現しています。
 */

import { SoundManager } from './SoundManager.js';

export class UIManager {
    constructor() {
        // ★追加: サウンドマネージャーの初期化（デフォルトはミュート）
        this.soundManager = new SoundManager();

        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
        this.connectingCard = document.getElementById('connecting-mode-card'); 
        
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
        
        this.currentRouteAction = null; 

        this._bindEvents();
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
            // アクション（開拓・廃止）の実行時は心地よい成功音を鳴らす
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
                this.soundManager.playSuccessSound(); // 購入アクション時
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
            });
        });

        document.querySelectorAll('.sell-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.playSuccessSound(); // 売却アクション時
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
            });
        }

        // =========================================================
        // ★追加: サウンドボタン（ミュートのトグル切り替え）
        // =========================================================
        if (this.btnSound) {
            this.btnSound.addEventListener('click', () => {
                const isMuted = this.soundManager.toggleMute();
                if (isMuted) {
                    // ミュートアイコン（斜線）に変更し、色をグレーにする
                    this.btnSound.innerHTML = `
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <line x1="23" y1="1" x2="1" y2="23"></line>
                        </svg>`;
                    this.btnSound.classList.replace('text-emerald-400', 'text-slate-300');
                    this.btnSound.classList.replace('border-emerald-500/50', 'border-slate-600/50');
                } else {
                    // 音ありアイコンに変更し、色をアクティブなエメラルドにする
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

        // =========================================================
        // コントロールセンターのイベント
        // =========================================================

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
                
                document.querySelectorAll('#cc-layer-detail > div > div').forEach(div => div.classList.add('hidden'));
                
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

        // =========================================================
        // 上部ステータスHUDのON/OFFトグル処理
        // =========================================================
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

    // ★修正: トースト表示時（主にエラーや警告）にはププッという警告音を鳴らす
    showToast(message) {
        this.soundManager.playWarningSound();
        this.toast.innerText = message;
        this.toast.classList.add('toast-show');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('toast-show');
        }, 2000); 
    }

    // ★修正: 空港情報表示時にはポワーンという柔らかなイベント音を鳴らす
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

    // ★修正: 確認パネル表示時にもポワーンという柔らかなイベント音を鳴らす
    showRouteConfirm(fromData, toData, isConnected) {
        this.soundManager.playEventSound();
        this.connectingCard.classList.remove('show');
        document.getElementById('route-from').innerText = fromData.id;
        document.getElementById('route-to').innerText = toData.id;

        const titleEl = document.getElementById('route-action-title');
        const btnAction = document.getElementById('btn-action-route');

        this.currentRouteAction = isConnected ? 'remove' : 'add';

        if (isConnected) {
            titleEl.innerText = window.APP_LANG.routeRemoveTitle || "空路廃止";
            titleEl.className = "text-xs text-red-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-red-900/20 absolute show";
            btnAction.innerText = window.APP_LANG.btnRemoveRoute || "廃止する";
            btnAction.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:bg-red-500 shadow-lg shadow-red-900/50";
        } else {
            titleEl.innerText = window.APP_LANG.routeOpenTitle || "空路開拓";
            titleEl.className = "text-xs text-yellow-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-yellow-900/20 absolute show";
            btnAction.innerText = window.APP_LANG.btnOpenRoute || "開拓する";
            btnAction.className = "flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-500 shadow-lg shadow-blue-900/50";
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
        
        this._toggleMainButtons(true);
    }
}