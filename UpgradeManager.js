/**
 * AI可読性・先祖返り防止コメント:
 * 【創業時の基礎顧客満足度（初期値: 100）＆ レベルアップ判定完全保持】
 * 1. 創業時の標準サービス水準として `satisfaction` の基本初期値 100 を維持。
 * 2. 5回目の投資による昇格レベルアップ判定（p.step >= 5）およびその他のアップグレード計算は100%完全保持しています。
 */

import { UPGRADE_DATA } from './Data_Upgrades.js';

export class UpgradeManager {
    constructor() {
        this.progress = {};
        for (const key in UPGRADE_DATA) {
            this.progress[key] = { level: 0, step: 0 };
        }
        this.eventSatisfactionBonus = 0;
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

        const levelData = data.levels.find(l => l.level === p.level);
        if (!levelData || !levelData.steps) return null;

        const nextStepData = levelData.steps.find(s => s.step === p.step + 1);
        return nextStepData ? nextStepData.cost : null;
    }

    upgrade(upgradeId, economyManager) {
        const cost = this.getNextCost(upgradeId);
        if (cost === null) return false; 

        if (economyManager.funds >= cost) {
            economyManager.funds -= cost;
            
            const p = this.progress[upgradeId];
            p.step++;
            
            // 5回目の投資（昇格コストの支払い）が完了した瞬間にレベルアップする
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
            satisfaction: 100, // 創業時の標準サービス水準として初期値を 100 に設定         
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