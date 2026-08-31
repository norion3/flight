/**
 * AI可読性・先祖返り防止コメント:
 * 【AI満足度の動的成長 ＆ ネットワーク延長ボーナスの全社適用】
 * AIの顧客満足度を固定値(150)から「事業規模の拡大（路線数・総延長）」に連動して
 * インフレ（動的成長）させるロジックに変更しました。また、プレイヤーのみが
 * 得ていた遠距離ボーナスをAIのパワー計算にも適用しています。
 */

import { CONFIG } from './Config.js';

export class CompetitionManager {
    constructor(networkManager, upgradeManager, rivalManager) {
        this.networkManager = networkManager;
        this.upgradeManager = upgradeManager;
        this.rivalManager = rivalManager;

        this.shares = {};
        this.globalShares = {}; 
        
        this.baseAiSatisfaction = 150; 
        this.aiSatisfactions = {}; // 各AIの現在の満足度を保持
    }

    update(delta) {
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        this.globalShares = {};
        const companies = CONFIG.COMPANIES;
        const airportPowers = {}; 
        
        let worldTotalPower = 0;
        const companyTotalPower = {};

        companies.forEach(comp => {
            const companyId = comp.id;
            companyTotalPower[companyId] = 0; 

            const compNetwork = this.networkManager.network[companyId];
            if (!compNetwork) return;
            
            // 路線数のカウント
            let routeCount = 0;
            for (const originId in compNetwork) {
                routeCount += compNetwork[originId].length;
            }
            routeCount = Math.floor(routeCount / 2);

            const netLength = this.networkManager.getTotalNetworkLength(companyId);

            let satisfaction = 0;
            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
            } else {
                // ★変更: AIの満足度を「事業規模の拡大」に連動して動的成長(インフレ)させる
                const scaleBonus = (routeCount * 3.5) + (netLength * 12);
                satisfaction = this.baseAiSatisfaction + scaleBonus;
                this.aiSatisfactions[companyId] = satisfaction;
            }

            // ★変更: ネットワーク総延長ボーナスを全社平等に適用する
            const basePower = routeCount * Math.pow(1.0 + (satisfaction / 100), 2.0);
            const netLengthBonus = Math.sqrt(netLength) * 0.1; 
            
            let power = 0;
            if (routeCount > 0) {
                power = basePower * (1.0 + netLengthBonus);
            }

            for (const originId in compNetwork) {
                if (!airportPowers[originId]) airportPowers[originId] = {};
                
                if (compNetwork[originId].length > 0) {
                    airportPowers[originId][companyId] = power;
                    companyTotalPower[companyId] += power; 
                    worldTotalPower += power; 
                }
            }
        });

        companies.forEach(comp => {
            this.globalShares[comp.id] = worldTotalPower > 0 ? (companyTotalPower[comp.id] / worldTotalPower) : 0;
        });

        for (const airportId in airportPowers) {
            const powers = airportPowers[airportId];
            
            let totalPower = 0;
            for (const cId in powers) {
                totalPower += (powers[cId] || 0);
            }

            if (totalPower <= 0) continue;

            this.shares[airportId] = {};
            for (const cId in powers) {
                this.shares[airportId][cId] = (powers[cId] || 0) / totalPower;
            }
        }
    }

    getShare(airportId, companyId = 'player') {
        if (!this.shares[airportId] || this.shares[airportId][companyId] === undefined) {
            const net = this.networkManager.network[companyId];
            if (net && net[airportId] && net[airportId].length > 0) {
                return 1.0; 
            }
            return 0;
        }
        return this.shares[airportId][companyId];
    }
    
    // ★追加: 外部（EconomyManagerなど）からAIの最新満足度を参照するためのゲッター
    getAiSatisfaction(companyId) {
        return this.aiSatisfactions[companyId] !== undefined ? this.aiSatisfactions[companyId] : this.baseAiSatisfaction;
    }
}