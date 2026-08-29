/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 3.1: 競争とシェア計算ロジックの土台】
 * 新規作成ファイル。プレイヤーとライバルAIの路線網・顧客満足度を監視し、
 * 各空港における「シェア率(0.0〜1.0)」を毎フレーム裏側で計算してキャッシュします。
 * このフェーズでは純粋な計算のみを行い、まだゲームプレイ（収益等）には影響を与えません。
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
        // とりあえずプレイヤーが投資しないと負ける程度の固定値(例: 150)にしておく
        this.baseAiSatisfaction = 150; 
    }

    /**
     * 毎フレーム呼ばれ、全空港のシェアを再計算する
     * ※ 重い場合は update 頻度を落とす(1秒に1回など)が、一旦毎フレーム計算で実装
     */
    update(delta) {
        this._calculateShares();
    }

    _calculateShares() {
        this.shares = {};
        const companies = CONFIG.COMPANIES.map(c => c.id);

        // 1. 各空港に乗り入れている会社の「パワー」を集計する
        const airportPowers = {};

        companies.forEach(companyId => {
            const compNetwork = this.networkManager.network[companyId];
            if (!compNetwork) return;

            // 顧客満足度ボーナスの取得
            let satisfaction = 0;
            if (companyId === 'player') {
                const bonuses = this.upgradeManager.getBonuses();
                satisfaction = bonuses.satisfaction || 0;
            } else {
                satisfaction = this.baseAiSatisfaction;
            }

            // パワー乗数: 1.0 + (満足度 / 100)
            const powerMultiplier = 1.0 + (satisfaction / 100);

            for (const originId in compNetwork) {
                const routesCount = compNetwork[originId].length;
                if (routesCount > 0) {
                    if (!airportPowers[originId]) airportPowers[originId] = {};
                    
                    // パワー = 接続路線数 × 顧客満足度倍率
                    airportPowers[originId][companyId] = routesCount * powerMultiplier;
                }
            }
        });

        // 2. 集計したパワーを元に、シェア率 (0.0〜1.0) を計算して確定させる
        for (const airportId in airportPowers) {
            const powers = airportPowers[airportId];
            
            // その空港の全会社のパワー合計を出す
            let totalPower = 0;
            for (const cId in powers) {
                totalPower += powers[cId];
            }

            // 合計パワーが0ならスキップ
            if (totalPower <= 0) continue;

            this.shares[airportId] = {};
            for (const cId in powers) {
                this.shares[airportId][cId] = powers[cId] / totalPower;
            }
        }
    }

    /**
     * 指定された空港における、指定された会社のシェア率(0.0〜1.0)を取得する
     * まだ誰も乗り入れていない場合は 1.0 を返す(独占状態)
     */
    getShare(airportId, companyId = 'player') {
        if (!this.shares[airportId]) return 1.0; 
        return this.shares[airportId][companyId] || 0.0;
    }
}