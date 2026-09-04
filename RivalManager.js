/**
 * AI可読性・先祖返り防止コメント:
 * 【AI改善・ゲームバランス設計（動的機体キャップ・安全な配列撤退・時代アンロック＆安全リプレース・手詰まり防止）】
 * 1. 機体保有数の動的解放: 初期6機から毎年+4機拡張、モバイル負荷防止のため最大60機でキャップ。
 * 2. 資金条件の矛盾バグ解消と時代アンロック（2年目中型、3年目大型、5年目超大型）、sellIdlePlaneに一本化した安全なリプレース。
 * 3. 撤退時（シェア25%未満）の配列クローンによる安全な全路線削除（インデックスずれ・配列破壊の防止）。
 * 4. 路線開拓時、接続上限（MAX_CONNECTIONS）に達していない空きスロットのある空港のみをフィルタリングして手詰まりを解消。
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

        // ★改善2: 機体保有数の動的解放（初期6機、毎年+4機、最大60機キャップ）
        const currentYear = this.economyManager ? this.economyManager.year : 1;
        const maxAllowedPlanes = Math.min(60, 6 + (currentYear - 1) * 4);

        // ★改善4: シェア25%未満の不採算路線からの撤退（配列クローンによる安全な全路線削除）
        if (totalRoutes >= 2 && competitionManager) {
            for (const originId in net) {
                const originRoutes = net[originId];
                if (!originRoutes || originRoutes.length === 0) continue;
                
                const originShare = competitionManager.getShare(originId, companyId);
                if (originShare < 0.25) {
                    const originNode = this.airportManager.getAirportById(originId);
                    if (originNode) {
                        // 配列破壊・インデックスずれを防ぐためクローンを作成して全路線を安全に削除
                        const routesCopy = [...originRoutes];
                        routesCopy.forEach(destRoute => {
                            const destNode = this.airportManager.getAirportById(destRoute.id);
                            if (destNode) {
                                this.networkManager.removeRoute(originNode, destNode, companyId);
                            }
                        });
                        this.planeManager.checkAndReassignPlanes();
                        
                        // 撤退トーストの発火
                        if (this.onWithdraw) {
                            this.onWithdraw(companyId, originId);
                        }
                        return; // 1回の思考で1空港から完全撤退
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

        // 余剰機体の売却整理（動的上限超過時または路線過剰時）
        if (currentPlanes.length > maxAllowedPlanes || currentPlanes.length > totalRoutes * 2 + 1) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
        }

        // ★改善3: 機体購入条件の適正化（価格の1.5〜2倍基準）、時代アンロック、安全な小型機売却リプレース
        let desiredType = null;
        if (currentYear >= 5 && aiFunds >= 250000000) desiredType = 'super';
        else if (currentYear >= 3 && aiFunds >= 100000000) desiredType = 'large';
        else if (currentYear >= 2 && aiFunds >= 40000000) desiredType = 'medium';
        else if (aiFunds >= 8000000) desiredType = 'small';

        if (desiredType) {
            const planeConf = CONFIG.ECONOMY.PLANES[desiredType];
            
            // 通常購入（枠に空きがある場合）
            if (currentPlanes.length < maxAllowedPlanes && currentPlanes.length < totalRoutes * 1.8) {
                if (planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                    const success = this.planeManager.addPlane(desiredType, companyId);
                    if (success) {
                        this.economyManager.deductAiFunds(companyId, planeConf.cost);
                        return;
                    }
                }
            } 
            // ★上限到達時の小型機売却リプレース（sellIdlePlane(companyId)に一本化してプレイヤー機体の誤売却を完全に防止）
            else if (desiredType !== 'small') {
                const hasSmallPlane = currentPlanes.some(p => p.sizeType === 'small');
                if (hasSmallPlane && planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                    let soldType = null;
                    if (typeof this.planeManager.sellIdlePlane === 'function') {
                        soldType = this.planeManager.sellIdlePlane(companyId);
                    }
                    if (soldType) {
                        const soldConf = CONFIG.ECONOMY.PLANES[soldType];
                        const refund = soldConf ? (soldConf.cost * soldConf.sellRate) : 3500000;
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

        // ★改善5: 路線開拓手詰まりの防止（接続上限に達していない空きスロットのある空港のみをフィルタリング）
        const availableAirports = connectedAirports.filter(id => {
            const node = this.airportManager.getAirportById(id);
            if (!node) return false;
            const maxConn = this.networkManager.MAX_CONNECTIONS[node.type] || 5;
            const currentConn = this.networkManager.getConnectionCount(id);
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