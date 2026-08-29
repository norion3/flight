/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ2.5: 投資効果の確実な反映とUIリアルタイム更新】
 * 1. 顧客満足度(satisfaction)が、単なる客数アップだけでなく、確実な収益倍率（ブランド力）としても
 * 計算式（upgradeIncomeRate）に加算されるようバランス調整を行いました。
 * 2. 毎フレームの update() 内から UIManager.checkUpgradeButtons() と checkBuyPlaneButtons() を呼び出すことで、
 * パネルを開いたまま資金が貯まった瞬間にボタンが緑色に点灯する（UX向上）ようにしました。
 * ※修正: checkBuyPlaneButtons() へ現在の機体数と上限数も渡し、購入上限のリアルタイム制御を可能にしました。
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

    update(delta, playerPlanes, networkManager, upgradeManager) {
        let currentFrameGrossIncome = 0;
        let currentFrameUpkeep = 0;
        let currentFramePassengers = 0;
        let totalPlanesCount = 0;

        const totalNetworkLength = networkManager ? networkManager.playerTotalNetworkLength : 0;
        const networkBonus = 1.0 + (Math.sqrt(totalNetworkLength) * CONFIG.ECONOMY.NETWORK_BONUS_MULTIPLIER);

        let upgradeIncomeRate = 1.0;
        let upgradePassengerRate = 1.0; 
        
        if (upgradeManager) {
            const bonuses = upgradeManager.getBonuses();
            upgradeIncomeRate = bonuses.incomeRate;
            
            // 顧客満足度を「確実な収益（ブランド力）」と「客数」のダブルボーナスにする
            const satisfactionBonus = bonuses.satisfaction / 100;
            upgradeIncomeRate += (satisfactionBonus * 0.20); 
            upgradePassengerRate = 1.0 + (satisfactionBonus * 0.50); 
        }

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++; // プレイヤーの現在機体数をカウント
                const type = plane.sizeType || 'small';
                const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                
                currentFrameUpkeep += planeConf.upkeep;

                if (plane.currentRoute) {
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
        this.uiUpdateTimer += delta;

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

        // 0.5秒に1回、UIManagerのボタン状態をリアルタイムにチェック（パネルが開いている時だけ）
        if (this.uiUpdateTimer >= 0.5) {
            // アップグレードパネルの更新
            if (upgradeManager && this.uiManager.isUpgradePanelOpen()) {
                this.uiManager.checkUpgradeButtons(upgradeManager, this.funds);
            }
            // 機体購入メニューの更新（★修正: 現在の機体数と上限数も渡す）
            if (this.uiManager.isBuyMenuOpen()) {
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