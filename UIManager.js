/**
 * AI可読性・先祖返り防止コメント:
 * 【空路廃止の動的UI実装】
 * 履歴141に基づき、開拓モード中に「未接続」なら開拓ポップアップを、
 * 「接続済み」なら赤色の廃止ポップアップを出し分ける showRouteConfirm を改修しました。
 * 画面を汚さずに直感的な操作感を実現しています。
 */
export class UIManager {
    constructor() {
        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
        this.connectingCard = document.getElementById('connecting-mode-card'); 
        this.toastTimeout = null;

        this.onConnectRequested = null;
        this.onRouteActionConfirmed = null; // ★追加: 開拓と廃止を統合処理
        this.onRouteCanceled = null;
        this.onBuyPlane = null;
        
        this.currentRouteAction = null; // 'add' or 'remove'

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
        };

        document.getElementById('btn-cancel-route').addEventListener('click', cancelRoute);
        document.getElementById('btn-cancel-connect').addEventListener('click', cancelRoute);

        // ★修正: 開拓と廃止のアクションを動的に処理する
        document.getElementById('btn-action-route').addEventListener('click', () => {
            if (this.onRouteActionConfirmed) this.onRouteActionConfirmed(this.currentRouteAction);
            this.hideRouteConfirm();
            this.connectingCard.classList.remove('show');
            this.fabBuy.style.transform = 'scale(1)'; 
        });

        this.fabBuy.addEventListener('click', () => {
            this.hideAll();
            this.buyMenu.classList.add('show');
            this.fabBuy.style.transform = 'scale(0)'; 
        });

        document.getElementById('btn-close-buy').addEventListener('click', () => {
            this.buyMenu.classList.remove('show');
            this.fabBuy.style.transform = 'scale(1)';
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
        
        if(currentConnections >= maxConnections) {
            btnConnect.classList.add('opacity-50', 'pointer-events-none');
            btnConnect.innerText = window.APP_LANG.btnLimit;
        } else {
            btnConnect.classList.remove('opacity-50', 'pointer-events-none');
            btnConnect.innerText = window.APP_LANG.btnConnect;
        }

        this.infoCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)'; 
    }

    setConnectingMode() {
        this.infoCard.classList.remove('show');
        this.connectingCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)'; 
    }

    // ★修正: 未接続なら「開拓」、接続済みなら「廃止」にUIを切り替える
    showRouteConfirm(fromData, toData, isConnected) {
        this.connectingCard.classList.remove('show');
        document.getElementById('route-from').innerText = fromData.id;
        document.getElementById('route-to').innerText = toData.id;

        const titleEl = document.getElementById('route-action-title');
        const btnAction = document.getElementById('btn-action-route');

        this.currentRouteAction = isConnected ? 'remove' : 'add';

        if (isConnected) {
            // 廃止モード（赤色）
            titleEl.innerText = window.APP_LANG.routeRemoveTitle || "空路廃止";
            titleEl.className = "text-xs text-red-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-red-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-red-900/20 absolute show";
            btnAction.innerText = window.APP_LANG.btnRemoveRoute || "廃止する";
            btnAction.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:bg-red-500 shadow-lg shadow-red-900/50";
        } else {
            // 開拓モード（黄色と青色）
            titleEl.innerText = window.APP_LANG.routeOpenTitle || "空路開拓";
            titleEl.className = "text-xs text-yellow-400 font-bold tracking-wider mb-2";
            this.routeCard.className = "interactive-ui bottom-sheet bg-slate-900/95 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-yellow-900/20 absolute show";
            btnAction.innerText = window.APP_LANG.btnOpenRoute || "開拓する";
            btnAction.className = "flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-500 shadow-lg shadow-blue-900/50";
        }

        this.fabBuy.style.transform = 'scale(0)'; 
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
    }
}