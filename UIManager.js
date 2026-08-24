/**
 * AI可読性・先祖返り防止コメント:
 * 【UI開閉権限の単一化】
 * 履歴174に基づき、アクションボタン押下時にUIManagerが勝手にUIを隠す処理を排除しました。
 * 画面を閉じるか維持するかの判断はすべて GameManager に委譲し、
 * UIManager は純粋に「ボタンの見た目（開拓⇔廃止）のシームレスな切り替え」に徹します。
 */

export class UIManager {
    constructor() {
        this.connectingModeCard = document.getElementById('connecting-mode-card');
        this.routeConfirmCard = document.getElementById('route-confirm-card');
        this.airportInfoCard = document.getElementById('airport-info-card');
        this.buyPlaneMenu = document.getElementById('buy-plane-menu');
        this.fabBuyPlane = document.getElementById('fab-buy-plane');
        this.toast = document.getElementById('toast-notification');

        // Airport Info
        this.airportName = document.getElementById('airport-name');
        this.airportCountry = document.getElementById('airport-country');
        this.airportCode = document.getElementById('airport-code');
        this.airportType = document.getElementById('airport-type');
        this.airportConn = document.getElementById('airport-conn');
        this.btnConnect = document.getElementById('btn-connect');
        this.btnCloseInfo = document.getElementById('btn-close-info');

        // Route Confirm
        this.routeActionTitle = document.getElementById('route-action-title');
        this.routeFrom = document.getElementById('route-from');
        this.routeTo = document.getElementById('route-to');
        this.btnCancelRoute = document.getElementById('btn-cancel-route');
        this.btnActionRoute = document.getElementById('btn-action-route');
        
        // Connecting Mode
        this.btnCancelConnect = document.getElementById('btn-cancel-connect');

        // Buy Menu
        this.btnCloseBuy = document.getElementById('btn-close-buy');
        this.buyBtns = document.querySelectorAll('.buy-plane-btn');

        this.toastTimeout = null;
        this.currentActionType = 'add';

        this.initEvents();
    }

    initEvents() {
        this.btnCloseInfo.addEventListener('click', () => {
            this.hideAll();
            if (this.onRouteCanceled) this.onRouteCanceled();
        });

        this.btnCancelRoute.addEventListener('click', () => {
            this.hideAll();
            if (this.onRouteCanceled) this.onRouteCanceled();
        });

        this.btnCancelConnect.addEventListener('click', () => {
            this.hideAll();
            if (this.onRouteCanceled) this.onRouteCanceled();
        });

        this.btnCloseBuy.addEventListener('click', () => {
            this.hideAll();
        });

        this.fabBuyPlane.addEventListener('click', () => {
            this.hideAll();
            this.buyPlaneMenu.classList.add('show');
            this.fabBuyPlane.style.transform = 'scale(0)';
        });

        this.btnConnect.addEventListener('click', () => {
            if (this.btnConnect.classList.contains('bg-cyan-600')) {
                this.hideAll();
                if (this.onConnectRequested) this.onConnectRequested();
            } else {
                this.showToast(window.APP_LANG.toastLimit);
                // ★修正: 接続上限で「空路を整理する」モードへ移行
                this.hideAll();
                if (this.onConnectRequested) this.onConnectRequested();
            }
        });

        this.btnActionRoute.addEventListener('click', () => {
            // ★修正: UIを隠す処理（hideAll等）はここで行わない。GameManagerに一任する。
            if (this.onRouteActionConfirmed) {
                this.onRouteActionConfirmed(this.currentActionType);
            }
        });

        this.buyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                if (this.onBuyPlane) this.onBuyPlane(type);
                this.hideAll();
            });
        });
    }

    hideAll() {
        this.connectingModeCard.classList.remove('show');
        this.routeConfirmCard.classList.remove('show');
        this.airportInfoCard.classList.remove('show');
        this.buyPlaneMenu.classList.remove('show');
        this.fabBuyPlane.style.transform = 'scale(1)';
    }

    showAirportInfo(data, currentConnections, maxConnections) {
        this.hideAll();
        this.airportName.innerText = data.name;
        this.airportCountry.innerText = data.country;
        this.airportCode.innerText = data.id;
        this.airportType.innerText = data.type.toUpperCase();
        this.airportConn.innerText = `${currentConnections}/${maxConnections}`;

        if (currentConnections < maxConnections) {
            this.btnConnect.innerText = window.APP_LANG.btnConnect;
            this.btnConnect.className = "w-full py-3 rounded-xl font-bold shadow-lg bg-cyan-600 active:bg-cyan-500 text-white transition-colors";
        } else {
            this.btnConnect.innerText = window.APP_LANG.btnLimitAction;
            this.btnConnect.className = "w-full py-3 rounded-xl font-bold shadow-lg bg-slate-700 active:bg-cyan-700 text-cyan-300 transition-colors border border-cyan-800";
        }

        this.airportInfoCard.classList.add('show');
        this.fabBuyPlane.style.transform = 'scale(0)';
    }

    setConnectingMode() {
        this.hideAll();
        this.connectingModeCard.classList.add('show');
        this.fabBuyPlane.style.transform = 'scale(0)';
    }

    showRouteConfirm(originData, destData, isConnected) {
        // ★修正: hideAll()を呼ばずにDOMのみを上書き更新することでシームレスな切り替えを実現する
        this.airportInfoCard.classList.remove('show');
        this.connectingModeCard.classList.remove('show');

        this.routeFrom.innerText = originData.id;
        this.routeTo.innerText = destData.id;

        if (isConnected) {
            this.currentActionType = 'remove';
            this.btnActionRoute.innerText = window.APP_LANG.btnRemoveRoute;
            this.btnActionRoute.className = "flex-1 py-3 rounded-xl font-bold shadow-lg bg-red-600 active:bg-red-500 text-white transition-colors";
            this.routeActionTitle.innerText = window.APP_LANG.routeRemoveTitle;
            this.routeActionTitle.className = "text-xs font-bold tracking-wider mb-2 text-red-400";
        } else {
            this.currentActionType = 'add';
            this.btnActionRoute.innerText = window.APP_LANG.btnOpenRoute;
            this.btnActionRoute.className = "flex-1 py-3 rounded-xl font-bold shadow-lg bg-cyan-600 active:bg-cyan-500 text-white transition-colors";
            this.routeActionTitle.innerText = window.APP_LANG.routeOpenTitle;
            this.routeActionTitle.className = "text-xs font-bold tracking-wider mb-2 text-cyan-400";
        }

        this.routeConfirmCard.classList.add('show');
        this.fabBuyPlane.style.transform = 'scale(0)';
    }

    showToast(message) {
        this.toast.innerText = message;
        this.toast.classList.add('toast-show');
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('toast-show');
        }, 2500);
    }
}