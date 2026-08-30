/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2: ライバル状況UIの実データ化】
 * 各空港のシェア計算のついでに、全世界の総パワーと各社の累計パワーを算出し、
 * 誰が世界シェア1位なのか（globalShares）を正確に計算・提供できるようにしました。
 */

import { CONFIG } from './Config.js';

export class CompetitionManager {
    constructor(networkManager, upgradeManager, rivalManager) {
        this.networkManager = networkManager;
        this.upgradeManager = upgradeManager;
        this.rivalManager = rivalManager;

        this.shares = {};
        this.globalShares = {}; // ★追加: 全世界シェアランキング用データ
        this.baseAiSatisfaction = 150; 
    }

    update(delta) {
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        this.globalShares = {};
        const companies = CONFIG.COMPANIES;
        const airportPowers = {}; 
        
        // ★全世界シェア計算用変数
        let worldTotalPower = 0;
        const companyTotalPower = {};

        companies.forEach(comp => {
            const companyId = comp.id;
            companyTotalPower[companyId] = 0; // 初期化

            const compNetwork = this.networkManager.network[companyId];
            if (!compNetwork) return;

            let satisfaction = 0;
            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
            } else {
                satisfaction = this.baseAiSatisfaction;
            }

            const satisfactionFactor = Math.pow(1.0 + (satisfaction / 100), 2.0);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    const routeFactor = Math.sqrt(routesCount);
                    const power = routeFactor * satisfactionFactor;
                    
                    airportPowers[originId][companyId] = power;
                    companyTotalPower[companyId] += power; // ★自社の総パワー加算
                    worldTotalPower += power; // ★世界の総パワー加算
                }
            }
        });

        // ★各社の全世界シェア率を計算
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

    // 特定の空港におけるシェア取得
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
    
    // ★追加: 全世界シェア率の取得（UIランキング用）
    getGlobalShare(companyId) {
        return this.globalShares[companyId] || 0;
    }
}