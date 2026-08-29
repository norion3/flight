/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.6: 投資プログレスシステムの導入 (Step 2)】
 * Data_Upgrades.js の新しいデータ構造（レベルとステップ）に対応しました。
 * 1. 状態管理を `progress: { level, step }` に変更。
 * 2. 5ステップで1レベル上がるロジックを実装。
 * 3. `getBonuses` で、現在のステップに対応するボーナス値を正確に抽出・適用。
 */

import { UPGRADE_DATA } from './Data_Upgrades.js';

export class UpgradeManager {
    constructor() {
        // 各アップグレード項目の現在の進行度を保持するオブジェクト
        this.progress = {};
        for (const key in UPGRADE_DATA) {
            this.progress[key] = { level: 0, step: 0 };
        }
    }

    /**
     * 指定された項目の現在のレベルを取得
     */
    getCurrentLevel(upgradeId) {
        return this.progress[upgradeId] ? this.progress[upgradeId].level : 0;
    }

    /**
     * 指定された項目の現在のステップを取得
     */
    getCurrentStep(upgradeId) {
        return this.progress[upgradeId] ? this.progress[upgradeId].step : 0;
    }

    /**
     * 指定された項目の最大レベルを取得
     */
    getMaxLevel(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        return data ? data.maxLevel : 0;
    }

    /**
     * 次の投資（ステップまたはレベルアップ）に必要なコストを取得
     * すでに最大レベルの場合は null を返す
     */
    getNextCost(upgradeId) {
        const p = this.progress[upgradeId];
        if (!p) return null;

        const data = UPGRADE_DATA[upgradeId];
        if (!data) return null;

        if (p.level >= data.maxLevel) return null;

        let nextLevel = p.level;
        let nextStep = p.step + 1;

        // ステップが5になる（=現在のレベルのステップをすべて終えた）場合、次のレベルのステップ0のコストを見る
        if (nextStep >= 5) {
            nextLevel = p.level + 1;
            nextStep = 0;
            // もし次が MAX Level だった場合は、そこで打ち止めなのでコストは null (実際はMAXデータ側に0が設定されているが)
            if (nextLevel >= data.maxLevel) return null;
        }

        const levelData = data.levels.find(l => l.level === nextLevel);
        if (!levelData || !levelData.steps) return null;

        const stepData = levelData.steps.find(s => s.step === nextStep);
        return stepData ? stepData.cost : null;
    }

    /**
     * アップグレードを実行する（実際の資金消費は呼び出し元のGameManager等で行う想定）
     */
    upgrade(upgradeId, economyManager) {
        const cost = this.getNextCost(upgradeId);
        if (cost === null) return false; // 最大レベル到達済み
        
        if (economyManager.funds >= cost) {
            economyManager.funds -= cost;
            
            const p = this.progress[upgradeId];
            p.step++;
            
            // 5ステップ完了したらレベルアップ
            if (p.step >= 5) {
                p.step = 0;
                p.level++;
            }
            return true;
        }
        return false; // 資金不足
    }

    /**
     * 全アップグレード項目を走査し、現在の進行度（レベル・ステップ）に対応する
     * ボーナス総計を計算して返す
     */
    getBonuses() {
        let bonuses = {
            maxPlanes: 5,             // 初期機体数
            speedMultiplier: 1.0,     // 速度倍率
            incomeRate: 1.0,          // 収益倍率 (ベース1.0 + ボーナス)
            satisfaction: 0,          // 満足度ボーナス
        };

        for (const key in UPGRADE_DATA) {
            const data = UPGRADE_DATA[key];
            const p = this.progress[key];
            
            if (!p) continue;

            const levelData = data.levels.find(l => l.level === p.level);
            if (!levelData || !levelData.steps) continue;

            // 現在到達しているステップのデータを取得
            const currentStepData = levelData.steps.find(s => s.step === p.step);
            if (!currentStepData) continue;

            // 各項目ごとに設定されている効果を加算・適用
            if (currentStepData.capacity !== undefined) {
                bonuses.maxPlanes = currentStepData.capacity; // 機体上限は上書き
            }
            if (currentStepData.speedMultiplier !== undefined) {
                // 乗算（今回は各項目1つずつなのでそのまま適用）
                bonuses.speedMultiplier *= currentStepData.speedMultiplier;
            }
            if (currentStepData.bonusIncomeRate !== undefined) {
                bonuses.incomeRate += currentStepData.bonusIncomeRate;
            }
            if (currentStepData.bonusSatisfaction !== undefined) {
                bonuses.satisfaction += currentStepData.bonusSatisfaction;
            }
        }

        return bonuses;
    }
}