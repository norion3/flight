/**
 * AI可読性・先祖返り防止コメント:
 * 【没入感を極める階層型メニューとUI細部の洗練】
 * 履歴300に基づき、以下のUI改修を行いました。
 * 1. 硬い言葉を避け、パネルタイトルを「コントロールセンター」から「メニュー」へ変更しました。
 * 2. 戻るボタンのタップ領域を広く確保し、iOSネイティブアプリのような左右対称のヘッダーレイアウトへ最適化しました。
 * 3. トグルスイッチ（ステータス表示）をONにした際、白い丸が枠内にぴったりと収まるよう、
 * 計算ミスであった translateX(16px) を、正確な距離である translateX(24px) に修正しました。
 * * 【人間工学を極めた「サイド戻るボタン」の導入】
 * 履歴301に基づき、詳細パネル（階層2）での戻るボタン（btn-cc-back）をヘッダーから完全に廃止し、
 * コンテンツエリアの左端（縦全体）を巨大な戻るボタンエリア（btn-side-back）とするレイアウトへ変更しました。
 * これにより、親指を最上部まで伸ばすことなく自然な位置で階層を戻ることが可能になっています。
 */
export class UIManager {
    constructor() {
        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
        this.connectingCard = document.getElementById('connecting-mode-card'); 
        
        // --- 既存の右側ボタン ---
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');
        this.zoomControls = document.getElementById('zoom-controls');

        // --- 新設されたボタンとパネル群 ---
        this.btnHelp = document.getElementById('btn-help');
        this.btnSound = document.getElementById('btn-sound');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.controlCenter = document.getElementById('control-center-panel');
        this.topStatusHud = document.getElementById('top-status-hud');
        
        // 階層スライド用レイヤー
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
            if (this.onConnectRequested) this.onConnectRequested();
        });

        const cancelRoute = () => {
            if (this.onRouteCanceled) this.onRouteCanceled();
            this.hideRouteConfirm();
            this.connectingCard.classList.remove('show');
            this._toggleMainButtons(true);
        };

        document.getElementById('btn-cancel-route').addEventListener('click', cancelRoute);
        document.getElementById('btn-cancel-connect').addEventListener('click', cancelRoute);

        document.getElementById('btn-action-route').addEventListener('click', () => {
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed(this.currentRouteAction);
        });

        // 飛行機ボタン（フリート管理）を開く
        this.fabBuy.addEventListener('click', () => {
            if (this.onFleetMenuOpen) this.onFleetMenuOpen(); 
            this.hideAll();
            this.buyMenu.classList.add('show');
            this._toggleMainButtons(false);
        });

        document.getElementById('btn-close-buy').addEventListener('click', () => {
            this.buyMenu.classList.remove('show');
            this._toggleMainButtons(true);
        });

        const btnCloseInfo = document.getElementById('btn-close-info');
        if (btnCloseInfo) {
            btnCloseInfo.addEventListener('click', () => {
                this.hideAll();
            });
        }

        document.querySelectorAll('.buy-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
            });
        });

        document.querySelectorAll('.sell-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onSellPlane) this.onSellPlane(type);
            });
        });

        if (this.btnZoomIn) {
            this.btnZoomIn.addEventListener('click', () => {
                if (this.onZoomIn) this.onZoomIn();
            });
        }
        if (this.btnZoomOut) {
            this.btnZoomOut.addEventListener('click', () => {
                if (this.onZoomOut) this.onZoomOut();
            });
        }

        // =========================================================
        // コントロールセンター（階層型メニュー）のイベントバインド
        // =========================================================

        // メニューを開く
        if (this.btnMainMenu) {
            this.btnMainMenu.addEventListener('click', () => {
                this.hideAll();
                this.controlCenter.classList.add('show');
                this._toggleMainButtons(false); // 周りのボタンをスッキリ隠す
            });
        }

        // メニューを閉じる
        document.getElementById('btn-close-cc').addEventListener('click', () => {
            this.controlCenter.classList.remove('show');
            this._toggleMainButtons(true);
            
            // 閉じたついでに階層をトップ（Main）に戻しておく
            setTimeout(() => this._resetControlCenterView(), 300);
        });

        // トップ層のリンクボタンを押して、詳細層へスライド遷移する
        document.querySelectorAll('.cc-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                
                // すべての詳細パネルを一度隠す
                document.querySelectorAll('#cc-layer-detail > div > div').forEach(div => div.classList.add('hidden'));
                
                // 目的のパネルだけ表示する
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    
                    // タイトルを書き換える
                    const titleText = e.currentTarget.querySelector('.text-sm').innerText;
                    document.getElementById('cc-title').innerText = titleText;
                    
                    // 【アニメーション】左へスライド
                    this.ccLayerMain.style.transform = 'translateX(-100%)';
                    this.ccLayerDetail.style.transform = 'translateX(0)';
                }
            });
        });

        // ★修正: サイド戻るボタンでトップ層へ「戻る」
        const btnSideBack = document.getElementById('btn-side-back');
        if (btnSideBack) {
            btnSideBack.addEventListener('click', () => {
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
                isHudOn = !isHudOn;
                if (isHudOn) {
                    // スイッチをON（緑）にする
                    btnToggleHud.classList.replace('bg-slate-700', 'bg-emerald-500');
                    hudIndicator.style.transform = 'translateX(24px)';
                    hudIndicator.classList.replace('bg-slate-400', 'bg-white');
                    // HUDを上から降ろす
                    this.topStatusHud.style.transform = 'translateY(0)';
                } else {
                    // スイッチをOFF（グレー）にする
                    btnToggleHud.classList.replace('bg-emerald-500', 'bg-slate-700');
                    hudIndicator.style.transform = 'translateX(0)';
                    hudIndicator.classList.replace('bg-white', 'bg-slate-400');
                    // HUDを上に隠す
                    this.topStatusHud.style.transform = 'translateY(-100%)';
                }
            });
        }
    }

    // 階層メニューのビューをトップに戻すユーティリティ
    _resetControlCenterView() {
        this.ccLayerMain.style.transform = 'translateX(0)';
        this.ccLayerDetail.style.transform = 'translateX(100%)';
        // タイトルを「メニュー」に戻す
        document.getElementById('cc-title').innerText = 'メニュー';
    }

    // 親指ゾーン（Thumb Zone）のボタン群を一括で表示・非表示するユーティリティ
    _toggleMainButtons(show) {
        const scale = show ? '1' : '0';
        // 右側（アクション）
        this.fabBuy.style.transform = `scale(${scale})`;
        if (this.zoomControls) this.zoomControls.style.transform = `scale(${scale})`;
        // 左側（システム）
        if (this.btnHelp) this.btnHelp.style.transform = `scale(${scale})`;
        if (this.btnSound) this.btnSound.style.transform = `scale(${scale})`;
        // 中央（メニュー）※Tailwindのtranslate-x-1/2と競合しないよう明示的に指定
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

    showToast(message) {
        this.toast.innerText = message;
        this.toast.classList.add('toast-show');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('toast-show');
        }, 2000); 
    }

    showAirportInfo(data, currentConnections, maxConnections) {
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