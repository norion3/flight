/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.8: MAX判定バグの修正】
 * 1. `upgrade` メソッドにて、5回目の投資（step: 4の次の昇格コスト支払い）が
 * 完了した瞬間に即座にレベルアップする（p.step >= 5）ように判定を修正しました。
 * 2. これにより、存在しない「6回目の投資」を探して $0K になるバグを完全に排除し、
 * UIManager の MAX 判定と完全に同期するようになりました。
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

        // すでに最大レベルに達している場合はコスト無し
        if (p.level >= data.maxLevel) return null;

        const nextStep = p.step + 1;

        const levelData = data.levels.find(l => l.level === p.level);
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
            
            // ★バグ修正: 5回目の投資（昇格コストの支払い）が完了した瞬間にレベルアップする
            if (p.step >= 5) {
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