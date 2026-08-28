/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: ダイナミック経済システム（距離ボーナス・絶対安定スムージング版）】
 * 履歴330に基づき、以下の2点を実装しました。
 * 1. 【距離ボーナス】: 航路の長さに応じて `distanceBonus` を算出し、長距離路線の収益と搭乗客数を劇的に向上させます。
 * 2. 【絶対安定化】: 毎フレームの収益変動（機体の到着ラグなど）によるUIのチカチカを防ぐため、
 * 1秒間の総収益を裏でキャッシュし、1秒に1回だけ確定した平均値(lastSecondIncome)を算出します。
 * UI(displayIncome)はその確定値に向かってゆっくりと補間（Lerp）されるため、どっしりと落ち着いた表示になります。
 */

import { CONFIG } from './Config.js';
import { Utils } from './Utils.js';

export class EconomyManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.funds = CONFIG.ECONOMY.INITIAL_FUNDS;
        this.incomePerSecond = 0; 
        this.displayIncome = 0;   
        
        // 1秒キャッシュ用バッファ
        this.incomeTimer = 0;
        this.grossIncomeBuffer = 0;
        this.upkeepBuffer = 0;
        
        // 確定した1秒間の平均値
        this.lastSecondIncome = 0;
        this.isFirstSecond = true; // 初回のラグ防止用

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

    update(delta, playerPlanes) {
        let currentFrameGrossIncome = 0;
        let currentFrameUpkeep = 0;
        let currentFramePassengers = 0;
        let totalPlanesCount = 0;

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                if (plane.currentRoute && plane.currentRoute.data) {
                    const type = plane.sizeType || 'small';
                    const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                    
                    // 維持費の加算
                    currentFrameUpkeep += planeConf.upkeep;

                    // 目的地の空港ランクによる需要キャップ計算
                    const destData = plane.currentRoute.data;
                    const rankConf = CONFIG.ECONOMY.AIRPORT_RANKS[destData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
                    
                    const effectiveDemand = Math.min(planeConf.baseDemand, rankConf.demandCap);
                    const demandRatio = effectiveDemand / planeConf.baseDemand;

                    // ★追加：距離ボーナスの算出（遠くに飛ばすほどリターンが跳ね上がる）
                    const distanceBonus = 1.0 + (plane.currentRoute.length * CONFIG.ECONOMY.DISTANCE_INCOME_RATE);

                    // ★修正：距離ボーナスを収益と搭乗客数に掛ける
                    const routeIncome = planeConf.incomeBase * rankConf.multiplier * demandRatio * distanceBonus;
                    const routePassengers = Math.floor(effectiveDemand * 0.5 * distanceBonus);

                    currentFrameGrossIncome += routeIncome;
                    currentFramePassengers += routePassengers;
                }
            }
        });

        // 1秒間のキャッシュバッファに積分して加算
        this.grossIncomeBuffer += currentFrameGrossIncome * delta;
        this.upkeepBuffer += currentFrameUpkeep * delta;
        this.incomeTimer += delta;

        const currentNetIncome = currentFrameGrossIncome - currentFrameUpkeep;

        // 初回のラグを無くすため、最初の1秒間は現在の収益をそのまま目標値にする
        if (this.isFirstSecond) {
            this.lastSecondIncome = currentNetIncome;
        }

        // 1秒経過したらキャッシュを確定し、バッファをリセット
        if (this.incomeTimer >= 1.0) {
            this.lastSecondIncome = (this.grossIncomeBuffer - this.upkeepBuffer) / this.incomeTimer;
            this.grossIncomeBuffer = 0;
            this.upkeepBuffer = 0;
            this.incomeTimer = 0;
            this.isFirstSecond = false;
        }

        // 実際の資金と搭乗客数の加算は、フレームごとの正確な値で行う
        this.addFunds(currentNetIncome * delta);
        this.totalPassengers += currentFramePassengers * delta;

        // ★修正: 収益表示の絶対安定化（スムージング処理）
        // 目標値(lastSecondIncome)に向かって数秒かけてゆっくり追従させることで、パラパラ動くのを完全に殺す
        const lerpFactor = 1.0 - Math.pow(0.05, delta);
        this.displayIncome += (this.lastSecondIncome - this.displayIncome) * lerpFactor;

        // UIへの反映（HUD更新）
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