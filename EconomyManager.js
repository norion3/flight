/**
 * AI可読性・先祖返り防止コメント:
 * 【年間客数のHUDリアルタイム連動 ＆ 収益・累計客数の単位短縮表示】
 * 1. `updateTopHUD` への引数受け渡しに `yearlyPassengersStr`（年間客数・カンマ区切り実数）を追加し、
 * 年間客数が毎秒リアルタイムにカウントアップするよう修正。
 * 2. 収益表示（incomeStr）を `_formatMoneyNumber` 経由の短縮表示（+$ 15K 等）へ復旧。
 * 3. 累計客数（passengersStr）を 100万人以上で M/B 短縮表示（1.25M 等）に最適化。
 * 4. 4月期首〜翌3月期末の会計年度サイクル、満足度スナップショット、AI自立経済等は100%完全保持しています。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class EconomyManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.funds = CONFIG.ECONOMY.INITIAL_FUNDS;
        this.incomePerSecond = 0; 
        this.displayIncome = 0;   
        
        this.incomeTimer = 0;
        this.grossIncomeBuffer = 0;
        this.upkeepBuffer = 0;
        
        this.lastSecondIncome = 0;
        this.isFirstSecond = true; 

        this.totalPassengers = 0;
        
        // 年次客数・ハイスコアデータ基盤（4月〜翌3月期対応）
        this.yearlyPassengers = 0;        // 当年の年間客数 (4月〜翌3月分)
        this.lastYearPassengers = null;   // 前年の確定年間客数
        this.bestYearlyPassengers = 0;    // 歴代最高の年間客数
        this.annualHistory = [];          // 過去の年度別決算ログ

        this.monthTimer = 0;
        this.year = 1;
        this.month = 4; // 会計年度に合わせ 4月スタート
        
        this.historyData = {
            'player': []
        };
        
        this.maxPlanes = CONFIG.ECONOMY.MAX_PLANES_INITIAL;

        this.aiFunds = {};
        this.aiLastIncome = {};
        this.aiTotalPassengers = {};
        this.aiYearlyPassengers = {}; 
        
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                this.aiFunds[comp.id] = CONFIG.ECONOMY.AI_INITIAL_FUNDS;
                this.aiLastIncome[comp.id] = 0;
                this.aiTotalPassengers[comp.id] = 0;
                this.aiYearlyPassengers[comp.id] = 0;
                this.historyData[comp.id] = [];
            }
        });
    }

    update(delta, planes, networkManager, upgradeManager, competitionManager, eventManager = null) {
        const bonuses = upgradeManager ? upgradeManager.getBonuses() : { incomeRate: 1.0, satisfaction: 100 };
        const eventBuffs = eventManager ? eventManager.getBuffs() : { incomeRate: 0, passengersRate: 0 };
        
        const finalIncomeRate = bonuses.incomeRate * (1.0 + eventBuffs.incomeRate);
        const finalPassengersRate = 1.0 + eventBuffs.passengersRate;

        this.incomeTimer += delta;
        this.monthTimer += delta;

        // 4月〜12月 ➔ 1月〜3月 ➔ 4月（新年度・決算）の会計年度ループ
        if (this.monthTimer >= 20.0) {
            this.monthTimer = 0;
            this.month++;
            if (this.month > 12) {
                this.month = 1;
            }
            if (this.month === 4) {
                this.year++;
                this._finalizeAnnualStats();
            }
            this._recordMonthlyHistory(competitionManager);
        }

        const playerPlanes = planes.filter(p => p.companyId === 'player');
        let currentGrossPerSec = 0;
        let currentUpkeepPerSec = 0;

        playerPlanes.forEach(plane => {
            const conf = CONFIG.ECONOMY.PLANES[plane.sizeType];
            if (!conf) return;

            currentUpkeepPerSec += conf.upkeep;

            if (plane.currentRoute && plane.progress < 1.0) {
                const routeLength = plane.currentRoute.length;
                const distBonus = Math.min(1.5, routeLength / 5.0); 

                const originShare = competitionManager ? competitionManager.getShare(plane.currentAirportId, 'player') : 1.0;
                const destShare = competitionManager ? competitionManager.getShare(plane.currentRoute.id, 'player') : 1.0;
                const avgShare = (originShare + destShare) / 2;

                const baseInc = conf.incomeBase;
                const satBonus = 1.0 + (bonuses.satisfaction * 0.005);
                const grossIncome = baseInc * satBonus * (1.0 + distBonus) * finalIncomeRate * (0.6 + avgShare * 0.8);

                currentGrossPerSec += grossIncome;

                const baseDemand = conf.baseDemand || 50;
                const passengers = (baseDemand * (1.0 + bonuses.satisfaction * 0.005) * avgShare * finalPassengersRate) * delta;
                
                this.totalPassengers += passengers;
                this.yearlyPassengers += passengers;
            }
        });

        this.grossIncomeBuffer += currentGrossPerSec * delta;
        this.upkeepBuffer += currentUpkeepPerSec * delta;

        this._updateAiEconomy(delta, planes, networkManager, competitionManager);

        if (this.incomeTimer >= 1.0) {
            const netIncome = this.grossIncomeBuffer - this.upkeepBuffer;
            
            this.funds += netIncome;
            this.lastSecondIncome = netIncome;
            this.displayIncome = Math.round(netIncome);

            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
            this.incomeTimer = 0;

            const calendarStr = `${this.year}年目-${this.month}月`;
            const fundsStr = this._formatMoney(this.funds);
            
            // ★修正: 収益を K / M などの短縮表示に復旧
            const incomeStr = (this.displayIncome >= 0 ? "+$" : "-$") + this._formatMoneyNumber(Math.abs(this.displayIncome));
            
            // ★修正: 年間客数（完全実数・カンマ区切り）
            const yearlyPassengersStr = this._formatNumber(this.yearlyPassengers);
            
            // ★修正: 累計客数（100万人以上で M/B 短縮表示）
            let passengersStr = '';
            if (this.totalPassengers >= 1000000000) {
                passengersStr = (this.totalPassengers / 1000000000).toFixed(2) + 'B';
            } else if (this.totalPassengers >= 1000000) {
                passengersStr = (this.totalPassengers / 1000000).toFixed(2) + 'M';
            } else {
                passengersStr = this._formatNumber(this.totalPassengers);
            }
            
            const rawWorldShare = competitionManager ? competitionManager.getWorldShare('player') : 0;
            const shareStr = (rawWorldShare * 100).toFixed(1);

            // ★修正: yearlyPassengersStr を含む8引数で確実に連携
            this.uiManager.updateTopHUD(
                calendarStr,
                fundsStr,
                playerPlanes.length,
                this.maxPlanes,
                incomeStr,
                yearlyPassengersStr,
                passengersStr,
                shareStr
            );
            
            this.uiManager.checkBuyPlaneButtons(this.funds, playerPlanes.length, this.maxPlanes);

            if (this.uiManager.isUpgradePanelOpen()) {
                this.uiManager.checkUpgradeButtons(upgradeManager, this.funds);
            }
        }
    }

    _finalizeAnnualStats() {
        const completedYear = this.year - 1;
        const finalizedScore = Math.floor(this.yearlyPassengers);
        
        this.lastYearPassengers = finalizedScore;
        
        let isNewRecord = false;
        if (finalizedScore > this.bestYearlyPassengers) {
            this.bestYearlyPassengers = finalizedScore;
            isNewRecord = true;
        }

        this.annualHistory.push({
            year: completedYear,
            passengers: finalizedScore,
            endingFunds: Math.floor(this.funds),
            isRecord: isNewRecord
        });

        this.yearlyPassengers = 0;

        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                this.aiYearlyPassengers[comp.id] = 0;
            }
        });
    }

    _recordMonthlyHistory(competitionManager) {
        const monthLabel = `${this.year}-${this.month}`;
        
        const rawWorldShare = competitionManager ? competitionManager.getWorldShare('player') : 0;
        const rawSat = competitionManager && competitionManager.upgradeManager ? 
            (competitionManager.upgradeManager.getBonuses().satisfaction + (competitionManager.upgradeManager.eventSatisfactionBonus || 0)) : 100;
        
        this.historyData['player'].push({
            monthLabel: monthLabel,
            funds: this.funds,
            income: this.lastSecondIncome,
            passengers: this.totalPassengers,
            planes: this.uiManager ? parseInt(document.getElementById('hud-planes-count')?.innerText || '0') : 0,
            satisfaction: rawSat,
            share: rawWorldShare
        });

        if (this.historyData['player'].length > 24) {
            this.historyData['player'].shift();
        }

        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                const rivalWorldShare = competitionManager ? competitionManager.getWorldShare(comp.id) : 0;
                const rivalSat = competitionManager ? competitionManager.getAiSatisfaction(comp.id) : 150;
                
                this.historyData[comp.id].push({
                    monthLabel: monthLabel,
                    funds: this.aiFunds[comp.id],
                    income: this.aiLastIncome[comp.id],
                    passengers: this.aiTotalPassengers[comp.id],
                    planes: 0,
                    satisfaction: rivalSat,
                    share: rivalWorldShare
                });

                if (this.historyData[comp.id].length > 24) {
                    this.historyData[comp.id].shift();
                }
            }
        });

        if (this.uiManager && this.uiManager.isOverviewPanelOpen()) {
            this.uiManager.updateOverviewPanel(this.historyData, CONFIG.COMPANIES);
        }
    }

    calculateRouteCost(originNode, destNode) {
        const posA = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB);

        let baseCost = 500000;
        for (let i = 0; i < CONFIG.ECONOMY.ROUTE_TIERS.length; i++) {
            const tier = CONFIG.ECONOMY.ROUTE_TIERS[i];
            if (distance <= tier.maxDist) {
                baseCost = tier.baseCost;
                break;
            }
        }

        const rankWeights = { 'major': 1.5, 'local': 1.0, 'fictional': 0.7 };
        const rankMultiplier = (rankWeights[originNode.type] || 1.0) * (rankWeights[destNode.type] || 1.0);

        return Math.round(baseCost * rankMultiplier);
    }

    canAfford(amount) {
        return this.funds >= amount;
    }

    deductFunds(amount) {
        this.funds -= amount;
        if (this.funds < 0) this.funds = 0;
    }

    addFunds(amount) {
        this.funds += amount;
    }

    getAiFunds(companyId) {
        return this.aiFunds[companyId] || 0;
    }

    canAiAfford(companyId, amount) {
        return (this.aiFunds[companyId] || 0) >= amount;
    }

    deductAiFunds(companyId, amount) {
        if (this.aiFunds[companyId] !== undefined) {
            this.aiFunds[companyId] -= amount;
            if (this.aiFunds[companyId] < 0) this.aiFunds[companyId] = 0;
        }
    }

    addAiFunds(companyId, amount) {
        if (this.aiFunds[companyId] !== undefined) {
            this.aiFunds[companyId] += amount;
        }
    }

    _updateAiEconomy(delta, planes, networkManager, competitionManager) {
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id === 'player') return;

            const compPlanes = planes.filter(p => p.companyId === comp.id);
            const planeCount = compPlanes.length;
            
            let routeCount = 0;
            let totalLength = 0;
            const net = networkManager.network[comp.id];
            if (net) {
                for (const origin in net) {
                    routeCount += net[origin].length;
                    net[origin].forEach(r => totalLength += r.length);
                }
                routeCount = Math.floor(routeCount / 2);
                totalLength = totalLength / 2;
            }

            let activeFlyingPlanes = 0;
            compPlanes.forEach(plane => {
                if (plane.currentRoute && plane.progress < 1.0) {
                    activeFlyingPlanes++;
                    const baseDemand = (CONFIG.ECONOMY.PLANES[plane.sizeType]?.baseDemand) || 50;
                    const pass = baseDemand * (1.0 + (competitionManager.getAiSatisfaction(comp.id) || 150) * 0.005) * 0.8 * delta;
                    
                    this.aiTotalPassengers[comp.id] += pass;
                    this.aiYearlyPassengers[comp.id] += pass;
                }
            });

            const sat = competitionManager ? competitionManager.getAiSatisfaction(comp.id) : 150;
            const satBonus = 1.0 + (sat * 0.005);
            const distBonus = Math.min(1.5, totalLength / 20.0);
            const globalShare = competitionManager ? competitionManager.getGlobalShare(comp.id) : 0.2;
            const shareMult = 0.5 + (globalShare * 1.2);

            let baseIncome = (routeCount * 1200) + (activeFlyingPlanes * 3500) + (planeCount * 600); 
            let grossIncome = baseIncome * satBonus * (1.0 + distBonus) * shareMult;
            let upkeep = planeCount * 250; 
            
            let netIncome = grossIncome - upkeep;

            if (this.aiFunds[comp.id] <= 5000000 && netIncome < 0) {
                netIncome = Math.max(netIncome, 5000); 
            }

            if (!isNaN(netIncome)) {
                this.aiFunds[comp.id] += netIncome * delta;
                if (this.aiFunds[comp.id] < 0) this.aiFunds[comp.id] = 0; 
                this.aiLastIncome[comp.id] = netIncome;
            }
        });
    }

    _formatMoney(value) {
        if (value >= 1000000000000) return `$ ${(value / 1000000000000).toFixed(2)}T`;
        if (value >= 1000000000) return `$ ${(value / 1000000000).toFixed(2)}B`;
        if (value >= 1000000) return `$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$ ${Math.floor(value / 1000)}K`;
        return `$ ${Math.floor(value)}`;
    }

    _formatMoneyNumber(value) {
        if (value >= 1000000000000) return (value / 1000000000000).toFixed(2) + 'T';
        if (value >= 1000000000) return (value / 1000000000).toFixed(2) + 'B';
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return Math.floor(value / 1000) + 'K';
        return Math.floor(value);
    }

    _formatNumber(value) {
        return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}