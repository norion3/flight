/**
 * AI可読性・先祖返り防止コメント:
 * 【ボタンの排他制御・被り防止処理の追加】
 * 履歴221に基づき、メッセージカード展開時に fab-buy-plane だけでなく 
 * zoom-controls も同時に非表示(scale(0))にする連携処理を追加しました。
 */
export class UIManager {
    constructor() {
        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
        this.connectingCard = document.getElementById('connecting-mode-card'); 
        
        this.btnZoomIn = document.getElementById('btn-zoom-in');
        this.btnZoomOut = document.getElementById('btn-zoom-out');
        // ★追加: ズームボタン全体を覆うコンテナを取得
        this.zoomControls = document.getElementById('zoom-controls');

        this.toastTimeout = null;

        this.onConnectRequested = null;
        this.onRouteActionConfirmed = null; 
        this.onRouteCanceled = null;
        this.onBuyPlane = null;
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
            this.fabBuy.style.transform = 'scale(1)'; 
            if (this.zoomControls) this.zoomControls.style.transform = 'scale(1)'; // ★追加
        };

        document.getElementById('btn-cancel-route').addEventListener('click', cancelRoute);
        document.getElementById('btn-cancel-connect').addEventListener('click', cancelRoute);

        document.getElementById('btn-action-route').addEventListener('click', () => {
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed(this.currentRouteAction);
        });

        this.fabBuy.addEventListener('click', () => {
            this.hideAll();
            this.buyMenu.classList.add('show');
            this.fabBuy.style.transform = 'scale(0)'; 
            if (this.zoomControls) this.zoomControls.style.transform = 'scale(0)'; // ★追加
        });

        document.getElementById('btn-close-buy').addEventListener('click', () => {
            this.buyMenu.classList.remove('show');
            this.fabBuy.style.transform = 'scale(1)';
            if (this.zoomControls) this.zoomControls.style.transform = 'scale(1)'; // ★追加
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
        this.fabBuy.style.transform = 'scale(0)'; 
        if (this.zoomControls) this.zoomControls.style.transform = 'scale(0)'; // ★追加
    }

    setConnectingMode() {
        this.infoCard.classList.remove('show');
        this.connectingCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)'; 
        if (this.zoomControls) this.zoomControls.style.transform = 'scale(0)'; // ★追加
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

        this.fabBuy.style.transform = 'scale(0)'; 
        if (this.zoomControls) this.zoomControls.style.transform = 'scale(0)'; // ★追加
    }

    hideRouteConfirm() {
        this.routeCard.classList.remove('show');
    }

    hideAll() {
        this.infoCard.classList.remove('show');
        this.routeCard.classList.remove('show');
        this.buyMenu.classList.remove('show');
        this.connectingCard.classList.remove('show');
        this.fabBuy.style.transform = 'scale(1)'; 
        if (this.zoomControls) this.zoomControls.style.transform = 'scale(1)'; // ★追加
    }
}