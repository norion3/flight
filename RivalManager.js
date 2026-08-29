/**
 * AI可読性・先祖返り防止コメント:
 * 【ライバルAIの無限増殖防止】
 * 履歴199の有機的なネットワーク発展アルゴリズムを維持した上で、
 * AIに「機体数の上限」を導入しました。
 * （現在開拓している有効な路線数に応じて上限が算出され、それを超える場合は機体を購入しません）
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class RivalManager {
    constructor(networkManager, planeManager, airportManager) {
        this.networkManager = networkManager;
        this.planeManager = planeManager;
        this.airportManager = airportManager;
        
        this.rivals = CONFIG.COMPANIES.filter(c => c.id !== 'player');
        
        // 全社一斉に動かないよう、最初のタイミングだけ0〜60秒の間でランダムにばらす
        this.timers = {};
        this.rivals.forEach(rival => {
            this.timers[rival.id] = Math.random() * 60;
        });

        this.isInitialized = false;
    }

    init() {
        const startAirports = {
            'rival_eu': 'LHR',
            'rival_as': 'PEK',
            'rival_af': 'JNB',
            'rival_am': 'JFK',
            'rival_oc': 'SYD'
        };

        this.rivals.forEach(rival => {
            const startId = startAirports[rival.id];
            let startNode = this.airportManager.getAirportById(startId);
            
            // 安全弁: 指定拠点がデータに無い場合は適当な Major からスタート
            if (!startNode) {
                const majors = this.airportManager.markers.map(m => m.userData.airportData).filter(d => d.type === 'major');
                if (majors.length > 0) {
                    startNode = majors[Math.floor(Math.random() * majors.length)];
                }
            }

            if (startNode) {
                this.expandNetwork(rival.id, startNode);
                this.planeManager.addPlane('small', rival.id);
            }
        });
        this.isInitialized = true;
    }

    update(delta) {
        if (!this.isInitialized) return;

        this.rivals.forEach(rival => {
            this.timers[rival.id] += delta;
            // 正確に1分(60秒)間隔で行動
            if (this.timers[rival.id] >= 60) {
                this.timers[rival.id] = 0; 
                this.performAction(rival.id);
            }
        });
    }

    // ★追加: ライバルAIの現在の接続路線総数を計算する
    _getRivalRouteCount(companyId) {
        let routeCount = 0;
        const net = this.networkManager.network[companyId];
        if (!net) return 0;
        
        // 双方向で登録されているため2で割る
        for (const originId in net) {
            routeCount += net[originId].length;
        }
        return Math.floor(routeCount / 2);
    }

    performAction(companyId) {
        const net = this.networkManager.network[companyId];
        
        // 繋がっている空港のうち、「まだ接続上限(MAX)に達していない空港」だけをリストアップする
        const connectedIds = Object.keys(net).filter(id => {
            if (net[id].length === 0) return false;
            const airportNode = this.airportManager.getAirportById(id);
            if (!airportNode) return false;
            
            const maxConns = this.networkManager.MAX_CONNECTIONS[airportNode.type];
            return net[id].length < maxConns; 
        });

        if (connectedIds.length === 0) return;

        // 70%の確率で空路開拓、30%の確率で飛行機購入
        if (Math.random() < 0.7) {
            const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
            const originNode = this.airportManager.getAirportById(originId);
            this.expandNetwork(companyId, originNode);
        } else {
            // ★修正: AIの機体無限増殖を防ぐためのキャップ処理
            const currentPlaneCounts = Object.values(this.planeManager.getPlaneCounts(companyId)).reduce((a, b) => a + b, 0);
            const currentRouteCount = this._getRivalRouteCount(companyId);
            
            // 路線数の1.5倍をAIの機体上限とする（例: 10路線持っていれば15機まで買える）
            // 序盤に機体が全く買えないのを防ぐため、最低でも5機は保証する
            const aiMaxPlanes = Math.max(5, Math.floor(currentRouteCount * 1.5));
            
            if (currentPlaneCounts < aiMaxPlanes) {
                // 上限未満ならランダムな機体を購入
                const types = ['small', 'medium', 'large', 'super'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                this.planeManager.addPlane(randomType, companyId);
            } else {
                // 上限に達している場合は代わりに空路開拓を行う
                const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
                const originNode = this.airportManager.getAirportById(originId);
                this.expandNetwork(companyId, originNode);
            }
        }
    }

    expandNetwork(companyId, originNode) {
        const allCandidates = this.airportManager.markers.map(m => m.userData.airportData);
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        // 接続可能な空港（距離制限内、未接続、上限未到達）だけを先に絞り込む
        const validCandidates = allCandidates.filter(destNode => {
            if (originNode.id === destNode.id) return false;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) return false;
            
            // 航続距離の制限チェック（1.25倍）
            const posDest = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) return false;

            // 接続上限のチェック
            if (!this.networkManager.canConnect(originNode, destNode, companyId)) return false;
            
            return true;
        });

        // 繋げる先が一つもない場合は終了
        if (validCandidates.length === 0) return;

        // 距離順にソート（近い順）
        validCandidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        // 一番近い空港だけを絶対視せず、距離が近い「上位最大4つ」の中からランダムに選ぶ
        const poolSize = Math.min(validCandidates.length, 4);
        const selectedDest = validCandidates[Math.floor(Math.random() * poolSize)];

        // 確実に線を引いて飛行機を飛ばす
        this.networkManager.addRoute(originNode, selectedDest, companyId);
        this.planeManager.wakeUpPlanes(companyId);
    }
}