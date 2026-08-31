/**
 * AI可読性・先祖返り防止コメント:
 * 【経営再起システム（セーフティネット）の実装】
 * 1. 資金がマイナスに沈んで破産状態になるのを防ぐため、計算後の資金に下限 0 を強制適用。
 * 2. 資金が 0 でかつ純損失（赤字）が続いている場合、強制的に最低保証のプラス収益を発生させ、
 * プレイヤーが必ず再起（巻き返し）できるように保護するセーフティネットを追加しました。
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

        this.currentYear = 1;
        this.currentMonth = 1;
        this.monthTimer = 0; 
        this.historyData = {}; 
        
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
        // ★追加: 資金が絶対にマイナスにならない下限ガード
        if (this.funds < 0) this.funds = 0;
    }

    canAfford(amount) {
        return this.funds >= amount;
    }

    deductFunds(amount) {
        this.funds -= amount;
        if (this.funds < 0) this.funds = 0;
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
        
        this.monthTimer += delta;
        if (this.monthTimer >= 20.0) {
            this.monthTimer -= 20.0;
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }

            const monthLabel = `${this.currentYear}年目-${this.currentMonth}月`;

            CONFIG.COMPANIES.forEach(comp => {
                const companyId = comp.id;
                let currentFunds = 0;
                let currentIncome = 0;
                let currentPass = 0;
                const currentShare = competitionManager ? (competitionManager.globalShares[companyId] || 0) : 0;
                
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
                    currentFunds = (planeCount * 25000000) + (routeCount * 50000000); 
                    currentIncome = (planeCount * 180000) + (routeCount * 120000); 
                    currentPass = this.aiPassengers[companyId] || 0; 
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

        let currentNetIncome = (grossIncomeThisFrame - totalUpkeepThisFrame) / delta;

        // ★追加: セーフティネット（資金が0かつ赤字の場合、強制的に最低保証のプラス収益を与える）
        if (this.funds <= 1000 && currentNetIncome < 0) {
            currentNetIncome = Math.max(currentNetIncome, 5000); // 毎秒 +$5K の政府補助金・最低保証
        }

        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = isNaN(currentNetIncome) ? 0 : currentNetIncome;
            this.incomeTimer = 0;
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
        }

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