/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ3.2: 収益計算へのシェア反映とバグ修正】
 * 1. 致命的バグ修正: planes 配列を処理する際、自社('player')の機体のみを対象とするフィルターを追加。
 * 2. 各機体が向かっている空港の「シェア率」を competitionManager から取得し、収益に掛け合わせる処理を実装。
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

    update(delta, planes, networkManager, upgradeManager, competitionManager) {
        this.incomeTimer += delta;
        this.uiUpdateTimer += delta;

        // ★バグ修正: プレイヤーの機体のみを抽出して渡す
        const playerPlanes = planes.filter(p => p.companyId === 'player');

        const { income, passengers } = this._calculateCurrentIncome(playerPlanes, networkManager, upgradeManager, competitionManager);
        let currentGrossIncome = income;
        let currentFramePassengers = passengers;

        let totalUpkeep = 0;
        playerPlanes.forEach(plane => {
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

        const totalPlanesCount = playerPlanes.length; // ★修正: HUDやUIに渡す数もプレイヤー機のみに

        if (this.uiUpdateTimer >= 0.5) {
            this.uiManager.checkUpgradeButtons(upgradeManager, this.funds);
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
            totalPlanesCount, // ★修正: プレイヤー機のみの数を渡す
            this.maxPlanes,
            this._formatNumber(Math.floor(this.totalPassengers))
        );
    }

    _calculateCurrentIncome(playerPlanes, networkManager, upgradeManager, competitionManager) {
        let totalIncome = 0;
        let totalPassengers = 0;

        const bonuses = upgradeManager.getBonuses();
        const upgradeIncomeRate = bonuses.incomeRate || 1.0;
        const brandPower = 1.0 + ((bonuses.satisfaction || 0) / 100);

        playerPlanes.forEach(plane => {
            const planeConf = CONFIG.ECONOMY.PLANES[plane.type];
            if (!planeConf) return;

            let targetAirportId = null;
            if (plane.currentRoute && plane.currentRoute.id) {
                targetAirportId = plane.currentRoute.id;
            } else if (plane.currentAirportId) {
                targetAirportId = plane.currentAirportId;
            }

            // ★ Phase 3.2: CompetitionManagerからシェア率を取得
            let share = 1.0;
            if (targetAirportId && competitionManager) {
                share = competitionManager.getShare(targetAirportId, 'player');
            }

            // ★ Phase 3.2: 需要と基本収益にシェアを掛ける（競合していると稼げなくなる）
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