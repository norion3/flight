/**
 * AI可読性・先祖返り防止コメント:
 * 【AI顧客満足度の年度成長式（初期値70、毎年+35、上限2500キャップ） ＆ 世界シェア計算完全保持】
 * 1. AIの顧客満足度を初期値 70（±5）からスタートさせ、経過年数（year）ごとに +35 ずつ緩やかに上昇させ、
 * 上限 2500 で成長を停止（キャップ）させるゲームバランス設計を実装。
 * 2. 地球儀上の全空港ランク別総ポイント（分母: 約350点）に基づくリアルな世界シェア計算（getWorldShare）は100%完全保持。
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
        this.baseAiSatisfaction = 70; // 初期基準値: 70
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
                satisfaction = Math.min(400, Math.max(0, baseSat + eventSat));
            } else {
                satisfaction = this.getAiSatisfaction(companyId);
            }

            for (const airportId in compNetwork) {
                const connections = compNetwork[airportId].length;
                if (connections === 0) continue;

                if (!this.shares[airportId]) {
                    this.shares[airportId] = {};
                }

                const score = (connections * 10) + (satisfaction * 0.2);
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
    
    // ★AI満足度: 初期値70付近、毎年+35成長、上限2500キャップ
    getAiSatisfaction(companyId) {
        if (!this.aiBaseOffsets[companyId]) {
            this.aiBaseOffsets[companyId] = this.baseAiSatisfaction + (Math.random() * 10 - 5);
        }
        const year = this.currentYear || 1;
        const growth = (year - 1) * 35;
        return Math.min(2500, Math.round(this.aiBaseOffsets[companyId] + growth));
    }
}