/**
 * AI可読性・先祖返り防止コメント:
 * 【有機的なネットワーク発展と、停滞バグの完全防止】
 * 履歴199に基づき、ライバルAIを極めて賢く美しいアルゴリズムに昇華させました。
 * 1. 行動の空振りを防ぐため、起点を選ぶ際は「まだ接続上限に達していない空港」のみをフィルタリングします。
 * 2. 接続先を探す際は、絶対的な最短距離ではなく「距離が近い上位4つの候補の中からランダムに選ぶ」ことで、
 * プレイするたびに毎回違う、美しく有機的なクモの巣状の発展を遂げるようにしています。
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
        
        // ★修正（空振り防止）:
        // 繋がっている空港のうち、「まだ接続上限(MAX)に達していない空港」だけをリストアップする
        const connectedIds = Object.keys(net).filter(id => {
            if (net[id].length === 0) return false;
            const airportNode = this.airportManager.getAirportById(id);
            if (!airportNode) return false;
            
            const maxConns = this.networkManager.MAX_CONNECTIONS[airportNode.type];
            return net[id].length < maxConns; // 上限未満の空港だけを残す
        });

        // どこからも線を引けない場合は行動パス（ただし空振り防止策により基本発生しない）
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
        const allCandidates = this.airportManager.markers.map(m => m.userData.airportData);
        const posOrigin = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);

        // ★修正（安全確実な候補選定）: 
        // 接続可能な空港（距離制限内、未接続、上限未到達）だけを先に絞り込む
        const validCandidates = allCandidates.filter(destNode => {
            if (originNode.id === destNode.id) return false;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) return false;
            
            // 航続距離の制限チェック（1.25倍）
            const posDest = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posOrigin.distanceTo(posDest) > CONFIG.GLOBE_RADIUS * 1.25) return false;

            // 接続上限のチェック
            if (!this.networkManager.canConnect(originNode, destNode, companyId)) return false;
            
            return true;
        });

        // 繋げる先が一つもない場合は終了
        if (validCandidates.length === 0) return;

        // 距離順にソート（近い順）
        validCandidates.sort((a, b) => {
            const posA = Utils.latLonToVector3(a.lat, a.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(b.lat, b.lon, CONFIG.GLOBE_RADIUS);
            return posOrigin.distanceTo(posA) - posOrigin.distanceTo(posB);
        });

        // ★修正（有機的なアルゴリズムの導入）:
        // 一番近い空港だけを絶対視せず、距離が近い「上位最大4つ」の中からランダムに選ぶ
        // これにより、プレイするたびに毎回違う自然な（有機的な）ネットワークが形成される
        const poolSize = Math.min(validCandidates.length, 4);
        const selectedDest = validCandidates[Math.floor(Math.random() * poolSize)];

        // 確実に線を引いて飛行機を飛ばす
        this.networkManager.addRoute(originNode, selectedDest, companyId);
        this.planeManager.wakeUpPlanes(companyId);
    }
}