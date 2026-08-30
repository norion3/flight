/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 3: 時間概念の導入と統計データの蓄積】
 * 1. `monthTimer` を導入し、現実の20秒をゲーム内の1ヶ月とするカレンダー進行ロジックを追加しました。
 * 2. 月が切り替わるタイミングで、プレイヤーとAI全社の主要指標（資金、収益、客数、機体数、シェア）の
 * スナップショットを `historyData` に保存します。
 * 3. 過去24ヶ月分のリングバッファ構造を採用し、メモリ圧迫を完全に防ぎつつグラフ化に必要な情報を確保します。
 * 4. 新しいダッシュボード型HUDレイアウトに合わせて、HTMLタグを含んだ見やすい文字列（単位の縮小など）を生成します。
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

        // ★Phase 3: カレンダーと履歴データ用プロパティ
        this.currentYear = 1;
        this.currentMonth = 1;
        this.monthTimer = 0; // 20秒で1ヶ月
        this.historyData = {}; // 全社の24ヶ月分の履歴
        
        CONFIG.COMPANIES.forEach(comp => {
            this.historyData[comp.id] = [];
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
        
        // ★Phase 3: カレンダーの進行と月次データの記録（20秒ごとに実行）
        this.monthTimer += delta;
        if (this.monthTimer >= 20.0) {
            this.monthTimer -= 20.0;
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthLabel = `Y${this.currentYear} - ${monthNames[this.currentMonth - 1]}`;

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
                    // AIの場合は「推定資産価値」と「ダミー収益/客数」を記録（グラフ比較用）
                    const baseAiSat = competitionManager ? competitionManager.baseAiSatisfaction : 150;
                    currentFunds = (planeCount * 20000000) + (routeCount * 5000000) + (baseAiSat * 100000);
                    currentIncome = (planeCount * 5000) + (routeCount * 2000);
                    
                    const playerShare = competitionManager ? Math.max(competitionManager.globalShares['player'] || 0.0001, 0.0001) : 0.0001;
                    currentPass = this.totalPassengers * (currentShare / playerShare);
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
                
                // 24ヶ月分のリングバッファ（メモリ圧迫防止）
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

        // ★Phase 3: ダッシュボード型レイアウト用のHTML成形
        const displayVal = Math.round(this.displayIncome);
        const incomePrefix = displayVal >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${incomePrefix}${this._formatMoneyNumber(Math.abs(displayVal))}<span class="text-[10px] font-sans font-normal text-emerald-400/70 ml-0.5">/s</span>`;
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const calendarStr = `Year ${this.currentYear} - ${monthNames[this.currentMonth - 1]}`;
        
        const planesStr = `${totalPlanesCount} <span class="text-slate-500">/ ${this.maxPlanes}</span> <span class="text-[10px] font-sans font-normal text-slate-400 ml-0.5">機</span>`;
        const passStr = this._formatNumber(Math.floor(this.totalPassengers)) + ' <span class="text-[10px] font-sans font-normal text-slate-400 ml-0.5">人</span>';
        
        const playerShare = competitionManager ? (competitionManager.globalShares['player'] || 0) : 0;
        const shareStr = (playerShare * 100).toFixed(1) + ' <span class="text-[10px] font-sans font-normal text-slate-400 ml-0.5">%</span>';

        this.uiManager.updateTopHUD(
            calendarStr,
            this._formatMoney(this.funds),
            planesStr,
            formattedIncome,
            passStr,
            shareStr
        );
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