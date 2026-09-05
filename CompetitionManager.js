/**
 * AI可読性・先祖返り防止コメント:
 * 【接続数配点強化（10➔25点） ＆ 満足度係数マイルド化（0.15） ＆ AI初期満足度100 ＆ 全機能完全保持】
 * 1. 空港スコア計算式を `(connections * 25) + (satisfaction * 0.15)` に改修。
 *    接続数（空路ネットワーク規模）の価値を大幅に高め、参入直後の即時撤退を防止。
 * 2. AIの基礎顧客満足度初期値を 70 ➔ 100 に引き上げ、創業時の老舗ライバルとしての実力を適正化。
 * 3. プレイヤー満足度の400キャップ撤廃、AI満足度年度成長式（毎年+35）、世界シェア計算等は100%完全保持。
 * 4. 【追加】就航アクティブ制に基づき、実際に飛行機が飛んだ実績のある路線（isOperational）のみを接続数としてカウント。
 */

import { CONFIG } from './Config.js';

export class CompetitionManager {
    constructor(networkManager, upgradeManager, rivalManager, airportManager) {
        this.networkManager = networkManager;
        this.upgradeManager = upgradeManager;
        this.rivalManager = rivalManager;
        this.airportManager = airportManager; // 全空港データ参照用

        this.shares = {};
        this.globalShares = {}; 
        this.baseAiSatisfaction = 100; // ★初期基準値を 70 ➔ 100 へ引き上げ
        this.currentYear = 1;
        
        this.aiBaseOffsets = {};
    }

    update(delta, year = 1) {
        this.currentYear = year;
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        this.globalShares = {};

        const companyScores = {};
        let totalCompanyScores = 0;

        CONFIG.COMPANIES.forEach(comp => {
            companyScores[comp.id] = 0;
        });

        for (const companyId in this.networkManager.network) {
            const compNetwork = this.networkManager.network[companyId];
            
            let satisfaction = 0;
            if (companyId === 'player') {
                const baseSat = this.upgradeManager ? this.upgradeManager.getBonuses().satisfaction : 100;
                const eventSat = this.upgradeManager ? (this.upgradeManager.eventSatisfactionBonus || 0) : 0;
                satisfaction = Math.max(0, baseSat + eventSat);
            } else {
                satisfaction = this.getAiSatisfaction(companyId);
            }

            for (const airportId in compNetwork) {
                // ★就航アクティブ制: 実際に飛行機が飛んだ実績のある路線（isOperational）のみを接続数としてカウント
                const connections = compNetwork[airportId].filter(r => r.isOperational).length;
                if (connections === 0) continue;

                if (!this.shares[airportId]) {
                    this.shares[airportId] = {};
                }

                // ★修正: 接続数を10点➔25点へ引き上げ、満足度係数を0.2➔0.15に調整
                const score = (connections * 25) + (satisfaction * 0.15);
                this.shares[airportId][companyId] = score;

                companyScores[companyId] += score;
                totalCompanyScores += score;
            }
        }

        for (const airportId in this.shares) {
            const airportShares = this.shares[airportId];
            let totalScore = 0;
            
            for (const companyId in airportShares) {
                totalScore += airportShares[companyId];
            }

            for (const companyId in airportShares) {
                airportShares[companyId] = totalScore > 0 ? airportShares[companyId] / totalScore : 0;
            }
        }

        CONFIG.COMPANIES.forEach(comp => {
            if (totalCompanyScores > 0) {
                this.globalShares[comp.id] = companyScores[comp.id] / totalCompanyScores;
            } else {
                this.globalShares[comp.id] = comp.id === 'player' ? 1.0 : 0.0;
            }
        });
    }

    getShare(airportId, companyId = 'player') {
        if (!this.shares[airportId]) return 0;
        return this.shares[airportId][companyId] || 0;
    }

    getGlobalShare(companyId = 'player') {
        return this.globalShares[companyId] || 0;
    }

    getWorldShare(companyId = 'player') {
        const compNetwork = this.networkManager.network[companyId];
        if (!compNetwork) return 0;

        const rankWeights = { 'major': 5, 'local': 2, 'fictional': 1 };
        
        let totalWorldPoints = 0;
        if (this.airportManager && this.airportManager.markers && this.airportManager.markers.length > 0) {
            this.airportManager.markers.forEach(m => {
                const type = m.userData && m.userData.airportData ? m.userData.airportData.type : 'fictional';
                totalWorldPoints += (rankWeights[type] || 1);
            });
        }
        if (totalWorldPoints <= 0) totalWorldPoints = 350;

        let connectedPoints = 0;
        for (const airportId in compNetwork) {
            if (compNetwork[airportId] && compNetwork[airportId].length > 0) {
                let airportType = 'fictional';
                if (this.airportManager && this.airportManager.getAirportById) {
                    const node = this.airportManager.getAirportById(airportId);
                    if (node) airportType = node.type;
                }
                connectedPoints += (rankWeights[airportType] || 1);
            }
        }

        return Math.min(1.0, connectedPoints / totalWorldPoints);
    }
    
    // ★AI満足度: 初期値100付近、毎年+35成長、上限2500キャップ
    getAiSatisfaction(companyId) {
        if (!this.aiBaseOffsets[companyId]) {
            this.aiBaseOffsets[companyId] = this.baseAiSatisfaction + (Math.random() * 10 - 5);
        }
        const year = this.currentYear || 1;
        const growth = (year - 1) * 35;
        return Math.min(2500, Math.round(this.aiBaseOffsets[companyId] + growth));
    }
}