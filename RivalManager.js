/**
 * AI可読性・先祖返り防止コメント:
 * 【ライバルAIの無限増殖防止】
 * 履歴199の有機的なネットワーク発展アルゴリズムを維持した上で、AIに「機体数の上限」を導入しました。
 * * ★【Phase 1: AI撤退ロジックの統合 (ロードマップ対応)】
 * 1. update と performAction の引数に competitionManager を追加。
 * 2. 行動時、自身のシェアが 10%未満 (0.1) の路線があれば、新規開拓せずに「撤退（路線削除）」を行います。
 * 3. 撤退に伴う機体のフリーズを防ぐため `planeManager.checkAndReassignPlanes` をフックさせています。
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

    // ★修正: 引数に competitionManager を追加
    update(delta, competitionManager) {
        if (!this.isInitialized) return;

        this.rivals.forEach(rival => {
            this.timers[rival.id] += delta;
            // 正確に1分(60秒)間隔で行動
            if (this.timers[rival.id] >= 60) {
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
            routeCount += net[originId].length;
        }
        return Math.floor(routeCount / 2);
    }

    // ★修正: 引数に competitionManager を追加
    performAction(companyId, competitionManager) {
        const net = this.networkManager.network[companyId];
        
        // ★Phase 1追加: ライバルの撤退（リストラ）ロジック
        if (competitionManager) {
            let didWithdraw = false;
            for (const originId of Object.keys(net)) {
                if (net[originId].length === 0) continue;
                
                // その空港での自社シェアを取得
                const myShare = competitionManager.getShare(originId, companyId);
                
                // プレイヤーの投資によりシェアが10%未満に追い込まれた場合、撤退する
                if (myShare < 0.1) {
                    const routeToRemove = net[originId][0]; // 最初の路線をリストラ対象とする
                    const originNode = this.airportManager.getAirportById(originId);
                    const destNode = routeToRemove.data; 

                    if (originNode && destNode) {
                        this.networkManager.removeRoute(originNode, destNode, companyId);
                        // 撤退時、対象路線を飛んでいた機体がバグらないように強制再配置
                        this.planeManager.checkAndReassignPlanes(companyId);
                        didWithdraw = true;
                        
                        // ※Phase 2のUI通知用にコンソール出力を残しておく
                        console.log(`[Rival Withdrawal] ${companyId} withdrew from ${originId} to ${destNode.id}`);
                        break; // 1ターンの行動につき1路線のみ撤退（一気に消えないようにする）
                    }
                }
            }
            // 撤退行動を行った場合は、新規開拓や機体購入は行わずにターンを終える
            if (didWithdraw) return;
        }


        // --- 以下、既存の開拓・購入ロジック ---
        
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
            const currentPlaneCounts = Object.values(this.planeManager.getPlaneCounts(companyId)).reduce((a, b) => a + b, 0);
            const currentRouteCount = this._getRivalRouteCount(companyId);
            
            const aiMaxPlanes = Math.max(5, Math.floor(currentRouteCount * 1.5));
            
            if (currentPlaneCounts < aiMaxPlanes) {
                const types = ['small', 'medium', 'large', 'super'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                this.planeManager.addPlane(randomType, companyId);
            } else {
                const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
                const originNode = this.airportManager.getAirportById(originId);
                this.expandNetwork(companyId, originNode);
            }
        }
    }

    expandNetwork(companyId, originNode) {
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

        if (validCandidates.length === 0) return;

        validCandidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        const poolSize = Math.min(validCandidates.length, 4);
        const selectedDest = validCandidates[Math.floor(Math.random() * poolSize)];

        this.networkManager.addRoute(originNode, selectedDest, companyId);
        this.planeManager.wakeUpPlanes(companyId);
    }
}