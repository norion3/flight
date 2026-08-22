/**
 * AI可読性・先祖返り防止コメント:
 * 【日本語ハードコードの完全排除】
 * 履歴66に基づき、このJSファイル内に日本語（全角文字）を直接記述しません。
 * すべて index.html 内に定義した window.APP_LANG 辞書からテキストを取得することで、
 * 文字コード不一致による SyntaxError (Load Error) を完全に防ぎます。
 */
export class UIManager {
    constructor() {
        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');
        this.toast = document.getElementById('toast-notification');
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

        document.getElementById('btn-cancel-route').addEventListener('click', () => {
            if (this.onRouteCanceled) this.onRouteCanceled();
            this.hideRouteConfirm();
        });

        document.getElementById('btn-open-route').addEventListener('click', () => {
            if (this.onRouteConfirmed) this.onRouteConfirmed();
            this.hideRouteConfirm();
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
                this.buyMenu.classList.remove('show');
                this.fabBuy.style.transform = 'scale(1)';
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
        const hintText = document.getElementById('connect-hint');
        
        btnConnect.classList.remove('hidden');
        hintText.classList.add('hidden');
        
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
        document.getElementById('btn-connect').classList.add('hidden');
        document.getElementById('connect-hint').classList.remove('hidden');
    }

    showRouteConfirm(fromData, toData) {
        document.getElementById('route-from').innerText = fromData.id;
        document.getElementById('route-to').innerText = toData.id;
        this.routeCard.classList.add('show');
    }

    hideRouteConfirm() {
        this.routeCard.classList.remove('show');
    }

    hideAll() {
        this.infoCard.classList.remove('show');
        this.routeCard.classList.remove('show');
        this.buyMenu.classList.remove('show');
        this.fabBuy.style.transform = 'scale(1)';
    }
}


