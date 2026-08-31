/**
 * AI可読性・先祖返り防止コメント:
 * 【AI客数と資産の完全実数化＆総延長ボーナスの適用】
 * AIの履歴データ（客数や資産）をプレイヤーのシェアに基づく仮計算から、
 * AI自身が保有する「実際の路線数・機体数」と「総延長距離」に基づく絶対値計算へ改修しました。
 */

import { CONFIG } from './Config.js';

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
        this.maxPlanes = CONFIG.ECONOMY.MAX_PLANES_INITIAL;
        
        this.uiUpdateTimer = 0;

        // カレンダーと履歴データ用プロパティ
        this.currentYear = 1;
        this.currentMonth = 1;
        this.monthTimer = 0; // 20秒で1ヶ月
        this.historyData = {}; // 全社の24ヶ月分の履歴
        
        this.aiPassengers = {}; // ★追加: AIの自立した累計客数
        
        CONFIG.COMPANIES.forEach(comp => {
            this.historyData[comp.id] = [];
            if (comp.id !== 'player') {
                this.aiPassengers[comp.id] = 0;
            }
        });
    }

    update(delta, planes, networkManager, upgradeManager, competitionManager) {
        // --- プレイヤーの収益・客数計算 ---
        let currentGrossIncome = 0;
        let currentUpkeep = 0;
        let currentPassRate = 0;

        const playerNet = networkManager.network['player'];
        let playerRouteCount = 0;
        if (playerNet) {
            for (const id in playerNet) playerRouteCount += playerNet[id].length;
            playerRouteCount = Math.floor(playerRouteCount / 2);
        }
        
        let playerPlaneCount = 0;
        planes.forEach(plane => {
            if (plane.companyId === 'player') {
                playerPlaneCount++;
                if (plane.currentRoute) {
                    const planeConf = CONFIG.ECONOMY.PLANES[plane.sizeType];
                    const dist = plane.currentRoute.length;
                    
                    const bonuses = upgradeManager.getBonuses();
                    const incomeRate = bonuses.incomeRate || 1.0;
                    
                    currentGrossIncome += planeConf.incomeBase * (1.0 + dist * 5.0) * incomeRate;
                    currentPassRate += planeConf.baseDemand * (1.0 + dist * 2.0);
                    currentUpkeep += planeConf.upkeep;
                }
            }
        });

        // ネットワーク総延長ボーナス (プレイヤー)
        const totalNetLength = networkManager.getTotalNetworkLength('player');
        const distanceBonus = Math.sqrt(totalNetLength) * 0.05;
        
        currentGrossIncome *= (1.0 + distanceBonus);
        currentPassRate *= (1.0 + distanceBonus);

        // 競争(シェア)による補正
        for (const airportId in playerNet) {
            if (playerNet[airportId].length > 0) {
                const share = competitionManager.getShare(airportId, 'player');
                const shareMult = 0.5 + (share * 0.5); 
                currentGrossIncome *= shareMult;
                currentPassRate *= shareMult;
            }
        }

        const currentNetIncome = currentGrossIncome - currentUpkeep;
        
        this.incomeTimer += delta;
        if (this.incomeTimer >= 1.0) {
            this.incomeTimer -= 1.0;
            
            this.funds += currentNetIncome;
            this.totalPassengers += currentPassRate;
            
            this.grossIncomeBuffer += currentGrossIncome;
            this.upkeepBuffer += currentUpkeep;
            
            this.lastSecondIncome = currentNetIncome;
        }

        // ★追加: AIライバルの毎秒の客数（スコア）の絶対値計算と加算
        this._updateAiPassengers(delta, planes, networkManager, competitionManager);

        // --- カレンダー進行と履歴保存 ---
        this.monthTimer += delta;
        if (this.monthTimer >= 20.0) {
            this.monthTimer -= 20.0;
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }
            
            this._recordHistory(competitionManager, planes, networkManager);
            
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
        }

        // --- UIの更新 ---
        this.uiUpdateTimer += delta;
        if (this.uiUpdateTimer >= 0.5) {
            this.uiUpdateTimer -= 0.5;
            this._updateUI(playerPlaneCount, competitionManager);
        }
    }

    _updateAiPassengers(delta, planes, networkManager, competitionManager) {
        const aiPlaneCounts = {};
        planes.forEach(p => {
            if (p.companyId !== 'player') {
                aiPlaneCounts[p.companyId] = (aiPlaneCounts[p.companyId] || 0) + 1;
            }
        });

        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id === 'player') return;

            const routeCount = this._getRouteCount(networkManager.network[comp.id]);
            const planeCount = aiPlaneCounts[comp.id] || 0;
            const netLength = networkManager.getTotalNetworkLength(comp.id);
            const satisfaction = competitionManager.getAiSatisfaction ? competitionManager.getAiSatisfaction(comp.id) : 150;
            
            // 路線と機体から基礎客数を算出
            const baseAiRate = (routeCount * 2.2) + (planeCount * 3.5);
            
            // AI自身の満足度と総延長ボーナスを適用
            const satBonus = Math.pow(1.0 + (satisfaction / 100), 2.0);
            const distBonus = Math.sqrt(netLength) * 0.05;
            
            const currentAiRate = baseAiRate * satBonus * (1.0 + distBonus);
            
            this.aiPassengers[comp.id] += (currentAiRate * delta);
        });
    }

    _recordHistory(competitionManager, planes, networkManager) {
        const aiPlaneCounts = {};
        let playerPlaneCount = 0;
        
        if (planes) {
            planes.forEach(p => {
                if (p.companyId === 'player') playerPlaneCount++;
                else aiPlaneCounts[p.companyId] = (aiPlaneCounts[p.companyId] || 0) + 1;
            });
        }

        CONFIG.COMPANIES.forEach(comp => {
            const hist = this.historyData[comp.id];
            
            if (comp.id === 'player') {
                const monthIncome = this.grossIncomeBuffer - this.upkeepBuffer;
                hist.push({
                    monthLabel: `${this.currentYear}-${this.currentMonth}`,
                    funds: this.funds,
                    income: monthIncome,
                    passengers: this.totalPassengers,
                    planes: playerPlaneCount,
                    routeCount: this._getRouteCount(networkManager.network['player']),
                    satisfaction: 0,
                    globalShare: competitionManager.globalShares['player'] || 0,
                    assetValue: this.funds
                });
            } else {
                const routeCount = this._getRouteCount(networkManager.network[comp.id]);
                const planeCount = aiPlaneCounts[comp.id] || 0;
                
                // ★完全実数化: 開拓コストと機体コストの概算からAIの資産を算出
                const assetValue = (routeCount * 50000000) + (planeCount * 25000000);
                const monthIncome = (routeCount * 120000) + (planeCount * 180000);
                const currentPass = this.aiPassengers[comp.id] || 0;

                hist.push({
                    monthLabel: `${this.currentYear}-${this.currentMonth}`,
                    funds: assetValue, // グラフの「資金」タブには資産価値を表示
                    income: monthIncome,
                    passengers: currentPass,
                    planes: planeCount,
                    routeCount: routeCount,
                    satisfaction: competitionManager.getAiSatisfaction ? competitionManager.getAiSatisfaction(comp.id) : 150,
                    globalShare: competitionManager.globalShares[comp.id] || 0,
                    assetValue: assetValue
                });
            }
            if (hist.length > 24) hist.shift(); // 2年分（24ヶ月）を保持
        });
    }

    _getRouteCount(network) {
        if (!network) return 0;
        let count = 0;
        for (const id in network) count += network[id].length;
        return Math.floor(count / 2);
    }

    _updateUI(totalPlanesCount, competitionManager) {
        const displayVal = this.lastSecondIncome;
        const prefix = displayVal >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${prefix}${this._formatMoneyNumber(Math.abs(displayVal))}`;
        
        const calendarStr = `${this.currentYear}年目-${this.currentMonth}月`;
        const passStr = this._formatNumber(Math.floor(this.totalPassengers));
        
        const playerShare = competitionManager ? (competitionManager.globalShares['player'] || 0) : 0;
        const shareStr = (playerShare * 100).toFixed(1);

        this.uiManager.updateTopHUD(
            calendarStr,
            this._formatMoney(this.funds),
            totalPlanesCount,
            this.maxPlanes,
            formattedIncome,
            passStr,
            shareStr
        );
    }

    _formatMoney(value) {
        const absVal = Math.abs(value);
        let str = '';
        if (absVal >= 1000000000000) str = `$ ${(absVal / 1000000000000).toFixed(2)}T`;
        else if (absVal >= 1000000000) str = `$ ${(absVal / 1000000000).toFixed(2)}B`;
        else if (absVal >= 1000000) str = `$ ${(absVal / 1000000).toFixed(1)}M`;
        else if (absVal >= 1000) str = `$ ${Math.floor(absVal / 1000)}K`;
        else str = `$ ${Math.floor(absVal)}`;
        return value < 0 ? '-' + str : str;
    }

    _formatMoneyNumber(value) {
        const absVal = Math.abs(value);
        if (absVal >= 1000000000000) return (absVal / 1000000000000).toFixed(2) + 'T';
        if (absVal >= 1000000000) return (absVal / 1000000000).toFixed(2) + 'B';
        if (absVal >= 1000000) return (absVal / 1000000).toFixed(1) + 'M';
        if (absVal >= 1000) return Math.floor(absVal / 1000) + 'K';
        return Math.floor(absVal);
    }

    _formatNumber(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}