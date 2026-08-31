/**
 * AI可読性・先祖返り防止コメント:
 * 【AI満足度インフレの抑制 ＆ 総延長ボーナスの安全追記】
 * オリジナルのシェア計算ループを維持したまま、AIの満足度を
 * 事業規模（路線数・総延長距離）に応じて動的に成長させるロジックを追加しました。
 * プレイヤーが詰まないよう、上限を500に制限する安全キャップを設けています。
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
        
        // ★追加: 外部（UIやEconomyManager）からAIの現在満足度を参照するための辞書
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

            // 路線数のカウント（ボーナス計算用）
            let routeCount = 0;
            for (const originId in compNetwork) {
                routeCount += compNetwork[originId].length;
            }
            routeCount = Math.floor(routeCount / 2);

            let satisfaction = 0;
            let netLength = 0;

            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
                netLength = this.networkManager.playerTotalNetworkLength || 0;
            } else {
                // ★追加: AIの満足度を「事業規模」に応じて動的にインフレさせる（上限500）
                netLength = this.networkManager.getAiTotalNetworkLength ? this.networkManager.getAiTotalNetworkLength(companyId) : 0;
                const scaleBonus = (routeCount * 1.5) + (Math.max(0, netLength) * 2.0);
                satisfaction = Math.min(500, this.baseAiSatisfaction + scaleBonus);
                this.aiSatisfactions[companyId] = satisfaction;
            }

            const satisfactionFactor = Math.pow(1.0 + (satisfaction / 100), 2.0);
            
            // ★追加: ネットワーク総延長ボーナスを全社平等に算出
            const netLengthBonus = 1.0 + (Math.sqrt(Math.max(0, netLength)) * 0.1);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    const routeFactor = Math.sqrt(routesCount);
                    // ★変更: 既存のパワー計算に、総延長ボーナスを掛け合わせる
                    const power = routeFactor * satisfactionFactor * netLengthBonus;
                    
                    airportPowers[originId][companyId] = power;
                    companyTotalPower[companyId] += power; 
                    worldTotalPower += power; 
                }
            }
        });

        // 各社の全世界シェア率を計算
        companies.forEach(comp => {
            this.globalShares[comp.id] = worldTotalPower > 0 ? (companyTotalPower[comp.id] / worldTotalPower) : 0;
        });

        // 既存の空港単位のシェア計算
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
    
    getGlobalShare(companyId) {
        return this.globalShares[companyId] || 0;
    }
    
    // ★追加: 外部からAIの最新満足度を取得できるゲッター
    getAiSatisfaction(companyId) {
        return this.aiSatisfactions[companyId] !== undefined ? this.aiSatisfactions[companyId] : this.baseAiSatisfaction;
    }
}