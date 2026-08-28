/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: 経済ループの動的化】
 * 資金の増減、毎秒の収益計算、搭乗客数のカウントを行う「金庫番」クラスです。
 * 資金がマイナスになることを防ぐアサーション（防波堤）を `deductFunds` に組み込んでいます。
 */

import { CONFIG } from './Config.js';

export class EconomyManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.funds = CONFIG.ECONOMY.INITIAL_FUNDS;
        this.incomePerSecond = 0;
        this.totalPassengers = 0;
        this.maxPlanes = CONFIG.ECONOMY.MAX_PLANES_INITIAL;

        // 1機あたりの毎秒の収益と客数ベース（フライト中の機体から算出）
        this.incomeRates = { small: 2000, medium: 5000, large: 12000, super: 25000 };
        this.passengerRates = { small: 15, medium: 45, large: 120, super: 300 };
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
            // リファクタリング1: 資金マイナスバグの完全防止機構
            if (this.funds < 0) this.funds = 0;
            return true;
        }
        return false;
    }

    update(delta, playerPlanes) {
        let currentIncome = 0;
        let currentPassengers = 0;
        let totalPlanesCount = 0;

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                // 飛行中の機体のみ収益を発生させる
                if (plane.currentRoute) {
                    const type = plane.sizeType || 'small';
                    currentIncome += (this.incomeRates[type] || 0);
                    currentPassengers += (this.passengerRates[type] || 0);
                }
            }
        });

        this.incomePerSecond = currentIncome;
        
        // 収益と客数の加算
        this.addFunds(this.incomePerSecond * delta);
        this.totalPassengers += currentPassengers * delta;

        // UIへの反映（HUD更新）
        this.uiManager.updateTopHUD(
            this._formatMoney(this.funds),
            `+$ ${this._formatMoneyNumber(this.incomePerSecond)}/s`,
            totalPlanesCount,
            this.maxPlanes,
            this._formatNumber(Math.floor(this.totalPassengers))
        );
    }

    // 文字列フォーマット用ユーティリティ
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