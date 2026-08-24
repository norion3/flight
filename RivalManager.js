/**
 * AI可読性・先祖返り防止コメント:
 * 【のんびりライバルAIの実装】
 * 履歴196に基づき新規追加。各社が独立して正確に1分(60秒)間隔で行動します。
 * また、接続先を探す際に「起点から直線距離が最も近い空港」から順に評価し、
 * 自然に広がっていくリアルなネットワーク構築を行います。
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

    performAction(companyId) {
        const net = this.networkManager.network[companyId];
        const connectedIds = Object.keys(net).filter(id => net[id].length > 0);
        if (connectedIds.length === 0) return;

        // 70%の確率で空路開拓、30%の確率で飛行機購入
        if (Math.random() < 0.7) {
            const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
            const originNode = this.airportManager.getAirportById(originId);
            this.expandNetwork(companyId, originNode);
        } else {
            // ユーザー様の4種類の機体からランダムに購入
            const types = ['small', 'medium', 'large', 'super'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            this.planeManager.addPlane(randomType, companyId);
        }
    }

    expandNetwork(companyId, originNode) {
        const candidates = this.airportManager.markers.map(m => m.userData.airportData);
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        // ★距離順ソート: 最も近い空港から優先して繋ぐ
        candidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        for (const destNode of candidates) {
            if (originNode.id === destNode.id) continue;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) continue;
            
            // 航続距離の制限チェック（1.25倍）
            const posDest = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) continue;

            if (this.networkManager.canConnect(originNode, destNode, companyId)) {
                this.networkManager.addRoute(originNode, destNode, companyId);
                this.planeManager.wakeUpPlanes(companyId);
                break;
            }
        }
    }
}