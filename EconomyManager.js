/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1.5: 経済ロジックの完成 (Proposal 022)】
 * 1. 【錬金術の防止】: 待機中（路線なし）の機体は、維持費はかかるものの、
 * 収益と客数を生まないように正確なタイクーンロジック(`plane.currentRoute` 判定)を実装。
 * 2. 【処理落ち防止】: `NetworkManager` のキャッシュされた総延長距離を参照することで、
 * 毎フレームの負荷をゼロに。
 * 3. 【1ドルのチカチカ現象解消】: スムージング（Lerp）の目標値との差額が0.5未満になった際、
 * スナップさせてUIの数字をピタッと完全に停止させる処理を追加。
 * 4. 【Utils のインポート保証】: 不要な内部計算メソッドを削除し、クリーンアップ。
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

    update(delta, playerPlanes, networkManager) {
        let currentFrameGrossIncome = 0;
        let currentFrameUpkeep = 0;
        let currentFramePassengers = 0;
        let totalPlanesCount = 0;

        // ★修正 (Proposal 022): 毎フレーム計算ではなく、キャッシュされた値(軽量)を読み取る
        const totalNetworkLength = networkManager ? networkManager.playerTotalNetworkLength : 0;
        const networkBonus = 1.0 + (Math.sqrt(totalNetworkLength) * CONFIG.ECONOMY.NETWORK_BONUS_MULTIPLIER);

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                const type = plane.sizeType || 'small';
                const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                
                // 維持費は、待機中であってもすべての機体から引かれる（タイクーンの基本原則）
                currentFrameUpkeep += planeConf.upkeep;

                // ★修正 (Proposal 022): 有効な路線を飛んでいる機体のみが収益と客数を生み出す（錬金術の防止）
                // 地球儀の裏側にいる機体も currentRoute は保持しているため正常に稼働します
                if (plane.currentRoute) {
                    const routeIncome = planeConf.incomeBase * networkBonus;
                    const routePassengers = planeConf.baseDemand * 0.5 * networkBonus;

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
        
        // ★追加 (Proposal 022): チカチカ現象を解消し、完全に停止（スナップ）させる
        if (Math.abs(this.lastSecondIncome - this.displayIncome) < 0.5) {
            this.displayIncome = this.lastSecondIncome;
        }

        const displayVal = Math.round(this.displayIncome);
        const incomePrefix = displayVal >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${incomePrefix}${this._formatMoneyNumber(Math.abs(displayVal))}/s`;

        // 引数に実際の数値(displayVal)は渡さず、フォーマット文字列だけを渡す元の仕様を維持
        // （UIManager側で文字列先頭の '+/ -' を判定して色を変えます）
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