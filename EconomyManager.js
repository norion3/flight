/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: 収益の絶対安定化とインフレ制御 (Proposal 017)】
 * 1. 【絶対安定化】: 機体が飛んでいる「個別のルート・ランク」への依存を完全に廃止しました。
 * 代わりに、会社全体が構築した「ネットワーク総延長」からボーナスを算出し、全機体に一律で適用します。
 * プレイヤーがルートや機体をいじらない限り、収益は1ドルの狂いもなく完全にピタッと固定されます。
 * 2. 【インフレ制御】: ネットワーク総延長に対するボーナスを平方根(Math.sqrt)のカーブにすることで、
 * 長距離のロマンを残しつつも、後半の「最大200機」運用時の桁あふれを美しく防ぎます。
 * 3. 既存の1秒ごとのバッファとLerpは「表示のスムージング（演出）」としてのみ残し、高級感を維持しています。
 */

import { CONFIG } from './Config.js';

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
        // ★注: Utils が import されていない場合はグローバル等から取得するか、距離計算を代替する等の工夫が必要ですが
        // ここでは距離計算用に元のコードと同様に扱います
        const posA = this._latLonToVector3(fromData.lat, fromData.lon, CONFIG.GLOBE_RADIUS);
        const posB = this._latLonToVector3(toData.lat, toData.lon, CONFIG.GLOBE_RADIUS);
        const distance = posA.distanceTo(posB); 

        const rankA = CONFIG.ECONOMY.AIRPORT_RANKS[fromData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankB = CONFIG.ECONOMY.AIRPORT_RANKS[toData.type] || CONFIG.ECONOMY.AIRPORT_RANKS['fictional'];
        const rankMultiplier = (rankA.multiplier + rankB.multiplier) / 2;

        const cost = CONFIG.ECONOMY.ROUTE_BASE_COST + (distance * CONFIG.ECONOMY.ROUTE_DISTANCE_COST_RATE * rankMultiplier);
        return Math.round(cost / 1000) * 1000; 
    }

    // 内部用の簡易ユーティリティ (calculateRouteCost用)
    _latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        // Mathのオブジェクトとして返す（THREE.Vector3が無くても距離計算できるようにする簡易実装）
        return {
            x, y, z,
            distanceTo: function(v) {
                const dx = this.x - v.x;
                const dy = this.y - v.y;
                const dz = this.z - v.z;
                return Math.sqrt(dx*dx + dy*dy + dz*dz);
            }
        };
    }

    // ★修正: 引数に networkManager を追加し、ルートへの依存を廃止
    update(delta, playerPlanes, networkManager) {
        let currentFrameGrossIncome = 0;
        let currentFrameUpkeep = 0;
        let currentFramePassengers = 0;
        let totalPlanesCount = 0;

        // ★追加 (Proposal 017): ネットワーク総延長と平方根カーブによるボーナス倍率の計算
        const totalNetworkLength = networkManager ? networkManager.getTotalNetworkLength('player') : 0;
        const networkBonus = 1.0 + (Math.sqrt(totalNetworkLength) * CONFIG.ECONOMY.NETWORK_BONUS_MULTIPLIER);

        playerPlanes.forEach(plane => {
            if (plane.companyId === 'player') {
                totalPlanesCount++;
                const type = plane.sizeType || 'small';
                const planeConf = CONFIG.ECONOMY.PLANES[type] || CONFIG.ECONOMY.PLANES['small'];
                
                // 維持費の加算
                currentFrameUpkeep += planeConf.upkeep;

                // ★修正 (Proposal 017): 個別のルート・目的地ランクへの依存を排除し、完全固定化
                // 収益 = 機体の基本性能 × 会社全体のネットワーク規模ボーナス
                const routeIncome = planeConf.incomeBase * networkBonus;
                const routePassengers = planeConf.baseDemand * 0.5 * networkBonus;

                currentFrameGrossIncome += routeIncome;
                currentFramePassengers += routePassengers;
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
        // (総延長が変化しない限り、毎秒全く同じ値が確定値となるため完全に安定する)
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

        // UI表示用のスムージング処理（目標値が変わった瞬間だけ滑らかに動く）
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