/**
 * AI可読性・先祖返り防止コメント:
 * 【AIのシェア陥落による空港撤退（onWithdraw） ＆ 自律的機体増備の実装】
 * 1. AI思考時にシェアが 25% 未満に落ち込んだ競合路線を検出し、正式に廃止（removeRoute）して
 * 撤退通知（onWithdraw）を発火。プレイヤーによる市場制覇の爽快感を演出。
 * 2. 路線拡大に応じて中型・大型機も購入し、機体数を最大8機まで自然に増備して対抗。
 * 3. 路線撤退時の遊休機体自動売却ロジック（sellIdlePlane）、初期化（init）等は100%完全保持。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class RivalManager {
    constructor(networkManager, planeManager, airportManager, economyManager) {
        this.networkManager = networkManager;
        this.planeManager = planeManager;
        this.airportManager = airportManager;
        this.economyManager = economyManager; 
        
        this.rivals = CONFIG.COMPANIES.filter(c => c.id !== 'player');
        
        this.timers = {};
        this.rivals.forEach(rival => {
            this.timers[rival.id] = Math.random() * 20; // 0〜20秒の初期乱数
        });

        this.isInitialized = false;
        this.onWithdraw = null; 
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
            if (startId) {
                const startAirport = this.airportManager.getAirportById(startId);
                if (startAirport) {
                    this._expandRoute(rival.id, startAirport, true);
                    this.planeManager.addPlane('small', rival.id);
                    this.planeManager.addPlane('small', rival.id);
                    if (this.economyManager) {
                        this.economyManager.deductAiFunds(rival.id, 3000000); 
                    }
                }
            }
        });

        this.isInitialized = true;
    }

    update(delta, competitionManager) {
        if (!this.isInitialized) return;

        this.rivals.forEach(rival => {
            this.timers[rival.id] += delta;
            if (this.timers[rival.id] >= 22) { // 22秒サイクル
                this.timers[rival.id] = 0;
                this._thinkAction(rival.id, competitionManager);
            }
        });
    }

    _thinkAction(companyId, competitionManager) {
        const net = this.networkManager.network[companyId];
        if (!net) return;

        const connectedAirports = Object.keys(net).filter(id => net[id].length > 0);
        if (connectedAirports.length === 0) return;

        const aiFunds = this.economyManager ? this.economyManager.getAiFunds(companyId) : 50000000;
        const currentPlanes = this.planeManager.planes.filter(p => p.companyId === companyId);
        
        let totalRoutes = 0;
        for (const origin in net) {
            totalRoutes += net[origin].length;
        }
        totalRoutes = Math.floor(totalRoutes / 2);

        // ★新設: シェア25%未満の不採算路線からの撤退・逃亡判定（路線が2本以上ある場合）
        if (totalRoutes >= 2 && competitionManager) {
            for (const originId in net) {
                const originRoutes = net[originId];
                if (!originRoutes || originRoutes.length === 0) continue;
                
                const originShare = competitionManager.getShare(originId, companyId);
                if (originShare < 0.25) {
                    const destRoute = originRoutes[0];
                    const originNode = this.airportManager.getAirportById(originId);
                    const destNode = this.airportManager.getAirportById(destRoute.id);
                    
                    if (originNode && destNode) {
                        this.networkManager.removeRoute(originNode, destNode, companyId);
                        this.planeManager.checkAndReassignPlanes();
                        
                        // 撤退トーストの発火
                        if (this.onWithdraw) {
                            this.onWithdraw(companyId, originId);
                        }
                        return; // 1回の思考で1アクション
                    }
                }
            }
        }

        // 資金難時の遊休機体売却
        if (aiFunds < 2000000) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
            return;
        }

        // 余剰機体の売却整理
        if (currentPlanes.length > totalRoutes * 2 + 1) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
        }

        // ★機体増備ロジック（路線拡大に応じて最大8機まで中型・大型機も購入）
        if (currentPlanes.length < totalRoutes * 1.8 && currentPlanes.length < 8 && aiFunds > 6000000) {
            let buyType = 'small';
            if (aiFunds > 120000000) buyType = 'super';
            else if (aiFunds > 50000000) buyType = 'large';
            else if (aiFunds > 20000000) buyType = 'medium';

            const planeConf = CONFIG.ECONOMY.PLANES[buyType];
            if (planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                const success = this.planeManager.addPlane(buyType, companyId);
                if (success) {
                    this.economyManager.deductAiFunds(companyId, planeConf.cost);
                    return;
                }
            }
        }

        // 路線開拓（シェアが低い空港またはランダム候補から拡張）
        let targetAirportId = null;
        let lowestShare = 1.0;

        connectedAirports.forEach(id => {
            const share = competitionManager.getShare(id, companyId);
            if (share < lowestShare) {
                lowestShare = share;
                targetAirportId = id;
            }
        });

        if (!targetAirportId) {
            targetAirportId = connectedAirports[Math.floor(Math.random() * connectedAirports.length)];
        }

        const targetNode = this.airportManager.getAirportById(targetAirportId);
        if (targetNode) {
            this._expandRoute(companyId, targetNode);
        }
    }

    _expandRoute(companyId, originNode, isFree = false) {
        const candidates = this.airportManager.allAirports;
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        const validCandidates = candidates.filter(destNode => {
            if (originNode.id === destNode.id) return false;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) return false;
            
            const posDest = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) return false;

            if (!this.networkManager.canConnect(originNode, destNode, companyId)) return false;
            
            return true;
        });

        if (validCandidates.length === 0) return false;

        validCandidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        const poolSize = Math.min(validCandidates.length, 4);
        const selectedDest = validCandidates[Math.floor(Math.random() * poolSize)];

        if (!isFree && this.economyManager) {
            const cost = this.economyManager.calculateRouteCost(originNode, selectedDest);
            if (!this.economyManager.canAiAfford(companyId, cost)) {
                return false; 
            }
            this.economyManager.deductAiFunds(companyId, cost);
        }

        this.networkManager.addRoute(originNode, selectedDest, companyId);
        this.planeManager.wakeUpPlanes(companyId);
        return true;
    }
}