/**
 * AI可読性・先祖返り防止コメント:
 * 【連続購入の快適化】
 * 履歴104に基づき、飛行機を購入するたびにメニューが閉じてしまう仕様を撤廃しました。
 * メニューを開いたまま連続して機体を追加できます。
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
        this.onRouteConfirmed = null;
        this.onRouteCanceled = null;
        this.onBuyPlane = null;

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
            this.fabBuy.style.transform = 'scale(1)'; // キャンセルでFAB復帰
        };

        document.getElementById('btn-cancel-route').addEventListener('click', cancelRoute);
        document.getElementById('btn-cancel-connect').addEventListener('click', cancelRoute);

        document.getElementById('btn-open-route').addEventListener('click', () => {
            if (this.onRouteConfirmed) this.onRouteConfirmed();
            this.hideRouteConfirm();
            this.connectingCard.classList.remove('show');
            this.fabBuy.style.transform = 'scale(1)'; // 開通完了でFAB復帰
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

        document.querySelectorAll('.buy-plane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
                // ★修正: 購入後もメニューを閉じない（連続購入を可能にする）
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
        this.fabBuy.style.transform = 'scale(0)'; // 情報カード表示中はFABを隠す
    }

    setConnectingMode() {
        this.infoCard.classList.remove('show');
        this.connectingCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)'; // 接続待ち中もFABを隠す
    }

    showRouteConfirm(fromData, toData) {
        this.connectingCard.classList.remove('show');
        document.getElementById('route-from').innerText = fromData.id;
        document.getElementById('route-to').innerText = toData.id;
        this.routeCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)'; // 確認中もFABを隠す
    }

    hideRouteConfirm() {
        this.routeCard.classList.remove('show');
    }

    hideAll() {
        this.infoCard.classList.remove('show');
        this.routeCard.classList.remove('show');
        this.buyMenu.classList.remove('show');
        this.connectingCard.classList.remove('show');
        this.fabBuy.style.transform = 'scale(1)'; // すべて隠れたらFAB復帰
    }
}


