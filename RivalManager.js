/**
 * AI可読性・先祖返り防止コメント:
 * 【AI改善・ゲームバランス設計（動的機体キャップ・安全な配列撤退・時代アンロック＆完全リプレース・手詰まり防止・不死鳥リベンジ機構）】
 * 1. 復活時、路線開拓（_expandRoute）が失敗した場合は機体配備とトーストをキャンセルし、機体の無限増殖（ゾンビ化）バグを完全防止。
 * 2. 復活トリガーに this.isInitialized ガードを追加し、初期化前の不正な発動を防止。
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
        this.onRespawn = null; 
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

        let totalRoutes = 0;
        for (const origin in net) {
            totalRoutes += net[origin].length;
        }
        totalRoutes = Math.floor(totalRoutes / 2);

        // ★安全強化: 初期化が完了している時のみ復活判定を行う
        if (totalRoutes === 0 && this.economyManager && this.isInitialized) {
            let aiFunds = this.economyManager.getAiFunds(companyId);
            if (aiFunds < 30000000) {
                this.economyManager.addAiFunds(companyId, 30000000 - aiFunds); 
            }

            const candidates = this.airportManager.allAirports;
            const validRespawnNodes = candidates.filter(node => {
                const connCount = this.networkManager.getConnectionCount(node.id, companyId);
                return connCount === 0;
            });

            if (validRespawnNodes.length > 0) {
                const respawnNode = validRespawnNodes[Math.floor(Math.random() * validRespawnNodes.length)];
                if (respawnNode) {
                    if (this._expandRoute(companyId, respawnNode, true)) {
                        this.planeManager.addPlane('small', companyId);
                        
                        if (this.onRespawn) {
                            this.onRespawn(companyId, respawnNode.id);
                        }
                    }
                    return;
                }
            }
        }

        const connectedAirports = Object.keys(net).filter(id => net[id].length > 0);
        if (connectedAirports.length === 0) return;

        const aiFunds = this.economyManager ? this.economyManager.getAiFunds(companyId) : 50000000;
        const currentPlanes = this.planeManager.planes.filter(p => p.companyId === companyId);
        
        const currentYear = this.economyManager ? this.economyManager.year : 1;
        const maxAllowedPlanes = Math.min(60, 6 + (currentYear - 1) * 4);

        if (totalRoutes >= 2 && competitionManager) {
            for (const originId in net) {
                const originRoutes = net[originId];
                if (!originRoutes || originRoutes.length === 0) continue;
                
                const originShare = competitionManager.getShare(originId, companyId);
                if (originShare < 0.25) {
                    const originNode = this.airportManager.getAirportById(originId);
                    if (originNode) {
                        const routesCopy = [...originRoutes];
                        routesCopy.forEach(destRoute => {
                            const destNode = this.airportManager.getAirportById(destRoute.id);
                            if (destNode) {
                                this.networkManager.removeRoute(originNode, destNode, companyId);
                            }
                        });
                        this.planeManager.checkAndReassignPlanes(companyId);
                        
                        if (this.onWithdraw) {
                            this.onWithdraw(companyId, originId);
                        }
                        return; 
                    }
                }
            }
        }

        if (aiFunds < 2000000) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
            return;
        }

        if (currentPlanes.length > maxAllowedPlanes || currentPlanes.length > totalRoutes * 2 + 1) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
        }

        let desiredType = null;
        if (currentYear >= 5 && aiFunds >= 250000000) desiredType = 'super';
        else if (currentYear >= 3 && aiFunds >= 100000000) desiredType = 'large';
        else if (currentYear >= 2 && aiFunds >= 40000000) desiredType = 'medium';
        else if (aiFunds >= 8000000) desiredType = 'small';

        if (desiredType) {
            const planeConf = CONFIG.ECONOMY.PLANES[desiredType];
            
            if (currentPlanes.length < maxAllowedPlanes && currentPlanes.length < totalRoutes * 1.8) {
                if (planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                    const success = this.planeManager.addPlane(desiredType, companyId);
                    if (success) {
                        this.economyManager.deductAiFunds(companyId, planeConf.cost);
                        return;
                    }
                }
            } 
            else if (desiredType !== 'small') {
                const hasSmallPlane = currentPlanes.some(p => p.sizeType === 'small');
                if (hasSmallPlane && planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                    let sold = false;
                    if (typeof this.planeManager.sellPlane === 'function') {
                        sold = this.planeManager.sellPlane('small', companyId);
                    }
                    if (sold) {
                        const smallConf = CONFIG.ECONOMY.PLANES.small;
                        const refund = smallConf ? (smallConf.cost * smallConf.sellRate) : 3500000;
                        this.economyManager.addAiFunds(companyId, refund);

                        const success = this.planeManager.addPlane(desiredType, companyId);
                        if (success) {
                            this.economyManager.deductAiFunds(companyId, planeConf.cost);
                            return;
                        }
                    }
                }
            }
        }

        const availableAirports = connectedAirports.filter(id => {
            const node = this.airportManager.getAirportById(id);
            if (!node) return false;
            const maxConn = this.networkManager.MAX_CONNECTIONS[node.type] || 5;
            const currentConn = this.networkManager.getConnectionCount(id, companyId);
            return currentConn < maxConn;
        });

        if (availableAirports.length > 0) {
            let targetAirportId = null;
            let lowestShare = 1.0;

            availableAirports.forEach(id => {
                const share = competitionManager ? competitionManager.getShare(id, companyId) : 1.0;
                if (share < lowestShare) {
                    lowestShare = share;
                    targetAirportId = id;
                }
            });

            if (!targetAirportId) {
                targetAirportId = availableAirports[Math.floor(Math.random() * availableAirports.length)];
            }

            const targetNode = this.airportManager.getAirportById(targetAirportId);
            if (targetNode) {
                this._expandRoute(companyId, targetNode);
            }
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