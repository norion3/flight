/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ2.4: 投資効果（収益アップ）の適用】
 * GameManager から update() の第4引数として `upgradeManager` を受け取るように修正し、
 * アップグレードされた `incomeRate` (収益倍率) を実際の収益計算に適用しました。
 * ※錬金術防止や処理落ち防止のロジックはそのまま完全に維持しています。
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
    }

    canAfford(amount) {
        return this.funds >= amount;
    }

    addFunds(amount) {
        this.funds += amount;
    }

    deductFunds(amount) {
        if (this.funds >= amount) {
            this.funds -= amount;
            if (this.funds < 0) this.funds = 0;
            return true;
        }
        return false;
    }

    calculateRouteCost(fromData, toData) {
        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB); 

        const rankA = CONFIG.ECONOMY.AIRPORT_RANKS[fromData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankB = CONFIG.ECONOMY.AIRPORT_RANKS[toData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankMultiplier = (rankA.multiplier + rankB.multiplier) / 2;

        const cost = CONFIG.ECONOMY.ROUTE_BASE_COST + (distance * CONFIG.ECONOMY.ROUTE_DISTANCE_COST_RATE * rankMultiplier);
        return Math.round(cost / 1000) * 1000; 
    }

    // ★修正: 第4引数に upgradeManager を追加
    update(delta, playerPlanes, networkManager, upgradeManager) {
        let currentFrameGrossIncome = 0;
        let currentFrameUpkeep = 0;
        let currentFramePassengers = 0;
        let totalPlanesCount = 0;

        const totalNetworkLength = networkManager ? networkManager.playerTotalNetworkLength : 0;
        const networkBonus = 1.0 + (Math.sqrt(totalNetworkLength) * CONFIG.ECONOMY.NETWORK_BONUS_MULTIPLIER);

        // ★追加: UpgradeManager から現在のボーナスを取得
        let upgradeIncomeRate = 1.0;
        let upgradePassengerRate = 1.0; // 今後の拡張用
        if (upgradeManager) {
            const bonuses = upgradeManager.getBonuses();
            upgradeIncomeRate = bonuses.incomeRate;
            // 満足度に応じて客数も微増させる仕様にする場合など
            upgradePassengerRate = 1.0 + (bonuses.satisfaction / 500); 
        }

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                const type = plane.sizeType || 'small';
                const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                
                currentFrameUpkeep += planeConf.upkeep;

                if (plane.currentRoute) {
                    // ★修正: upgradeIncomeRate（アップグレードによる収益倍率）を掛け算する
                    const routeIncome = planeConf.incomeBase * networkBonus * upgradeIncomeRate;
                    const routePassengers = planeConf.baseDemand * 0.5 * networkBonus * upgradePassengerRate;

                    currentFrameGrossIncome += routeIncome;
                    currentFramePassengers += routePassengers;
                }
            }
        });

        this.grossIncomeBuffer += currentFrameGrossIncome * delta;
        this.upkeepBuffer += currentFrameUpkeep * delta;
        this.incomeTimer += delta;

        const currentNetIncome = currentFrameGrossIncome - currentFrameUpkeep;

        if (this.isFirstSecond) {
            this.lastSecondIncome = currentNetIncome;
        }

        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = (this.grossIncomeBuffer - this.upkeepBuffer) / this.incomeTimer;
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
            this.incomeTimer = 0;
            this.isFirstSecond = false;
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

        this.uiManager.updateTopHUD(
            this._formatMoney(this.funds),
            formattedIncome,
            totalPlanesCount,
            this.maxPlanes,
            this._formatNumber(Math.floor(this.totalPassengers))
        );
    }

    _formatMoney(value) {
        if (value >= 1000000) return `$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$ ${Math.floor(value / 1000)}K`;
        return `$ ${Math.floor(value)}`;
    }

    _formatMoneyNumber(value) {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${Math.floor(value / 1000)}K`;
        return `${Math.floor(value)}`;
    }

    _formatNumber(value) {
        return value.toLocaleString();
    }
}