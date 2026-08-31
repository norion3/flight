/**
 * AI可読性・先祖返り防止コメント:
 * 【超軽量設計へのリファクタリング（維持） ＋ AIの実数化の安全追記】
 * オリジナルの超軽量UI更新ロジックやプレイヤーの計算ループは1ミリも変更せず完全に保持しています。
 * AI専用の絶対値計算（客数・資産）を別の関数 `_updateAiPassengers` として分離・追記し、
 * 既存の処理を絶対に壊さない形で「AIの自立」を実現しました。
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
        this.maxPlanes = CONFIG.ECONOMY.MAX_PLANES_INITIAL;
        
        this.uiUpdateTimer = 0;

        // カレンダーと履歴データ用プロパティ
        this.currentYear = 1;
        this.currentMonth = 1;
        this.monthTimer = 0; // 20秒で1ヶ月
        this.historyData = {}; // 全社の24ヶ月分の履歴
        
        // ★追加: AIの自立した累計客数
        this.aiPassengers = {}; 
        
        CONFIG.COMPANIES.forEach(comp => {
            this.historyData[comp.id] = [];
            if (comp.id !== 'player') {
                this.aiPassengers[comp.id] = 0;
            }
        });
    }

    addFunds(amount) {
        if (isNaN(amount)) return; 
        this.funds += amount;
    }

    canAfford(amount) {
        return this.funds >= amount;
    }

    deductFunds(amount) {
        this.funds -= amount;
    }

    calculateRouteCost(originData, destData) {
        const posA = Utils.latLonToVector3(originData.lat, originData.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(destData.lat, destData.lon, CONFIG.GLOBE_RADIUS);
        const dist = posA.distanceTo(posB);

        const fromRank = CONFIG.ECONOMY.AIRPORT_RANKS[originData.type].multiplier;
        const toRank = CONFIG.ECONOMY.AIRPORT_RANKS[destData.type].multiplier;
        
        return CONFIG.ECONOMY.ROUTE_BASE_COST + (dist * CONFIG.ECONOMY.ROUTE_DISTANCE_COST_RATE * ((fromRank + toRank) / 2));
    }

    update(delta, planes, networkManager, upgradeManager, competitionManager) {
        if (delta <= 0.0001) return;

        this.incomeTimer += delta;
        this.uiUpdateTimer += delta;
        
        // カレンダーの進行と月次データの記録（20秒ごとに実行）
        this.monthTimer += delta;
        if (this.monthTimer >= 20.0) {
            this.monthTimer -= 20.0;
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }

            const monthLabel = `${this.currentYear}年目-${this.currentMonth}月`;

            // 全社のスナップショットを記録
            CONFIG.COMPANIES.forEach(comp => {
                const companyId = comp.id;
                let currentFunds = 0;
                let currentIncome = 0;
                let currentPass = 0;
                const currentShare = competitionManager ? (competitionManager.globalShares[companyId] || 0) : 0;
                
                // 機体数と路線数の集計
                let planeCount = 0;
                planes.forEach(p => {
                    if (p.companyId === companyId) planeCount++;
                });
                
                let routeCount = 0;
                if (networkManager && networkManager.network[companyId]) {
                    const net = networkManager.network[companyId];
                    for (const originId in net) {
                        routeCount += net[originId].length;
                    }
                    routeCount = Math.floor(routeCount / 2);
                }

                if (companyId === 'player') {
                    currentFunds = this.funds;
                    currentIncome = this.lastSecondIncome; 
                    currentPass = this.totalPassengers;
                } else {
                    // ★変更: プレイヤーのシェアに依存していた仮計算を廃止し、完全実数化
                    currentFunds = (planeCount * 25000000) + (routeCount * 50000000); // 資産実数化
                    currentIncome = (planeCount * 180000) + (routeCount * 120000); // 月間収益実数化
                    currentPass = this.aiPassengers[companyId] || 0; // 客数実数化
                }

                const snapshot = {
                    monthLabel: monthLabel,
                    funds: currentFunds,
                    income: currentIncome,
                    passengers: currentPass,
                    planes: planeCount,
                    share: currentShare
                };

                this.historyData[companyId].push(snapshot);
                
                if (this.historyData[companyId].length > 24) {
                    this.historyData[companyId].shift();
                }
            });
        }

        let currentFramePassengers = 0;
        let grossIncomeThisFrame = 0;
        let totalUpkeepThisFrame = 0;
        let totalPlanesCount = 0;

        const netLen = networkManager.playerTotalNetworkLength || 0;
        
        const networkBonus = 1.0 + (Math.sqrt(netLen) * 0.1); 
        const passNetworkBonus = 1.0 + (Math.sqrt(netLen) * 0.05); 

        planes.forEach(plane => {
            if (plane.companyId !== 'player') return;
            totalPlanesCount++;

            const planeConf = CONFIG.ECONOMY.PLANES[plane.sizeType];
            if (planeConf) {
                totalUpkeepThisFrame += planeConf.upkeep * delta;
            }

            if (plane.currentRoute && planeConf) {
                const bonuses = upgradeManager.getBonuses();
                const upgradeIncomeRate = bonuses.incomeRate || 1.0;
                
                const satisfaction = bonuses.satisfaction || 0;
                const satisfactionBonus = 1.0 + (satisfaction / 100.0);
                
                let effectiveShare = 1.0;
                if (competitionManager) {
                    const fromShare = competitionManager.getShare(plane.currentAirportId, 'player');
                    const toShare = competitionManager.getShare(plane.currentRoute.id, 'player');
                    const avgShare = (fromShare + toShare) / 2.0;
                    
                    if (!isNaN(avgShare)) {
                        effectiveShare = Math.max(0.05, avgShare);
                    }
                }

                const incomePerSec = planeConf.incomeBase * upgradeIncomeRate * effectiveShare * networkBonus;
                grossIncomeThisFrame += incomePerSec * delta;

                const passPerSec = (planeConf.baseDemand / 4) * effectiveShare * passNetworkBonus * satisfactionBonus;
                currentFramePassengers += passPerSec * delta;
            }
        });

        const currentNetIncome = (grossIncomeThisFrame - totalUpkeepThisFrame) / delta;

        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = isNaN(currentNetIncome) ? 0 : currentNetIncome;
            this.incomeTimer = 0;
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
        }

        // ★追加: 毎フレーム、AIの自立した客数（スコア）を計算・加算
        this._updateAiPassengers(delta, planes, networkManager, competitionManager);

        if (this.uiUpdateTimer >= 0.2) {
            if (this.uiManager.isUpgradePanelOpen()) {
                this.uiManager.checkUpgradeButtons(upgradeManager, this.funds);
            }
            if (this.uiManager.isBuyMenuOpen()) {
                this.uiManager.checkBuyPlaneButtons(this.funds, totalPlanesCount, this.maxPlanes);
            }
            this.uiUpdateTimer = 0;
        }

        this.addFunds(currentNetIncome * delta);
        if (!isNaN(currentFramePassengers)) {
            this.totalPassengers += currentFramePassengers;
        }

        const lerpFactor = 1.0 - Math.pow(0.05, delta);
        this.displayIncome += (this.lastSecondIncome - this.displayIncome) * lerpFactor;
        
        if (Math.abs(this.lastSecondIncome - this.displayIncome) < 0.5) {
            this.displayIncome = this.lastSecondIncome;
        }

        // HTMLタグを含まず、純粋な値のみを抽出して UIManager へ渡す（超軽量化対応）
        const displayVal = Math.round(this.displayIncome);
        const incomePrefix = displayVal >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${incomePrefix}${this._formatMoneyNumber(Math.abs(displayVal))}`;
        
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

    // ★追加: AI客数用の独立メソッド（既存ロジックを邪魔しない）
    _updateAiPassengers(delta, planes, networkManager, competitionManager) {
        const aiPlaneCounts = {};
        if (planes) {
            planes.forEach(p => {
                if (p && p.companyId !== 'player') {
                    aiPlaneCounts[p.companyId] = (aiPlaneCounts[p.companyId] || 0) + 1;
                }
            });
        }

        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id === 'player') return;

            let routeCount = 0;
            if (networkManager && networkManager.network[comp.id]) {
                const net = networkManager.network[comp.id];
                for (const originId in net) {
                    routeCount += net[originId].length;
                }
                routeCount = Math.floor(routeCount / 2);
            }
            
            const planeCount = aiPlaneCounts[comp.id] || 0;
            const netLength = (networkManager && networkManager.getAiTotalNetworkLength) ? networkManager.getAiTotalNetworkLength(comp.id) : 0;
            const satisfaction = (competitionManager && competitionManager.getAiSatisfaction) ? competitionManager.getAiSatisfaction(comp.id) : 150;
            
            const baseAiRate = (routeCount * 2.2) + (planeCount * 3.5);
            const satBonus = Math.pow(1.0 + (Math.max(0, satisfaction) / 100), 2.0);
            const distBonus = Math.sqrt(Math.max(0, netLength)) * 0.05;
            
            const currentAiRate = baseAiRate * satBonus * (1.0 + distBonus);
            
            if (!isNaN(currentAiRate)) {
                this.aiPassengers[comp.id] += (currentAiRate * delta);
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