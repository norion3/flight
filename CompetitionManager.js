/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 1: 競争とシェア計算ロジックの完成 (バグ修正版)】
 * 1. 路線数スパムが強すぎる問題を解決するため、路線数の影響を `Math.sqrt` で減衰させ、
 * 顧客満足度の影響を `Math.pow(..., 2.0)` で指数関数的に強化しました。
 * 2. プレイヤー単独路線の際にシェアが0になる致命的バグを修正。データ未定義時は
 * 「対象の会社が路線を持っていればシェア1.0(独占)、なければ0」を返すよう安全装置を組み込みました。
 */

import { CONFIG } from './Config.js';

export class CompetitionManager {
    constructor(networkManager, upgradeManager, rivalManager) {
        this.networkManager = networkManager;
        this.upgradeManager = upgradeManager;
        this.rivalManager = rivalManager;

        this.shares = {};
        this.baseAiSatisfaction = 150; 
    }

    update(delta) {
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        const companies = CONFIG.COMPANIES;
        const airportPowers = {}; 

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

            // 満足度（ブランド力）の影響を二次関数的に強める
            const satisfactionFactor = Math.pow(1.0 + (satisfaction / 100), 2.0);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    // 路線数の影響は平方根で減衰（量より質）
                    const routeFactor = Math.sqrt(routesCount);
                    
                    // パワー = 路線数ファクター × 顧客満足度ファクター
                    airportPowers[originId][companyId] = routeFactor * satisfactionFactor;
                }
            }
        });

        for (const airportId in airportPowers) {
            const powers = airportPowers[airportId];
            
            let totalPower = 0;
            for (const cId in powers) {
                totalPower += (powers[cId] || 0);
            }

            // 合計パワーが0以下の場合はスキップ
            if (totalPower <= 0) continue;

            this.shares[airportId] = {};
            for (const cId in powers) {
                this.shares[airportId][cId] = (powers[cId] || 0) / totalPower;
            }
        }
    }

    getShare(airportId, companyId = 'player') {
        // 対象の空港にシェアデータがまだ存在しない場合
        if (!this.shares[airportId] || this.shares[airportId][companyId] === undefined) {
            // その会社が該当空港に路線を引いているか確認
            const net = this.networkManager.network[companyId];
            if (net && net[airportId] && net[airportId].length > 0) {
                // 路線があるのにシェア未定義＝ライバル不在の単独乗り入れ（独占状態）
                return 1.0; 
            }
            return 0; // 路線なし
        }
        return this.shares[airportId][companyId];
    }
}