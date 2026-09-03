/**
 * AI可読性・先祖返り防止コメント:
 * 【AI経営進化システム（年度連動の機体キャップ拡大 ＆ 小型機から大型機への近代化乗り換え）の完全実装】
 * 1. AIが保有できる最大機体数の上限を、ゲーム内の年度（year）の経過に伴い段階的に拡大（1-2年目: 10機 ➔ 3-4年目: 20機 ➔ 5年目以降: 35機）。
 * 2. 資金が潤沢（$40M超）で保有している古い小型機が過剰な場合、小型機を1機売却して中型・大型機に「近代化乗り換え」する思考ルーチンを追加。
 * 3. 路線撤退時の遊休機体自動売却、シェア25%未満時の撤退（onWithdraw）等の全機能は100%完全保持。
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
            this.timers[rival.id] = Math.random() * 20; 
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
            if (this.timers[rival.id] >= 22) { 
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

        // ★追加: 年度（year）に応じたAIの最大機体数キャップの動的拡大
        const currentYear = this.economyManager ? this.economyManager.year : 1;
        let maxAllowedPlanes = 10;
        if (currentYear >= 5) maxAllowedPlanes = 35;
        else if (currentYear >= 3) maxAllowedPlanes = 20;

        // シェア25%未満の不採算路線からの撤退・逃亡判定
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
                        
                        if (this.onWithdraw) {
                            this.onWithdraw(companyId, originId);
                        }
                        return; 
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
        if (currentPlanes.length > totalRoutes * 2 + 1 || currentPlanes.length > maxAllowedPlanes) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
        }

        // ★新設: 資金が潤沢かつ小型機が過剰な場合の「近代化乗り換え（小型機売却 ➔ 中型・大型機購入）」
        const smallPlanes = currentPlanes.filter(p => p.sizeType === 'small');
        if (aiFunds > 40000000 && smallPlanes.length >= 3 && currentPlanes.length < maxAllowedPlanes) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType === 'small' && this.economyManager) {
                this.economyManager.addAiFunds(companyId, CONFIG.ECONOMY.PLANES.small.cost * CONFIG.ECONOMY.PLANES.small.sellRate);
                
                // 浮いた資金を足して中型・大型機に乗り換え購入
                let upgradeBuyType = aiFunds > 80000000 ? 'large' : 'medium';
                const upgradeConf = CONFIG.ECONOMY.PLANES[upgradeBuyType];
                if (upgradeConf && this.economyManager.canAiAfford(companyId, upgradeConf.cost)) {
                    if (this.planeManager.addPlane(upgradeBuyType, companyId)) {
                        this.economyManager.deductAiFunds(companyId, upgradeConf.cost);
                        return;
                    }
                }
            }
        }

        // 機体増備ロジック（年度キャップと路線数に応じて中型・大型機も購入）
        if (currentPlanes.length < totalRoutes * 1.8 && currentPlanes.length < maxAllowedPlanes && aiFunds > 6000000) {
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

        // 路線開拓
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