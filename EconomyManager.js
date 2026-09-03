/**
 * AI可読性・先祖返り防止コメント:
 * 【AI機体構成連動 ＆ イベント出費時マイナス防止ガード完全保持】
 * 1. `_updateAiEconomy` において、AIの機体サイズ構成に応じた実態収益を反映し、AIが中型・大型機を維持・対抗可能に。
 * 2. `addFunds` の下限ガード（funds < 0 ➔ 0）、決算通知（onAnnualSettlement）、月次実機体数記録等は100%完全保持しています。
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

        this.onAnnualSettlement = null;   // Phase 6: 決算通知コールバック

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
            this._recordMonthlyHistory(competitionManager, planes);
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
            
            // 収益短縮表示
            const incomeStr = (this.displayIncome >= 0 ? "+$" : "-$") + this._formatMoneyNumber(Math.abs(this.displayIncome));
            
            // 年間客数（完全実数・カンマ区切り）
            const yearlyPassengersStr = this._formatNumber(this.yearlyPassengers);
            
            // 累計客数（100万人以上で M/B 短縮表示）
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

        const settlementData = {
            year: completedYear,
            yearlyPassengers: finalizedScore,
            bestYearlyPassengers: this.bestYearlyPassengers,
            funds: Math.floor(this.funds),
            isNewRecord: isNewRecord
        };

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

        // Phase 6: 決算通知コールバックの発火
        if (this.onAnnualSettlement) {
            this.onAnnualSettlement(settlementData);
        }
    }

    _recordMonthlyHistory(competitionManager, planes = null) {
        const monthLabel = `${this.year}-${this.month}`;
        
        const rawWorldShare = competitionManager ? competitionManager.getWorldShare('player') : 0;
        const rawSat = competitionManager && competitionManager.upgradeManager ? 
            (competitionManager.upgradeManager.getBonuses().satisfaction + (competitionManager.upgradeManager.eventSatisfactionBonus || 0)) : 100;
        
        const playerPlaneCount = planes ? planes.filter(p => p.companyId === 'player').length : (this.uiManager ? parseInt(document.getElementById('hud-planes-count')?.innerText || '0') : 0);

        this.historyData['player'].push({
            monthLabel: monthLabel,
            funds: this.funds,
            income: this.lastSecondIncome,
            passengers: this.totalPassengers,
            planes: playerPlaneCount,
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
                const rivalPlaneCount = planes ? planes.filter(p => p.companyId === comp.id).length : 0;
                
                this.historyData[comp.id].push({
                    monthLabel: monthLabel,
                    funds: this.aiFunds[comp.id],
                    income: this.aiLastIncome[comp.id],
                    passengers: this.aiTotalPassengers[comp.id],
                    planes: rivalPlaneCount,
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

    // イベント出費等（負の加算）でも所持金がマイナスにならず0で止まるガード
    addFunds(amount) {
        this.funds += amount;
        if (this.funds < 0) this.funds = 0;
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
            if (this.aiFunds[companyId] < 0) this.aiFunds[companyId] = 0;
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

            // ★AI機体構成に応じた基礎収入の反映
            let basePlaneIncome = 0;
            compPlanes.forEach(p => {
                const conf = CONFIG.ECONOMY.PLANES[p.sizeType];
                if (conf) basePlaneIncome += conf.incomeBase * 0.4;
            });

            let baseIncome = (routeCount * 1200) + (activeFlyingPlanes * 3500) + (planeCount * 600) + basePlaneIncome; 
            let grossIncome = baseIncome * satBonus * (1.0 + distBonus) * shareMult;
            
            let totalAiUpkeep = 0;
            compPlanes.forEach(p => {
                const conf = CONFIG.ECONOMY.PLANES[p.sizeType];
                if (conf) totalAiUpkeep += conf.upkeep;
            });
            let upkeep = totalAiUpkeep * 0.5; 
            
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