/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ3.2: 収益計算へのシェア反映】
 * 1. update() および _calculateCurrentIncome() に competitionManager を受け取るよう変更。
 * 2. 各機体が向かっている空港（または現在地）の「シェア率(0.0〜1.0)」を competitionManager から取得。
 * 3. 顧客満足度（brandPower）でブーストされた「客数(demand)」と「収益(incomeBase)」に対し、シェア率を掛け合わせて最終収益とする。
 * 4. これにより「シェアを奪われると儲からなくなる」「投資してシェアを奪い返すと大儲けする」タイクーンのコア要素が成立。
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
        
        // パネルを開きっぱなしの時のリアルタイム更新用インターバル
        this.uiUpdateTimer = 0;
    }

    canAfford(amount) {
        return this.funds >= amount;
    }

    deductFunds(amount) {
        if (this.canAfford(amount)) {
            this.funds -= amount;
            return true;
        }
        return false;
    }

    addFunds(amount) {
        this.funds += amount;
    }

    calculateRouteCost(originNode, destNode) {
        const posA = Utils.latLonToVector3(originNode.lat, originNode.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(destNode.lat, destNode.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB);
        
        return Math.floor(distance * 200000); 
    }

    // ★ Phase 3.2 変更: competitionManager を引数に追加
    update(delta, planes, networkManager, upgradeManager, competitionManager) {
        this.incomeTimer += delta;
        this.uiUpdateTimer += delta;

        // ★ Phase 3.2 変更: competitionManager を渡す
        const { income, passengers } = this._calculateCurrentIncome(planes, networkManager, upgradeManager, competitionManager);
        let currentGrossIncome = income;
        let currentFramePassengers = passengers;

        let totalUpkeep = 0;
        planes.forEach(plane => {
            const planeConf = CONFIG.ECONOMY.PLANES[plane.type];
            if (planeConf) {
                totalUpkeep += planeConf.upkeep;
            }
        });

        const currentNetIncome = currentGrossIncome - totalUpkeep;

        this.grossIncomeBuffer += currentGrossIncome * delta;
        this.upkeepBuffer += totalUpkeep * delta;

        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = this.grossIncomeBuffer - this.upkeepBuffer;
            if (this.isFirstSecond) {
                this.displayIncome = this.lastSecondIncome;
                this.isFirstSecond = false;
            }
            
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
            this.incomeTimer = 0;
        }

        if (this.uiUpdateTimer >= 0.5) {
            this.uiManager.checkUpgradeButtons(upgradeManager, this.funds);
            if (this.uiManager.isBuyMenuOpen()) {
                const counts = planes.reduce((acc, p) => {
                    acc[p.type] = (acc[p.type] || 0) + 1;
                    return acc;
                }, {});
                const totalPlanesCount = Object.values(counts).reduce((a, b) => a + b, 0);
                this.uiManager.checkBuyPlaneButtons(this.funds, totalPlanesCount, this.maxPlanes);
            }
            this.uiUpdateTimer = 0;
        }

        this.addFunds(currentNetIncome * delta);
        this.totalPassengers += currentFramePassengers * delta;

        const lerpFactor = 1.0 - Math.pow(0.05, delta);
        this.displayIncome += (this.lastSecondIncome - this.displayIncome) * lerpFactor;
        
        if (Math.abs(this.lastSecondIncome - this.displayIncome) < 0.5) {
            this.displayIncome = this.lastSecondIncome;
        }

        const displayVal = Math.round(this.displayIncome);
        const incomePrefix = displayVal >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${incomePrefix}${this._formatMoneyNumber(Math.abs(displayVal))}/s`;

        const totalPlanesCount = planes.length;
        this.uiManager.updateTopHUD(
            this._formatMoney(this.funds),
            formattedIncome,
            totalPlanesCount,
            this.maxPlanes,
            this._formatNumber(Math.floor(this.totalPassengers))
        );
    }

    // ★ Phase 3.2 変更: competitionManager を引数に追加し、シェア率による減衰を実装
    _calculateCurrentIncome(planes, networkManager, upgradeManager, competitionManager) {
        let totalIncome = 0;
        let totalPassengers = 0;

        const bonuses = upgradeManager.getBonuses();
        const upgradeIncomeRate = bonuses.incomeRate || 1.0;
        // 顧客満足度によるブランド力（1.0 + 満足度/100）
        const brandPower = 1.0 + ((bonuses.satisfaction || 0) / 100);

        planes.forEach(plane => {
            const planeConf = CONFIG.ECONOMY.PLANES[plane.type];
            if (!planeConf) return;

            // 機体が向かっている目的地の空港IDを取得
            let targetAirportId = null;
            if (plane.currentRoute && plane.currentRoute.id) {
                targetAirportId = plane.currentRoute.id;
            } else if (plane.currentAirportId) {
                targetAirportId = plane.currentAirportId;
            }

            // CompetitionManager から該当空港の自社シェア率 (0.0〜1.0) を取得
            let share = 1.0;
            if (targetAirportId && competitionManager) {
                share = competitionManager.getShare(targetAirportId, 'player');
            }

            // 客数と収益にシェアを掛ける（シェアが低いほど稼げなくなる）
            let demand = (planeConf.baseDemand * brandPower) * share;
            let incomeBase = (planeConf.incomeBase * upgradeIncomeRate) * share;

            totalPassengers += demand;
            totalIncome += incomeBase;
        });

        return {
            income: totalIncome,
            passengers: totalPassengers
        };
    }

    _formatMoney(value) {
        if (value >= 1000000) return `$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$ ${Math.floor(value / 1000)}K`;
        return `$ ${Math.floor(value)}`;
    }

    _formatMoneyNumber(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return Math.floor(value / 1000) + 'K';
        return Math.floor(value).toString();
    }

    _formatNumber(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
        return value.toString();
    }
}