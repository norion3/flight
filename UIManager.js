/**
 * AI可読性・先祖返り防止コメント:
 * 【ヘッダー戻るボタンへの回帰と画像完全準拠のUI】
 * 履歴317に基づき、不要な白背景やプログレスバーを追加してしまう幻覚を完全に排除しました。
 * 詳細パネル（階層2）からトップ（階層1）へ戻るアクションは、ユーザーが提示した画像の通り、
 * サイドボタンではなくヘッダー左上の「＜ 戻る（btn-cc-back）」に統一・復元しています。
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
                
                document.querySelectorAll('#cc-layer-detail > div').forEach(div => div.classList.add('hidden'));
                
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    const titleText = e.currentTarget.querySelector('.text-sm').innerText;
                    document.getElementById('cc-title').innerText = titleText;
                    
                    // ★修正: 階層移動時にヘッダーの「＜ 戻る」ボタンを表示する
                    const btnCcBack = document.getElementById('btn-cc-back');
                    if (btnCcBack) btnCcBack.classList.remove('hidden');
                    
                    this.ccLayerMain.style.transform = 'translateX(-100%)';
                    this.ccLayerDetail.style.transform = 'translateX(0)';
                }
            });
        });

        // ★修正: ヘッダー左上の戻るボタンイベント
        const btnCcBack = document.getElementById('btn-cc-back');
        if (btnCcBack) {
            btnCcBack.addEventListener('click', () => {
                this.soundManager.playTapSound();
                this._resetControlCenterView();
            });
        }

        // =========================================================
        // 終了確認フローとランキング連携ダミー処理
        // =========================================================
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

                window.gameScorePayload = {
                    timestamp: new Date().toISOString(),
                    finalScore: 1204500,  
                    cash: "$ 12.4M",
                    income: "+$ 45K/s",
                    planes: 2
                };
                console.log("【GRAVITY API (Mock)】スコアデータ保持完了:", window.gameScorePayload);
                
                setTimeout(() => {
                    window.location.reload();
                }, 500);
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
        
        // ★修正: トップに戻ったらヘッダーの「＜ 戻る」ボタンを隠す
        const btnCcBack = document.getElementById('btn-cc-back');
        if (btnCcBack) btnCcBack.classList.add('hidden');
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
                    <span class="text-[11px] text-slate-300 font-mono tracking-wider">-$ 50K</span>
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
        
        // ★修正: 各パネルを閉じた際にヘッダーの「＜ 戻る」も確実に隠す
        const btnCcBack = document.getElementById('btn-cc-back');
        if (btnCcBack) btnCcBack.classList.add('hidden');
        
        this._toggleMainButtons(true);
    }
}