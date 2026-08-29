/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.2: アップグレード管理ロジックの構築】
 * Data_Upgrades.js から静的データを読み込み、現在のプレイヤーの投資レベルを管理します。
 * 現時点では他のManager（GameManager等）からは呼び出されていないため、
 * エラーを起こさずにひっそりと存在し、次のUI連動ステップ(2.3〜2.4)の土台となります。
 */

import { UPGRADE_DATA } from './Data_Upgrades.js';

export class UpgradeManager {
    constructor() {
        // 全アップグレード項目の現在のレベルを保持するオブジェクト (初期値はすべて 0)
        this.levels = {};
        for (const key in UPGRADE_DATA) {
            this.levels[key] = 0;
        }
    }

    /**
     * 指定された項目の現在のレベルを取得
     */
    getCurrentLevel(upgradeId) {
        return this.levels[upgradeId] || 0;
    }

    /**
     * 指定された項目の最大レベルを取得
     */
    getMaxLevel(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        return data ? data.maxLevel : 0;
    }

    /**
     * 次のレベルにアップグレードするためのコストを取得
     * すでに最大レベルの場合は null を返す
     */
    getNextCost(upgradeId) {
        const currentLevel = this.getCurrentLevel(upgradeId);
        const maxLevel = this.getMaxLevel(upgradeId);
        
        if (currentLevel >= maxLevel) return null;
        
        const data = UPGRADE_DATA[upgradeId];
        // 次のレベルのデータからコストを取得
        const nextLevelData = data.levels.find(l => l.level === currentLevel + 1);
        return nextLevelData ? nextLevelData.cost : null;
    }

    /**
     * アップグレードを実行する（実際の資金消費は呼び出し元のGameManager等で行う想定）
     */
    upgrade(upgradeId, economyManager) {
        const cost = this.getNextCost(upgradeId);
        if (cost === null) return false; // 最大レベル
        
        if (economyManager.funds >= cost) {
            economyManager.funds -= cost;
            this.levels[upgradeId]++;
            return true;
        }
        return false; // 資金不足
    }

    /**
     * 全アップグレード項目を走査し、現在のボーナス総計を計算して返す
     * (EconomyManagerやPlaneManagerに渡すパラメータ群)
     */
    getBonuses() {
        let bonuses = {
            maxPlanes: 5,             // 初期機体数
            speedMultiplier: 1.0,     // 速度倍率
            incomeRate: 1.0,          // 収益倍率 (ベース1.0 + ボーナス)
            satisfaction: 0,          // 満足度ボーナス (競合用)
            turnaroundReduction: 0.0  // 地上待機時間の短縮率
        };

        for (const key in UPGRADE_DATA) {
            const data = UPGRADE_DATA[key];
            const currentLevel = this.levels[key];
            const levelData = data.levels.find(l => l.level === currentLevel);

            if (!levelData) continue;

            // 各項目ごとに設定されている効果を加算・適用
            if (levelData.capacity !== undefined) {
                bonuses.maxPlanes = levelData.capacity; // 機体上限は上書き
            }
            if (levelData.speedMultiplier !== undefined) {
                // 乗算ではなく、加算ベースにするかはお好みですが、ここでは最大値を使うか総乗算か
                // （今回は各項目1つずつなのでそのまま適用でOK）
                bonuses.speedMultiplier *= levelData.speedMultiplier;
            }
            if (levelData.bonusIncomeRate !== undefined) {
                bonuses.incomeRate += levelData.bonusIncomeRate;
            }
            if (levelData.bonusSatisfaction !== undefined) {
                bonuses.satisfaction += levelData.bonusSatisfaction;
            }
            if (levelData.turnaroundReduction !== undefined) {
                bonuses.turnaroundReduction += levelData.turnaroundReduction;
            }
        }

        return bonuses;
    }
}