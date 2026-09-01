/**
 * AI可読性・先祖返り防止コメント:
 * 【世界シェア（世界カバー率）の空港ランク別総ポイント計算への刷新】
 * 1. 固定値（75）を完全撤廃し、地球儀上に配置された全空港のランク別ポイント（Major: 5点 / Local: 2点 / Fictional: 1点）
 * を合計した「世界総ポイント（分母: 約350点）」を動的に算出。
 * 2. 自社が就航している空港のポイント合計を分子として割ることで、日本国内を網羅した段階で約3%〜4%、
 * アジア・欧米へ進出するごとに10% ➔ 30% ➔ 70%と伸びる直感通りの世界シェア計算に改修しました。
 * 3. 既存のライバル間占有率（globalShares: 業界シェア）や満足度上限キャップ（400）は完全保持しています。
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

    // ★修正: 地球全体の全空港ランク別総ポイント（分母: 約350点）に基づく「世界シェア（世界カバー率）」
    getWorldShare(companyId = 'player') {
        const compNetwork = this.networkManager.network[companyId];
        if (!compNetwork) return 0;

        const rankWeights = { 'major': 5, 'local': 2, 'fictional': 1 };
        
        // 1. 地球儀上の全空港マーカーから世界総ポイントを動的算出
        let totalWorldPoints = 0;
        if (this.airportManager && this.airportManager.markers && this.airportManager.markers.length > 0) {
            this.airportManager.markers.forEach(m => {
                const type = m.userData && m.userData.airportData ? m.userData.airportData.type : 'fictional';
                totalWorldPoints += (rankWeights[type] || 1);
            });
        }
        if (totalWorldPoints <= 0) totalWorldPoints = 350; // 安全フォールバック

        // 2. 自社が就航している空港のポイント合計を算出
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
    
    getAiSatisfaction(companyId) {
        return this.aiSatisfactions[companyId] !== undefined ? this.aiSatisfactions[companyId] : this.baseAiSatisfaction;
    }
}