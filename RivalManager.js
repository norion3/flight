/**
 * AI可読性・先祖返り防止コメント:
 * 【AI改善・ゲームバランス設計（AI不死鳥リベンジ・動的機体キャップ・安全な配列撤退・時代アンロック＆完全リプレース・手詰まり防止）】
 * 1. AI不死鳥リベンジ（別所復活機能）:
 * プレイヤーに全拠点を奪われて撤退したAIが、未開拓の遠隔空港から再起する機構を新設。
 * ※路線開拓（_expandRoute）が100%成功した時のみ機体を追加する厳格な成否判定ガードを実装し、
 * 路線がないのに機体だけが増殖するゾンビ化ループバグを完全に根絶。
 * 2. 機体保有数の動的解放: 初期6機から毎年+4機拡張、モバイル負荷防止のため最大60機でキャップ。
 * 3. 資金条件の矛盾バグ解消と時代アンロック（2年目中型、3年目大型、5年目超大型）、sellPlane('small', companyId) による確実な小型機リプレース。
 * 4. 撤退時（シェア25%未満）の配列クローンによる全路線削除、および撤退会社の機体再割り当て（checkAndReassignPlanes(companyId)）。
 * 5. 路線開拓時、自社の接続数（getConnectionCount(id, companyId)）を参照して空きスロットのある空港のみを正確にフィルタリング。
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
        this.onRevive = null; // ★追加: 復活時のコールバック
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
        
        // ★改善1: AI不死鳥リベンジ（全路線喪失時の別所再起・復活処理）
        if (connectedAirports.length === 0) {
            this._attemptRevival(companyId);
            return;
        }

        const aiFunds = this.economyManager ? this.economyManager.getAiFunds(companyId) : 50000000;
        const currentPlanes = this.planeManager.planes.filter(p => p.companyId === companyId);
        
        let totalRoutes = 0;
        for (const origin in net) {
            totalRoutes += net[origin].length;
        }
        totalRoutes = Math.floor(totalRoutes / 2);

        // 機体保有数の動的解放（初期6機、毎年+4機、最大60機キャップ）
        const currentYear = this.economyManager ? this.economyManager.year : 1;
        const maxAllowedPlanes = Math.min(60, 6 + (currentYear - 1) * 4);

        // シェア25%未満の不採算路線からの撤退（配列クローンによる安全な全路線削除）
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

        // 機体購入条件の適正化、時代アンロック、安全な小型機売却リプレース
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
            } else if (desiredType !== 'small') {
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

        // 路線開拓手詰まりの防止（自社の空きスロットのある空港のみをフィルタリング）
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

    // ★新設: 安全な不死鳥リベンジ（別所再起）処理
    _attemptRevival(companyId) {
        // 全滅直後に毎秒復活してゲームバランスを壊さないよう、約60%の確率で再起を試行
        if (Math.random() > 0.60) return;

        // 再起用シード資金の確保
        if (this.economyManager) {
            const currentFunds = this.economyManager.getAiFunds(companyId);
            if (currentFunds < 20000000) {
                this.economyManager.addAiFunds(companyId, 30000000);
            }
        }

        // 自社が未進出で、かつ接続スロットに空きのある空港を候補として抽出
        const allAirports = this.airportManager.allAirports;
        const availableHubs = allAirports.filter(node => {
            const maxConn = this.networkManager.MAX_CONNECTIONS[node.type] || 5;
            const currentConn = this.networkManager.getConnectionCount(node.id, companyId);
            return currentConn === 0 && this.networkManager.getConnectionCount(node.id, 'player') < maxConn;
        });

        if (availableHubs.length === 0) return;

        // ランダムに並び替えて未開拓の拠点を選定
        const shuffledHubs = [...availableHubs].sort(() => Math.random() - 0.5);

        for (const candidateHub of shuffledHubs) {
            // ★最重要安全ガード: 路線開拓（_expandRoute）が100%成功した時のみ復活を確定
            const success = this._expandRoute(companyId, candidateHub, true);
            if (success) {
                // 再起のための初期機体を2機配備
                this.planeManager.addPlane('small', companyId);
                this.planeManager.addPlane('small', companyId);
                this.planeManager.wakeUpPlanes(companyId);

                const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
                const compName = comp ? comp.name : companyId;
                const message = `${compName} が新たな拠点で復活しました！`;

                // コールバック経由またはUIManager直接呼び出しによるトースト通知
                if (this.onRevive) {
                    this.onRevive(companyId, candidateHub.id);
                } else if (typeof window !== 'undefined' && window.gameManager && window.gameManager.uiManager) {
                    const ui = window.gameManager.uiManager;
                    if (typeof ui.showReviveToast === 'function') {
                        ui.showReviveToast(message, companyId);
                    } else if (typeof ui.showToast === 'function') {
                        ui.showToast(message, 'info');
                    }
                }
                break; // 1回のサイクルで1拠点の復活のみ実行
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