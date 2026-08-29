/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.7: 投資プログレスシステムの達成感最大化 (Step 2)】
 * Data_Upgrades.js の新しい6段階構造（0〜5）に対応しました。
 * 1. `getNextCost` にて、ステップ5完了後（step >= 6）に次のレベルへ移行するよう判定を変更。
 * 2. `upgrade` メソッドでも、step が 6 になった瞬間にレベルアップするよう修正。
 */

import { UPGRADE_DATA } from './Data_Upgrades.js';

export class UpgradeManager {
    constructor() {
        this.progress = {};
        for (const key in UPGRADE_DATA) {
            this.progress[key] = { level: 0, step: 0 };
        }
    }

    getCurrentLevel(upgradeId) {
        return this.progress[upgradeId] ? this.progress[upgradeId].level : 0;
    }

    getCurrentStep(upgradeId) {
        return this.progress[upgradeId] ? this.progress[upgradeId].step : 0;
    }

    getMaxLevel(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        return data ? data.maxLevel : 0;
    }

    getNextCost(upgradeId) {
        const p = this.progress[upgradeId];
        if (!p) return null;

        const data = UPGRADE_DATA[upgradeId];
        if (!data) return null;

        if (p.level >= data.maxLevel) return null;

        let nextLevel = p.level;
        let nextStep = p.step + 1;

        // ★修正: 6段階目（step: 5）の投資が終わってから（nextStep >= 6 の時）レベルアップする
        if (nextStep >= 6) {
            nextLevel = p.level + 1;
            nextStep = 0;
            if (nextLevel >= data.maxLevel) return null;
        }

        const levelData = data.levels.find(l => l.level === nextLevel);
        if (!levelData || !levelData.steps) return null;

        const stepData = levelData.steps.find(s => s.step === nextStep);
        return stepData ? stepData.cost : null;
    }

    upgrade(upgradeId, economyManager) {
        const cost = this.getNextCost(upgradeId);
        if (cost === null) return false; 
        
        if (economyManager.funds >= cost) {
            economyManager.funds -= cost;
            
            const p = this.progress[upgradeId];
            p.step++;
            
            // ★修正: 6段階目（step: 5）が終わったらレベルアップ（p.step >= 6）
            if (p.step >= 6) {
                p.step = 0;
                p.level++;
            }
            return true;
        }
        return false; 
    }

    getBonuses() {
        let bonuses = {
            maxPlanes: 5,             
            speedMultiplier: 1.0,     
            incomeRate: 1.0,          
            satisfaction: 0,          
        };

        for (const key in UPGRADE_DATA) {
            const data = UPGRADE_DATA[key];
            const p = this.progress[key];
            
            if (!p) continue;

            const levelData = data.levels.find(l => l.level === p.level);
            if (!levelData || !levelData.steps) continue;

            const currentStepData = levelData.steps.find(s => s.step === p.step);
            if (!currentStepData) continue;

            if (currentStepData.capacity !== undefined) bonuses.maxPlanes = currentStepData.capacity; 
            if (currentStepData.speedMultiplier !== undefined) bonuses.speedMultiplier *= currentStepData.speedMultiplier;
            if (currentStepData.bonusIncomeRate !== undefined) bonuses.incomeRate += currentStepData.bonusIncomeRate;
            if (currentStepData.bonusSatisfaction !== undefined) bonuses.satisfaction += currentStepData.bonusSatisfaction;
        }

        return bonuses;
    }
}