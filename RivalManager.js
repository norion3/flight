/**
 * AI可読性・先祖返り防止コメント:
 * 【撤退シェア35% ＆ 1サイクル猶予 ＆ 放射状路線の形成アルゴリズム ＆ 機体リプレース拡張 ＆ 大型機長距離開拓優遇】
 * 1. 撤退基準を 35% 未満（originShare < 0.35）とし、猶予カウンターを1サイクル（約22秒）に短縮。
 *    これにより、プレイヤーが圧倒した際のスピーディな制圧テンポと爽快感を実現。
 * 2. 路線開拓（_expandRoute）時に、既存路線とのベクトル（方角）のなす角を計算し、
 *    同じ方角（45度以内、短距離・密集地域では約25度以内）にある空港に動的ペナルティを与えるアルゴリズムを導入。
 *    これにより、欧州等の密集地域での開拓停止を防ぎつつ、放射状の美しい路線網を形成。
 * 3. 機体リプレースのトランザクション保護（Config参照による動的売却額計算）、全滅時メッシュ完全破棄、
 *    画面実在空港（activeAirports）連動、自律リストラ・再生融資は100%完全保持。
 * 4. 【5大対策仕様】就航アクティブ制に基づき、競合他社の就航路線（isOperational === true）の存在判定に移行（ミリ秒瞬間判定の運ゲー化を根絶）。
 * 5. 【改善】機体リプレース時、小型機に限定せず保有中の「最小サイズ機（desiredType未満）」を下取り売却できるよう拡張。
 * 6. 【改善】大型機・超大型機（large/super）保有時は長距離（dist >= 1.8）路線を開拓しやすくなるよう優遇重み付けを導入。
 * 7. 【Step 4追加】AI思考タイマーおよび撤退猶予カウンターの抽出（getRivalState）と復元（restoreRivalState）を実装。
 * 8. 【5大対策仕様】方角ペナルティに上限キャップ（+30）と近距離（dist < 1.4）50%減衰を導入し、オセアニア・アフリカAIの開拓停止を解消。
 * 
 * 【ムー大陸ライバル接続完全除外（改善反映）】
 * 9. 【MU候補完全除外】路線開拓（_expandRoute）時の候補先判定、および拠点選定（availableAirports）から
 *    ムー中央古代空港（MU）を完全除外。ライバルAIがムー大陸へ進出する挙動を根本から100%遮断。
 * 
 * 【ゲームバランス改善 Phase 2: ライバルAI機体数上限の適正化】
 * 10. プレイヤー最大200機基準化に伴い、ライバル各社の機体保有上限キャップを最大60機から40機へ調整。
 *     世界全体で約350機が快適かつ軽快に飛び交う適正バランスを実現。
 * 
 * 【Phase 1: カルテル包囲網 AI相互不侵犯 ＆ プレイヤー空港集中攻撃ルーチン】
 * 11. 【ライバル間カニバリズム停止】カルテル期間中（isCartelActive）、ライバル同士が同じ空港にいても撤退判定を行わず、
 *     プレイヤー（'player'）の就航路線が存在する場合のみ撤退カウンターを加算。
 * 12. 【プレイヤー空港への集中攻撃】カルテル期間中、路線開拓の候補先選定（_expandRoute）において、
 *     プレイヤーが就航している空港に -3.0 の強力な優先ボーナスを付与し、包囲網として集中就航。
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
        this.withdrawCounters = {}; // 空港ごとの撤退猶予カウンター { companyId: { airportId: count } }

        this.rivals.forEach(rival => {
            this.timers[rival.id] = Math.random() * 20; // 0〜20秒の初期乱数
            this.withdrawCounters[rival.id] = {};
        });

        this.isInitialized = false;
        this.onWithdraw = null; 
        this.onRevive = null;
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
        
        // ★AI不死鳥リベンジ（全路線喪失時の別所再起・復活処理）
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

        // 機体保有数の動的解放（初期6機、毎年+4機、最大40機キャップ）
        const currentYear = this.economyManager ? this.economyManager.year : 1;
        const maxAllowedPlanes = Math.min(40, 6 + (currentYear - 1) * 4);

        // ★Phase 1改訂: カルテル発動状態の取得
        const isCartel = competitionManager && competitionManager.isCartelActive;

        // ★撤退シェア基準 35% 未満 ＆ 1サイクル（約22秒）猶予カウンター
        if (competitionManager) {
            for (const originId in net) {
                const originRoutes = net[originId];
                if (!originRoutes || originRoutes.length === 0) continue;
                
                const originShare = competitionManager.getShare(originId, companyId);

                // ★Phase 1: カルテル中は「自社（プレイヤー）」の就航路線がある場合のみ撤退判定。他社AI同士の共食い・撤退は完全停止！
                let hasCompetitorRoute = false;
                if (isCartel) {
                    const playerNet = this.networkManager.network['player'];
                    if (playerNet && playerNet[originId] && playerNet[originId].some(r => r.isOperational)) {
                        hasCompetitorRoute = true;
                    }
                } else {
                    for (const otherComp of CONFIG.COMPANIES) {
                        if (otherComp.id !== companyId && this.networkManager.network[otherComp.id]) {
                            const routesFromAirport = this.networkManager.network[otherComp.id][originId];
                            if (routesFromAirport && routesFromAirport.some(r => r.isOperational)) {
                                hasCompetitorRoute = true;
                                break;
                            }
                        }
                    }
                }

                // シェア35%未満かつ競合就航路線が存在する場合のみ撤退カウンターを加算
                if (originShare < 0.35 && hasCompetitorRoute) {
                    this.withdrawCounters[companyId][originId] = (this.withdrawCounters[companyId][originId] || 0) + 1;

                    // 1サイクル（約22秒）継続で撤退を実行
                    if (this.withdrawCounters[companyId][originId] >= 2) {
                        const originNode = this.airportManager.getAirportById(originId);
                        if (originNode) {
                            const routesCopy = [...originRoutes];
                            routesCopy.forEach(destRoute => {
                                const destNode = this.airportManager.getAirportById(destRoute.id);
                                if (destNode) {
                                    this.networkManager.removeRoute(originNode, destNode, companyId);
                                }
                            });

                            delete this.withdrawCounters[companyId][originId];
                            this.planeManager.checkAndReassignPlanes(companyId);
                            
                            // 撤退トーストの発火
                            if (this.onWithdraw) {
                                this.onWithdraw(companyId, originId);
                            }
                            return; // 1回の思考で1空港から撤退
                        }
                    }
                } else {
                    // シェアを持ち直したか、競合就航路線が存在しない場合はカウンターをリセット
                    if (this.withdrawCounters[companyId][originId]) {
                        delete this.withdrawCounters[companyId][originId];
                    }
                }
            }
        }

        // ★資金難時の自律リストラ＆セーフティネット（思考停止の完全防止）
        if (aiFunds < 2000000) {
            let soldType = this.planeManager.sellIdlePlane(companyId);

            if (!soldType && currentPlanes.length > 1) {
                if (typeof this.planeManager.sellPlane === 'function') {
                    const hasSmall = currentPlanes.some(p => p.sizeType === 'small');
                    const targetType = hasSmall ? 'small' : currentPlanes[0].sizeType;
                    if (this.planeManager.sellPlane(targetType, companyId)) {
                        soldType = targetType;
                    }
                }
            }

            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
                return;
            }

            if (currentPlanes.length <= 2 && aiFunds < 1000000 && this.economyManager) {
                this.economyManager.rescueAiFunds(companyId, 15000000);
                return;
            }
        }

        // 余剰機体の売却整理
        if (currentPlanes.length > maxAllowedPlanes || currentPlanes.length > totalRoutes * 2 + 1) {
            const soldType = this.planeManager.sellIdlePlane(companyId);
            if (soldType && this.economyManager) {
                const planeConf = CONFIG.ECONOMY.PLANES[soldType];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 2500000;
                this.economyManager.addAiFunds(companyId, refund);
            }
        }

        // 機体購入・リプレース（トランザクション保護）
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
                // desiredType より格下の機体を保有機の中から最小サイズ順（small -> medium -> large）で検索
                const sizeOrder = ['small', 'medium', 'large', 'super'];
                const desiredRank = sizeOrder.indexOf(desiredType);
                let smallerType = null;
                for (let i = 0; i < desiredRank; i++) {
                    if (currentPlanes.some(p => p.sizeType === sizeOrder[i])) {
                        smallerType = sizeOrder[i];
                        break;
                    }
                }

                if (smallerType && planeConf && this.economyManager.canAiAfford(companyId, planeConf.cost)) {
                    const success = this.planeManager.addPlane(desiredType, companyId);
                    if (success) {
                        this.economyManager.deductAiFunds(companyId, planeConf.cost);
                        
                        if (typeof this.planeManager.sellPlane === 'function') {
                            const sold = this.planeManager.sellPlane(smallerType, companyId);
                            if (sold) {
                                const smallerConf = CONFIG.ECONOMY.PLANES[smallerType];
                                const refund = smallerConf ? (smallerConf.cost * smallerConf.sellRate) : (CONFIG.ECONOMY.PLANES[smallerType].cost * CONFIG.ECONOMY.PLANES[smallerType].sellRate);
                                this.economyManager.addAiFunds(companyId, refund);
                            }
                        }
                        return;
                    }
                }
            }
        }

        // 路線開拓（自社の空きスロットのある空港のみを抽出 ＆ MU空港は完全除外）
        const availableAirports = connectedAirports.filter(id => {
            if (id === 'MU') return false; // ★MU空港除外
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
                this._expandRoute(companyId, targetNode, false, isCartel);
            }
        }
    }

    // ★安全かつ確実な不死鳥リベンジ（別所再起）処理
    _attemptRevival(companyId) {
        if (this.economyManager) {
            const currentFunds = this.economyManager.getAiFunds(companyId);
            if (currentFunds < 20000000) {
                this.economyManager.rescueAiFunds(companyId, 30000000);
            }
        }

        const allAirports = (this.airportManager.activeAirports && this.airportManager.activeAirports.length > 0)
            ? this.airportManager.activeAirports
            : this.airportManager.allAirports;

        // ★復活候補からもMU空港を完全除外
        const availableHubs = allAirports.filter(node => {
            if (node.id === 'MU') return false;
            const maxConn = this.networkManager.MAX_CONNECTIONS[node.type] || 5;
            const currentConn = this.networkManager.getConnectionCount(node.id, companyId);
            return currentConn === 0 && this.networkManager.getConnectionCount(node.id, 'player') < maxConn;
        });

        if (availableHubs.length === 0) return;

        const shuffledHubs = [...availableHubs].sort(() => Math.random() - 0.5);

        for (const candidateHub of shuffledHubs) {
            const success = this._expandRoute(companyId, candidateHub, true);
            if (success) {
                if (this.planeManager) {
                    if (typeof this.planeManager.removeAllPlanes === 'function') {
                        this.planeManager.removeAllPlanes(companyId);
                    } else if (Array.isArray(this.planeManager.planes)) {
                        this.planeManager.planes = this.planeManager.planes.filter(p => p.companyId !== companyId);
                    }
                }

                this.planeManager.addPlane('small', companyId);
                this.planeManager.addPlane('small', companyId);
                this.planeManager.wakeUpPlanes(companyId);

                const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
                const compName = comp ? comp.name : companyId;
                const message = `${compName} が新たな拠点で復活しました！`;

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
                break;
            }
        }
    }

    _expandRoute(companyId, originNode, isFree = false, isCartel = false) {
        const candidates = (this.airportManager.activeAirports && this.airportManager.activeAirports.length > 0)
            ? this.airportManager.activeAirports
            : this.airportManager.allAirports;

        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        // ★改善2: 既存路線の方向ベクトルを取得（放射状の美しい路線網を構築するため）
        const existingRoutes = this.networkManager.network[companyId] && this.networkManager.network[companyId][originNode.id] 
            ? this.networkManager.network[companyId][originNode.id] : [];
        const existingDestVectors = existingRoutes.map(r => {
            const destNode = this.airportManager.getAirportById(r.id);
            if (destNode) {
                return Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS).sub(posOrigin).normalize();
            }
            return null;
        }).filter(v => v !== null);

        const validCandidates = candidates.filter(destNode => {
            if (originNode.id === destNode.id) return false;
            if (destNode.id === 'MU') return false; // ★ライバルAIの候補からMU空港を完全除外
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) return false;
            
            const posDest = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) return false;

            if (!this.networkManager.canConnect(originNode, destNode, companyId)) return false;
            
            return true;
        });

        if (validCandidates.length === 0) return false;

        // ★大型機・超大型機保有判定（長距離路線優遇用）
        const compPlanes = this.planeManager.planes.filter(p => p.companyId === companyId);
        const hasWidebody = compPlanes.some(p => p.sizeType === 'super' || p.sizeType === 'large');

        // ★Phase 1: プレイヤーの就航空港ネットワーク参照
        const playerNet = this.networkManager.network['player'];

        validCandidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            
            const distA = posOrigin.distanceTo(posA);
            const distB = posOrigin.distanceTo(posB);

            let penaltyA = 0;
            let penaltyB = 0;

            const dirA = posA.clone().sub(posOrigin).normalize();
            const dirB = posB.clone().sub(posOrigin).normalize();

            // ★密集地域向けの開拓ペナルティ減衰: 短距離・密集区画（1.2未満）では判定角度を約25度（0.90）へ引き締め、ペナルティを+15に減衰
            const thresholdA = distA < 1.2 ? 0.90 : 0.707;
            const penaltyValA = distA < 1.2 ? 15 : 50;
            for (const existingDir of existingDestVectors) {
                if (dirA.dot(existingDir) > thresholdA) penaltyA += penaltyValA;
            }
            // ★5大対策仕様: 近距離（dist < 1.4）の有力候補都市に対しては方角ペナルティを50%減衰させ、累積上限キャップ(+30)を適用
            if (distA < 1.4) penaltyA *= 0.5;
            penaltyA = Math.min(30, penaltyA);

            const thresholdB = distB < 1.2 ? 0.90 : 0.707;
            const penaltyValB = distB < 1.2 ? 15 : 50;
            for (const existingDir of existingDestVectors) {
                if (dirB.dot(existingDir) > thresholdB) penaltyB += penaltyValB;
            }
            // ★5大対策仕様: 近距離（dist < 1.4）の有力候補都市に対しては方角ペナルティを50%減衰させ、累積上限キャップ(+30)を適用
            if (distB < 1.4) penaltyB *= 0.5;
            penaltyB = Math.min(30, penaltyB);

            // ★改善: 大型・超大型機保有時は中長距離（dist >= 1.8）の距離スコアを優遇（割り引き）
            const bonusA = (hasWidebody && distA >= 1.8) ? -1.5 : 0;
            const bonusB = (hasWidebody && distB >= 1.8) ? -1.5 : 0;

            // ★Phase 1新設: カルテル期間中は「プレイヤーがいる空港」への就航を最優先（スコア-3.0の強力ボーナス）
            let cartelBonusA = 0;
            let cartelBonusB = 0;
            if (isCartel && playerNet) {
                if (playerNet[a.id] && playerNet[a.id].length > 0) cartelBonusA = -3.0;
                if (playerNet[b.id] && playerNet[b.id].length > 0) cartelBonusB = -3.0;
            }

            const scoreA = distA + penaltyA + bonusA + cartelBonusA;
            const scoreB = distB + penaltyB + bonusB + cartelBonusB;

            return scoreA - scoreB;
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

    /**
     * 【Step 4追加】AI4社の思考タイマーおよび撤退猶予カウンターを抽出
     * @returns {Object} { timers, withdrawCounters }
     */
    getRivalState() {
        return {
            timers: { ...this.timers },
            withdrawCounters: JSON.parse(JSON.stringify(this.withdrawCounters))
        };
    }

    /**
     * 【Step 4追加】セーブデータからAI思考タイマー・撤退カウンターを復元
     * @param {Object} state - { timers, withdrawCounters }
     */
    restoreRivalState(state) {
        if (!state) return;
        if (state.timers) {
            for (const id in state.timers) {
                if (this.timers[id] !== undefined) this.timers[id] = state.timers[id];
            }
        }
        if (state.withdrawCounters) {
            this.withdrawCounters = JSON.parse(JSON.stringify(state.withdrawCounters));
        }
    }
}