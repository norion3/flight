/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: ダイナミック経済システムの中核】
 * 1. 距離と空港ランクに応じた動的な空路開拓費の算出 (`calculateRouteCost`)
 * 2. 機体のサイズ、空港の需要キャップ、距離に応じた動的収益と維持費の計算 (`update`)
 * 3. 資金がマイナスにならない防波堤機構 (`deductFunds`) を完備。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class EconomyManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.funds = CONFIG.ECONOMY.INITIAL_FUNDS;
        this.incomePerSecond = 0;
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

    // ★追加: 距離と空港ランクに基づいた動的な空路開拓費用の計算
    calculateRouteCost(fromData, toData) {
        const posA = Utils.latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS);
        const posB = Utils.latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB); // 3D上の大円距離

        const rankA = CONFIG.ECONOMY.AIRPORT_RANKS[fromData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankB = CONFIG.ECONOMY.AIRPORT_RANKS[toData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankMultiplier = (rankA.multiplier + rankB.multiplier) / 2;

        const cost = CONFIG.ECONOMY.ROUTE_BASE_COST + (distance * CONFIG.ECONOMY.ROUTE_DISTANCE_COST_RATE * rankMultiplier);
        return Math.round(cost / 1000) * 1000; // 1,000単位で丸める
    }

    update(delta, playerPlanes) {
        let grossIncome = 0;
        let totalUpkeep = 0;
        let currentPassengers = 0;
        let totalPlanesCount = 0;

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                if (plane.currentRoute && plane.currentRoute.data) {
                    const type = plane.sizeType || 'small';
                    const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                    
                    // 維持費の加算
                    totalUpkeep += planeConf.upkeep;

                    // 目的地の空港ランクによる需要キャップ・メリハリ計算
                    const destData = plane.currentRoute.data;
                    const rankConf = CONFIG.ECONOMY.AIRPORT_RANKS[destData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
                    
                    // 需要キャップを超えると効率が頭打ちになる（小さな空港に大型機を飛ばすと赤字リスク）
                    const effectiveDemand = Math.min(planeConf.baseDemand, rankConf.demandCap);
                    const demandRatio = effectiveDemand / planeConf.baseDemand;

                    const routeIncome = planeConf.incomeBase * rankConf.multiplier * demandRatio;
                    const routePassengers = Math.floor(effectiveDemand * 0.5);

                    grossIncome += routeIncome;
                    currentPassengers += routePassengers;
                }
            }
        });

        // ネット収益（総収入 - 維持費）
        this.incomePerSecond = grossIncome - totalUpkeep;
        
        // 資金と搭乗客数の加算
        this.addFunds(this.incomePerSecond * delta);
        this.totalPassengers += currentPassengers * delta;

        // UIへの反映（HUD更新）
        const incomePrefix = this.incomePerSecond >= 0 ? '+$ ' : '-$ ';
        const formattedIncome = `${incomePrefix}${this._formatMoneyNumber(Math.abs(this.incomePerSecond))}/s`;

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