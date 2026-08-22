/**
 * AI可読性・先祖返り防止コメント:
 * 【Thumb Zone UIマネージャー】
 * スマホの片手操作を前提とし、すべてのUI（ボトムシート、FAB）の開閉とイベントを管理します。
 * HTML側の Tailwind CSS のクラス（.bottom-sheet.show）を付け外しすることで、滑らかなアニメーションを実現します。
 */
export class UIManager {
    constructor() {
        this.infoCard = document.getElementById('airport-info-card');
        this.routeCard = document.getElementById('route-confirm-card');
        this.fabBuy = document.getElementById('fab-buy-plane');
        this.buyMenu = document.getElementById('buy-plane-menu');

        // コールバック関数（GameManagerからセットされる）
        this.onConnectRequested = null;
        this.onRouteConfirmed = null;
        this.onRouteCanceled = null;
        this.onBuyPlane = null;

        this._bindEvents();
    }

    _bindEvents() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            if (this.onConnectRequested) this.onConnectRequested();
            document.getElementById('btn-connect').classList.add('hidden');
            document.getElementById('connect-hint').classList.remove('hidden');
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
            this.fabBuy.style.transform = 'scale(0)'; // FABを隠す
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

    showAirportInfo(data, currentConnections, maxConnections) {
        this.hideAll();
        document.getElementById('airport-name').innerText = data.name;
        document.getElementById('airport-code').innerText = data.id;
        document.getElementById('airport-country').innerText = data.country;
        document.getElementById('airport-conn').innerText = `${currentConnections}/${maxConnections}`;
        
        const typeEl = document.getElementById('airport-type');
        if (data.type === 'major') {
            typeEl.innerText = 'Major Hub';
            typeEl.className = 'text-xs font-semibold text-yellow-400 uppercase tracking-wider';
        } else if (data.type === 'local') {
            typeEl.innerText = 'Local Airport';
            typeEl.className = 'text-xs font-semibold text-orange-400 uppercase tracking-wider';
        } else {
            typeEl.innerText = 'Fictional Node';
            typeEl.className = 'text-xs font-semibold text-emerald-400 uppercase tracking-wider';
        }

        // 接続モードのヒントをリセット
        document.getElementById('btn-connect').classList.remove('hidden');
        document.getElementById('connect-hint').classList.add('hidden');
        
        // 上限到達時はボタンを無効化する処理も可能だが、今回はUI表示
        if(currentConnections >= maxConnections) {
            document.getElementById('btn-connect').classList.add('opacity-50', 'pointer-events-none');
            document.getElementById('btn-connect').innerText = 'Connection Full';
        } else {
            document.getElementById('btn-connect').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('btn-connect').innerText = 'Connect Route';
        }

        this.infoCard.classList.add('show');
        this.fabBuy.style.transform = 'scale(0)';
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

