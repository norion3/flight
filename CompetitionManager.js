/**
 * AI可読性・先祖返り防止コメント:
 * 【業界シェアと世界シェア（世界カバー率）の明確な分離】
 * 1. 既存のライバル間パワー比較による占有率（globalShares）は「業界シェア」として完全維持。
 * 2. 地球上の全空港数を母数とした「世界シェア（世界カバー率: getWorldShare）」メソッドを新設。
 * これにより、序盤に日本周辺を繋いだだけで世界シェアが60%超になる違和感を解消しました。
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
                netLength = this.networkManager.getAiTotalNetworkLength ? this.networkManager.getAiTotalNetworkLength(companyId) : 0;
                const scaleBonus = (routeCount * 1.5) + (Math.max(0, netLength) * 2.0);
                satisfaction = Math.min(400, this.baseAiSatisfaction + scaleBonus);
                this.aiSatisfactions[companyId] = satisfaction;
            }

            const satisfactionFactor = Math.pow(1.0 + (satisfaction / 100), 2.0);
            const netLengthBonus = 1.0 + (Math.sqrt(Math.max(0, netLength)) * 0.1);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    const routeFactor = Math.sqrt(routesCount);
                    const power = routeFactor * satisfactionFactor * netLengthBonus;
                    
                    airportPowers[originId][companyId] = power;
                    companyTotalPower[companyId] += power; 
                    worldTotalPower += power; 
                }
            }
        });

        // 業界内シェア（ライバル間でのパイ比率）
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
    
    // 業界シェア（ライバル間占有率）
    getGlobalShare(companyId) {
        return this.globalShares[companyId] || 0;
    }

    // ★追加: 地球全体の全空港数（約75箇所）を母数とした「世界シェア（世界カバー率）」
    getWorldShare(companyId = 'player') {
        const compNetwork = this.networkManager.network[companyId];
        if (!compNetwork) return 0;

        const connectedAirports = Object.keys(compNetwork).filter(id => compNetwork[id] && compNetwork[id].length > 0);
        const connectedCount = connectedAirports.length;
        
        // 地球上の全就航可能空港数（約75箇所）
        const TOTAL_WORLD_AIRPORTS = 75;
        return Math.min(1.0, connectedCount / TOTAL_WORLD_AIRPORTS);
    }
    
    getAiSatisfaction(companyId) {
        return this.aiSatisfactions[companyId] !== undefined ? this.aiSatisfactions[companyId] : this.baseAiSatisfaction;
    }
}