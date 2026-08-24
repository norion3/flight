/**
 * AI可読性・先祖返り防止コメント:
 * 【のんびりライバルAIと、拠点不在時のフォールバック】
 * 履歴192に基づき、指定した初期拠点空港がデータ上に存在しなかった場合でも、
 * 代わりの主要空港（Major）を自動で探し出して確実にスタートする安全弁を追加しました。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class RivalManager {
    constructor(networkManager, planeManager, airportManager) {
        this.networkManager = networkManager;
        this.planeManager = planeManager;
        this.airportManager = airportManager;
        this.actionTimer = 0;
        this.actionInterval = 5 + Math.random() * 5; 
        
        this.rivals = CONFIG.COMPANIES.filter(c => c.id !== 'player');
        this.isInitialized = false;
    }

    init() {
        // 各ライバル会社の初期スタート地点（拠点）の理想値
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
            
            // ★修正（安全弁）: 万が一、理想の拠点がデータ内に存在しなかった場合
            // 適当な主要空港（Major）を見つけて、そこから確実にスタートさせる
            if (!startNode) {
                const majors = this.airportManager.markers.map(m => m.userData.airportData).filter(d => d.type === 'major');
                if (majors.length > 0) {
                    startNode = majors[Math.floor(Math.random() * majors.length)];
                }
            }

            if (startNode) {
                // スタート時に空路を1本引き、飛行機を1機配置する
                this.expandNetwork(rival.id, startNode);
                this.planeManager.addPlane('small', rival.id);
            }
        });
        this.isInitialized = true;
    }

    update(delta) {
        if (!this.isInitialized) return;

        this.actionTimer += delta;
        // 8秒〜20秒の間隔でゆっくりと行動する
        if (this.actionTimer > this.actionInterval) {
            this.actionTimer = 0;
            this.actionInterval = 8 + Math.random() * 12; 

            const randomRival = this.rivals[Math.floor(Math.random() * this.rivals.length)];
            this.performAction(randomRival.id);
        }
    }

    performAction(companyId) {
        // 自社のネットワークに繋がっている空港のリストを取得
        const connectedIds = Object.keys(this.networkManager.network[companyId]).filter(id => this.networkManager.network[companyId][id].length > 0);
        if (connectedIds.length === 0) return;

        // 70%の確率で空路開拓、30%の確率で飛行機購入
        if (Math.random() < 0.7) {
            const originId = connectedIds[Math.floor(Math.random() * connectedIds.length)];
            const originNode = this.airportManager.getAirportById(originId);
            this.expandNetwork(companyId, originNode);
        } else {
            this.planeManager.addPlane('small', companyId);
        }
    }

    expandNetwork(companyId, originNode) {
        // 世界中の空港からランダムに候補を探す
        const candidates = this.airportManager.markers.map(m => m.userData.airportData);
        candidates.sort(() => Math.random() - 0.5); // シャッフル

        for (const destNode of candidates) {
            if (originNode.id === destNode.id) continue;
            if (this.networkManager.isConnected(originNode.id, destNode.id, companyId)) continue;
            
            // 航続距離の制限チェック（1.25倍）
            const posA = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);
            const posB = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
            if (posA.distanceTo(posB) > CONFIG.GLOBE_RADIUS * 1.25) continue;

            // 接続上限のチェック
            if (this.networkManager.canConnect(originNode, destNode, companyId)) {
                this.networkManager.addRoute(originNode, destNode, companyId);
                this.planeManager.wakeUpPlanes(companyId);
                break;
            }
        }
    }
}