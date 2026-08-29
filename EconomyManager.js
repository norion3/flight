/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ2.5: 投資効果の確実な反映とUIリアルタイム更新】
 * 顧客満足度の反映、各種UIのリアルタイム更新などを実装済み。
 * * ★【Phase 1: 競争システムの統合 (バグ修正版)】
 * 1. updateメソッドの引数に competitionManager を追加。
 * 2. 収益・客数の計算時に「平均シェア率」を掛け合わせるように修正。
 * 3. 誤って消去してしまった必須メソッド(canAfford, deductFunds, calculateRouteCost)を完全に復元しました。
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
    }

    addFunds(amount) {
        this.funds += amount;
    }

    // ★復元: 足りないメソッドを完全に復旧
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
        this.incomeTimer += delta;
        this.uiUpdateTimer += delta;

        let currentFramePassengers = 0;
        let grossIncomeThisFrame = 0;
        let totalUpkeepThisFrame = 0;
        let totalPlanesCount = 0;

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
                
                let effectiveShare = 1.0;
                if (competitionManager) {
                    const fromShare = competitionManager.getShare(plane.currentAirportId, 'player');
                    const toShare = competitionManager.getShare(plane.currentRoute.id, 'player');
                    const avgShare = (fromShare + toShare) / 2.0;
                    // シェアが低くても最低5%の収益は保証する
                    effectiveShare = Math.max(0.05, avgShare);
                }

                const incomePerSec = planeConf.incomeBase * upgradeIncomeRate * effectiveShare;
                grossIncomeThisFrame += incomePerSec * delta;

                const passPerSec = (planeConf.baseDemand / 10) * effectiveShare;
                currentFramePassengers += passPerSec * delta;
            }
        });

        const currentNetIncome = (grossIncomeThisFrame - totalUpkeepThisFrame) / delta;

        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = currentNetIncome;
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
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return Math.floor(value / 1000) + 'K';
        return Math.floor(value);
    }
    
    _formatNumber(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}