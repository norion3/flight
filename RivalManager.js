/**
 * AI可読性・先祖返り防止コメント:
 * 【AIの余剰・遊休機体売却（ダウンサイジング）ロジックの実装】
 * 1. 路線から撤退した際、余った遊休機体を自動売却して資金回収・維持費削減を行う処理を追加。
 * 2. 資金難時や機体が過剰になった際にも遊休機体を売却するセーフティ思考を追加しました。
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
            this.timers[rival.id] = Math.random() * 30;
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
            let startNode = this.airportManager.getAirportById(startId);
            
            if (!startNode) {
                const majors = this.airportManager.markers.map(m => m.userData.airportData).filter(d => d.type === 'major');
                if (majors.length > 0) {
                    startNode = majors[Math.floor(Math.random() * majors.length)];
                }
            }

            if (startNode) {
                if (this.economyManager) this.economyManager.deductAiFunds(rival.id, 15000000);
                this.expandNetwork(rival.id, startNode, true);
                this.planeManager.addPlane('small', rival.id);
            }
        });
        this.isInitialized = true;
    }

    update(delta, competitionManager) {
        if (!this.isInitialized) return;

        this.rivals.forEach(rival => {
            this.timers[rival.id] += delta;
            if (this.timers[rival.id] >= 30) {
                this.timers[rival.id] = 0; 
                this.performAction(rival.id, competitionManager);
            }
        });
    }

    _getRivalRouteCount(companyId) {
        let routeCount = 0;
        const net = this.networkManager.network[companyId];
        if (!net) return 0;
        
        for (const originId in net) {
            if (net[originId]) routeCount += net[originId].length;
        }
        return Math.floor(routeCount / 2);
    }

    // ★追加: 余剰・遊休機体を売却して資金回収する内部メソッド
    _sellSurplusIdlePlanes(companyId) {
        if (!this.planeManager || !this.economyManager) return;
        
        const soldType = this.planeManager.sellIdlePlane(companyId);
        if (soldType) {
            const planeConf = CONFIG.ECONOMY.PLANES[soldType];
            const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 3500000;
            this.economyManager.addAiFunds(companyId, refund);
        }
    }

    performAction(companyId, competitionManager) {
        const net = this.networkManager.network[companyId];
        if (!net) return;
        const currentRouteCount = this._getRivalRouteCount(companyId);
        
        if (competitionManager) {
            let didWithdraw = false;
            for (const originId of Object.keys(net)) {
                if (!net[originId] || net[originId].length === 0) continue;
                
                const myShare = competitionManager.getShare(originId, companyId);
                
                if (myShare < 0.1) {
                    if (currentRouteCount <= 1) {
                        break; 
                    }

                    const routeToRemove = net[originId][0]; 
                    const originNode = this.airportManager.getAirportById(originId);
                    const destNode = routeToRemove.data; 

                    if (originNode && destNode) {
                        this.networkManager.removeRoute(originNode, destNode, companyId);
                        this.planeManager.checkAndReassignPlanes(companyId);
                        didWithdraw = true;
                        
                        // ★追加: 路線撤退に伴い余った遊休機体を売却して資金を回収
                        this._sellSurplusIdlePlanes(companyId);
                        
                        if (this.onWithdraw) this.onWithdraw(companyId, originId);
                        
                        this._escapeToNewAirport(companyId, competitionManager);
                        break; 
                    }
                }
            }
            if (didWithdraw) return;
        }

        const counts = this.planeManager.getPlaneCounts(companyId);
        const currentPlaneCounts = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
        const aiMaxPlanes = Math.max(5, Math.floor(currentRouteCount * 1.5));

        // ★追加: 資金難時または機体過剰時に遊休機体を売却して維持費を削減
        if (this.economyManager) {
            const aiFunds = this.economyManager.getAiFunds(companyId);
            if (currentPlaneCounts > aiMaxPlanes || aiFunds < 3000000) {
                this._sellSurplusIdlePlanes(companyId);
            }
        }

        const connectedIds = Object.keys(net).filter(id => {
            if (!net[id] || net[id].length === 0) return false;
            const airportNode = this.airportManager.getAirportById(id);
            if (!airportNode) return false;
            
            const maxConns = this.networkManager.MAX_CONNECTIONS[airportNode.type];
            return net[id].length < maxConns; 
        });

        if (connectedIds.length === 0) return;

        if (Math.random() < 0.7) {
            const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
            const originNode = this.airportManager.getAirportById(originId);
            this.expandNetwork(companyId, originNode);
        } else {
            if (currentPlaneCounts < aiMaxPlanes) {
                const types = ['small', 'medium', 'large', 'super'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                
                const planeConf = CONFIG.ECONOMY.PLANES[randomType];
                if (this.economyManager && planeConf) {
                    if (this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                        this.economyManager.deductAiFunds(companyId, planeConf.cost);
                        this.planeManager.addPlane(randomType, companyId);
                    }
                }
            } else {
                const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
                const originNode = this.airportManager.getAirportById(originId);
                this.expandNetwork(companyId, originNode);
            }
        }
    }

    _escapeToNewAirport(companyId, competitionManager) {
        const allCandidates = this.airportManager.markers.map(m => m.userData.airportData);
        
        const validEscapes = allCandidates.filter(candidate => {
            const net = this.networkManager.network[companyId];
            if (net && net[candidate.id] && net[candidate.id].length > 0) return false;
            
            let hasConnection = false;
            const posCandidate = Utils.latLonToVector3(candidate.lat, candidate.lon, CONFIG.GLOBE_RADIUS);
            for (const other of allCandidates) {
                if (other.id === candidate.id) continue;
                const posOther = Utils.latLonToVector3(other.lat, other.lon, CONFIG.GLOBE_RADIUS);
                if (posCandidate.distanceTo(posOther) <= CONFIG.GLOBE_RADIUS * 1.25) {
                    if (this.networkManager.canConnect(candidate, other, companyId)) {
                        hasConnection = true;
                        break;
                    }
                }
            }
            return hasConnection;
        });

        if (validEscapes.length === 0) return;

        validEscapes.sort((a, b) => {
            const shareA = competitionManager.getShare(a.id, 'player');
            const shareB = competitionManager.getShare(b.id, 'player');
            return shareA - shareB;
        });

        const minShare = competitionManager.getShare(validEscapes[0].id, 'player');
        const bestEscapes = validEscapes.filter(e => competitionManager.getShare(e.id, 'player') === minShare);

        const escapeDest = bestEscapes[Math.floor(Math.random() * bestEscapes.length)];
        this.expandNetwork(companyId, escapeDest, true); 
    }

    expandNetwork(companyId, originNode, isFree = false) {
        const allCandidates = this.airportManager.markers.map(m => m.userData.airportData);
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        const validCandidates = allCandidates.filter(destNode => {
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