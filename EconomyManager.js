/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: ダイナミック経済システム（ネットワーク全体ボーナス・絶対安定化版）】
 * 履歴331に基づき、収益計算の根本を「機体ごとのルート長」から「会社全体のネットワーク規模」へ刷新しました。
 * 1. 【絶対安定化】: 機体が交差点を曲がるたびにブレていた仕様を廃止。路線網が変化しない限り、毎フレームの収益は1ドルの狂いもなく完全に一定になります。
 * 2. 【インフレ制御】: ネットワーク全体の総延長距離を計算し、平方根（Math.sqrt）を用いて緩やかな上昇カーブを描くボーナス倍率へと変換しています。
 * 3. 1秒キャッシュのLerpと組み合わせることで、新路線を繋いだ瞬間にだけUIの数字がスーッと上昇する、最高の手触りを実現しました。
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

        // ★追加: ネットワーク全体の規模ボーナスと平均ランクの算出
        let totalNetworkDistance = 0;
        let totalMultiplier = 0;
        let activeRoutesCount = 0;

        if (networkManager && networkManager.network['player']) {
            const playerNetwork = networkManager.network['player'];
            const processedRoutes = new Set();

            for (const originId in playerNetwork) {
                const routes = playerNetwork[originId];
                routes.forEach(route => {
                    // 双方向ルートの重複カウントを防ぐためのキー
                    const routeKey = [originId, route.id].sort().join('-');
                    if (!processedRoutes.has(routeKey)) {
                        processedRoutes.add(routeKey);
                        totalNetworkDistance += route.length;
                        
                        const destRankConf = CONFIG.ECONOMY.AIRPORT_RANKS[route.data.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
                        totalMultiplier += destRankConf.multiplier;
                        activeRoutesCount++;
                    }
                });
            }
        }

        let networkBonus = 1.0;
        let averageRankMultiplier = 1.0;

        // ★追加: 路線を持っている場合のみ、インフレを制御した平方根カーブでボーナスを確定
        if (activeRoutesCount > 0) {
            networkBonus = 1.0 + Math.sqrt(totalNetworkDistance * CONFIG.ECONOMY.DISTANCE_INCOME_RATE);
            averageRankMultiplier = totalMultiplier / activeRoutesCount;
        }

        // ★修正: 機体がどこを飛んでいても、会社が保有するネットワークの力で一律の収益を生み出す
        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                const type = plane.sizeType || 'small';
                const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                
                // 維持費は常にかかる
                currentFrameUpkeep += planeConf.upkeep;

                // ネットワーク（路線網）が存在すれば収益が発生する
                if (activeRoutesCount > 0) {
                    const routeIncome = planeConf.incomeBase * averageRankMultiplier * networkBonus;
                    const routePassengers = Math.floor(planeConf.baseDemand * 0.5 * averageRankMultiplier * networkBonus);

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
        if (value >= 1000000000) return `$ ${(value / 1000000000).toFixed(1)}B`; // 十億(インフレ対応)
        if (value >= 1000000) return `$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$ ${Math.floor(value / 1000)}K`;
        return `$ ${Math.floor(value)}`;
    }

    _formatMoneyNumber(value) {
        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`; // 十億(インフレ対応)
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${Math.floor(value / 1000)}K`;
        return `${Math.floor(value)}`;
    }

    _formatNumber(value) {
        return value.toLocaleString();
    }
}