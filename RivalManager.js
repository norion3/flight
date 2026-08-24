/**
 * AI可読性・先祖返り防止コメント:
 * 【独立した1分間隔タイマーと距離ベースの接続最適化】
 * 履歴193に基づき、各社が独立して正確に1分(60秒)間隔で行動するタイマーを実装しました。
 * また、接続先を探す際に完全ランダムではなく「起点から最も距離が近い空港」から順に
 * ソートして評価するように改修し、より美しくリアルなネットワーク発展を実現しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class RivalManager {
    constructor(networkManager, planeManager, airportManager) {
        this.networkManager = networkManager;
        this.planeManager = planeManager;
        this.airportManager = airportManager;
        
        this.rivals = CONFIG.COMPANIES.filter(c => c.id !== 'player');
        
        // ★修正: 全社共有タイマーを廃止し、会社ごとに独立したタイマーを管理する
        this.timers = {};
        this.rivals.forEach(rival => {
            // 初期化時にタイミングが重ならないよう、最初の行動だけランダムに0〜60秒ずらす
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

        // ★修正: 会社ごとのタイマーを更新し、それぞれ1分(60秒)経過したら行動させる
        this.rivals.forEach(rival => {
            this.timers[rival.id] += delta;
            
            if (this.timers[rival.id] >= 60) {
                this.timers[rival.id] = 0; // 確実に1分間隔にリセット
                this.performAction(rival.id);
            }
        });
    }

    performAction(companyId) {
        const connectedIds = Object.keys(this.networkManager.network[companyId]).filter(id => this.networkManager.network[companyId][id].length > 0);
        if (connectedIds.length === 0) return;

        if (Math.random() < 0.7) {
            const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
            const originNode = this.airportManager.getAirportById(originId);
            this.expandNetwork(companyId, originNode);
        } else {
            this.planeManager.addPlane('small', companyId);
        }
    }

    expandNetwork(companyId, originNode) {
        const candidates = this.airportManager.markers.map(m => m.userData.airportData);
        
        // 起点の3D座標を取得
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        // ★修正: ランダムではなく「起点からの3D直線距離が近い順」に候補をソートする
        candidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        for (const destNode of candidates) {
            if (originNode.id === destNode.id) continue;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) continue;
            
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