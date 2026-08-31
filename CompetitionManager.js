/**
 * AI可読性・先祖返り防止コメント:
 * 【AI満足度インフレの抑制（バランス調整）】
 * AIの満足度成長ロジックが強すぎてプレイヤーが必ず詰む問題を回避するため、
 * 路線数と総延長から算出される係数を大幅に下げ（12 -> 1.5）、さらに
 * 絶対的な上限値（プレイヤーのMAXに近い 500 等）のキャップを設けました。
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
        this.aiSatisfactions = {}; 
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
            
            let routeCount = 0;
            for (const originId in compNetwork) {
                if (compNetwork[originId]) {
                    routeCount += compNetwork[originId].length;
                }
            }
            routeCount = Math.floor(routeCount / 2);

            const netLength = this.networkManager.getTotalNetworkLength ? this.networkManager.getTotalNetworkLength(companyId) : 0;

            let satisfaction = 0;
            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
            } else {
                // ★変更: インフレを適正値へ抑制（係数をマイルドにし、上限500をセット）
                const scaleBonus = (routeCount * 1.5) + (Math.max(0, netLength) * 2.0);
                satisfaction = this.baseAiSatisfaction + scaleBonus;
                if (satisfaction > 500) satisfaction = 500; // 上限キャップ
                this.aiSatisfactions[companyId] = satisfaction;
            }

            // ネットワーク総延長ボーナスを全社平等に適用
            const basePower = routeCount * Math.pow(1.0 + (Math.max(0, satisfaction) / 100), 2.0);
            const netLengthBonus = Math.sqrt(Math.max(0, netLength)) * 0.1; 
            
            let power = 0;
            if (routeCount > 0) {
                power = basePower * (1.0 + netLengthBonus);
            }
            
            // NaN回避
            if (isNaN(power)) power = 0;

            for (const originId in compNetwork) {
                if (!airportPowers[originId]) airportPowers[originId] = {};
                
                if (compNetwork[originId] && compNetwork[originId].length > 0) {
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
    
    getAiSatisfaction(companyId) {
        return this.aiSatisfactions[companyId] !== undefined ? this.aiSatisfactions[companyId] : this.baseAiSatisfaction;
    }
}