/**
 * AI可読性・先祖返り防止コメント:
 * 【バグ修正・バランス調整: 「量より質」のシェア計算へ】
 * 1. 路線数スパムが強すぎる問題を解決するため、路線数の影響を `Math.sqrt` で減衰させ、
 * 顧客満足度の影響を `Math.pow(..., 2.0)` で指数関数的に強化しました。
 * 2. 初期空港など、パワーが未定義・または0の場合の 0除算(NaN) クラッシュを完全に防御しました。
 */

import { CONFIG } from './Config.js';

export class CompetitionManager {
    constructor(networkManager, upgradeManager, rivalManager) {
        this.networkManager = networkManager;
        this.upgradeManager = upgradeManager;
        this.rivalManager = rivalManager;

        // { airportId: { 'player': 0.8, 'rival_eu': 0.2, ... } } の形で各空港のシェアを保持
        this.shares = {};
        
        // AIライバルの基礎的な「顧客満足度」 (今後の難易度調整用)
        // プレイヤーが投資しないと勝てないよう固定値(例: 150)にしておく
        this.baseAiSatisfaction = 150; 
    }

    /**
     * 毎フレーム呼ばれ、全空港のシェアを再計算する
     */
    update(delta) {
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        const companies = CONFIG.COMPANIES;
        
        // 1. 各空港における、各会社の「パワー」を集計
        const airportPowers = {}; // { 'LHR': { 'player': 100, 'rival_eu': 50 }, ... }

        companies.forEach(comp => {
            const companyId = comp.id;
            const compNetwork = this.networkManager.network[companyId];
            if (!compNetwork) return;

            let satisfaction = 0;
            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
            } else {
                satisfaction = this.baseAiSatisfaction;
            }

            // ★修正: 満足度（ブランド力）の影響を二次関数的に強める
            const satisfactionFactor = Math.pow(1.0 + (satisfaction / 100), 2.0);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    // ★修正: 路線数の影響は平方根で減衰（量より質）
                    const routeFactor = Math.sqrt(routesCount);
                    
                    // パワー = 路線数ファクター × 顧客満足度ファクター
                    airportPowers[originId][companyId] = routeFactor * satisfactionFactor;
                }
            }
        });

        // 2. 集計したパワーを元に、シェア率 (0.0〜1.0) を計算して確定させる
        for (const airportId in airportPowers) {
            const powers = airportPowers[airportId];
            
            // その空港の全会社のパワー合計を出す
            let totalPower = 0;
            for (const cId in powers) {
                totalPower += (powers[cId] || 0); // undefined対策
            }

            // ★修正: 合計パワーが0以下の場合はNaNを防ぐためスキップ（シェア0）
            if (totalPower <= 0) {
                this.shares[airportId] = {};
                continue;
            }

            this.shares[airportId] = {};
            for (const cId in powers) {
                this.shares[airportId][cId] = (powers[cId] || 0) / totalPower;
            }
        }
    }

    /**
     * 指定された空港における、指定された会社のシェア率(0.0〜1.0)を取得する
     */
    getShare(airportId, companyId = 'player') {
        // ★修正: データが存在しない場合は安全に 0 を返す（NaN伝播防止）
        if (!this.shares[airportId] || this.shares[airportId][companyId] === undefined) {
            return 0;
        }
        return this.shares[airportId][companyId];
    }
}