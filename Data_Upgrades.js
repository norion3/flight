/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.5: 投資データのブラッシュアップ】
 * 1. 効果が未実装だった「地上オペレーション」を「空港オペレーション最適化」に改名し、
 * 確実に収益が上がるボーナス（bonusIncomeRate）へ変更しました。
 * 2. 顧客満足度（bonusSatisfaction）による収益増のバランスを取るため、
 * 後続のEconomyManagerで確実な乗算ボーナスがかかる設計に合わせています。
 */

export const UPGRADE_DATA = {
    // --- 特殊枠：機体保有枠の拡張 ---
    fleet_capacity: {
        id: 'fleet_capacity',
        name: '駐機場・機体保有枠の拡張',
        maxLevel: 4,
        levels: [
            { level: 0, cost: 0,          capacity: 5 },   
            { level: 1, cost: 25000000,   capacity: 20 },  // $ 25.0M
            { level: 2, cost: 80000000,   capacity: 50 },  // $ 80.0M
            { level: 3, cost: 300000000,  capacity: 100 }, // $ 300.0M
            { level: 4, cost: 1000000000, capacity: 200 }  // $ 1.0B
        ]
    },

    // --- 財務・運航 (Finance & Operations) ---
    ticket_price: {
        id: 'ticket_price',
        name: 'チケット価格設定',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusIncomeRate: 0.0 },
            { level: 1, cost: 50000,   bonusIncomeRate: 0.5 },  // +50%
            { level: 2, cost: 150000,  bonusIncomeRate: 1.0 },  // +100%
            { level: 3, cost: 461000,  bonusIncomeRate: 1.8 },  // +180%
            { level: 4, cost: 1200000, bonusIncomeRate: 3.0 },  // +300%
            { level: 5, cost: 3500000, bonusIncomeRate: 5.0 }   // +500%
        ]
    },
    flight_speed: {
        id: 'flight_speed',
        name: 'フライト速度強化',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       speedMultiplier: 1.0 },
            { level: 1, cost: 100000,  speedMultiplier: 1.1 },  // +10% 
            { level: 2, cost: 350000,  speedMultiplier: 1.2 },  // +20%
            { level: 3, cost: 922000,  speedMultiplier: 1.3 },  // +30%
            { level: 4, cost: 2500000, speedMultiplier: 1.4 },  // +40%
            { level: 5, cost: 6000000, speedMultiplier: 1.5 }   // +50%
        ]
    },
    cabin_comfort: {
        id: 'cabin_comfort',
        name: '機内快適性',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusSatisfaction: 0 },
            { level: 1, cost: 80000,   bonusSatisfaction: 15 },
            { level: 2, cost: 220000,  bonusSatisfaction: 35 },
            { level: 3, cost: 519000,  bonusSatisfaction: 60 },  
            { level: 4, cost: 1500000, bonusSatisfaction: 90 },
            { level: 5, cost: 4000000, bonusSatisfaction: 120 }
        ]
    },

    // --- 人員・スタッフ (Personnel & Staff) ---
    pilot_training: {
        id: 'pilot_training',
        name: 'パイロット訓練',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusIncomeRate: 0.0 },
            { level: 1, cost: 10000,   bonusIncomeRate: 0.4 },  // +40%
            { level: 2, cost: 27000,   bonusIncomeRate: 1.04 }, // +104%
            { level: 3, cost: 85000,   bonusIncomeRate: 1.8 },
            { level: 4, cost: 250000,  bonusIncomeRate: 3.0 },
            { level: 5, cost: 800000,  bonusIncomeRate: 5.0 }
        ]
    },
    // ★変更: 地上オペレーション -> 空港オペレーション最適化（効果を収益アップへ変更）
    ground_ops: {
        id: 'ground_ops',
        name: '空港オペレーション最適化',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusIncomeRate: 0.0 },
            { level: 1, cost: 50000,   bonusIncomeRate: 0.2 },  // +20%
            { level: 2, cost: 293000,  bonusIncomeRate: 0.5 },  // +50%
            { level: 3, cost: 800000,  bonusIncomeRate: 0.9 },  // +90%
            { level: 4, cost: 2000000, bonusIncomeRate: 1.5 },  // +150%
            { level: 5, cost: 5000000, bonusIncomeRate: 2.5 }   // +250%
        ]
    },
    hr_management: {
        id: 'hr_management',
        name: '人事管理・採用',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusSatisfaction: 0 },
            { level: 1, cost: 60000,   bonusSatisfaction: 20 },
            { level: 2, cost: 197000,  bonusSatisfaction: 48 }, 
            { level: 3, cost: 500000,  bonusSatisfaction: 75 },
            { level: 4, cost: 1200000, bonusSatisfaction: 100 },
            { level: 5, cost: 3000000, bonusSatisfaction: 130 }
        ]
    },

    // --- サービス (Services) ---
    catering: {
        id: 'catering',
        name: '機内食・ケータリング',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusSatisfaction: 0 },
            { level: 1, cost: 120000,  bonusSatisfaction: 25 },
            { level: 2, cost: 350000,  bonusSatisfaction: 50 },
            { level: 3, cost: 922000,  bonusSatisfaction: 80 }, 
            { level: 4, cost: 2000000, bonusSatisfaction: 110 },
            { level: 5, cost: 5000000, bonusSatisfaction: 150 }
        ]
    },
    entertainment: {
        id: 'entertainment',
        name: '機内エンターテインメント',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusIncomeRate: 0.0 },
            { level: 1, cost: 90000,   bonusIncomeRate: 0.3 },
            { level: 2, cost: 250000,  bonusIncomeRate: 0.6 },
            { level: 3, cost: 634000,  bonusIncomeRate: 0.9 }, 
            { level: 4, cost: 1500000, bonusIncomeRate: 1.5 },
            { level: 5, cost: 3500000, bonusIncomeRate: 2.5 }
        ]
    },
    vip_lounge: {
        id: 'vip_lounge',
        name: 'VIPラウンジ設備',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,      bonusSatisfaction: 0, bonusIncomeRate: 0.0 },
            { level: 1, cost: 8000,   bonusSatisfaction: 20, bonusIncomeRate: 0.15 },
            { level: 2, cost: 27000,  bonusSatisfaction: 52, bonusIncomeRate: 0.39 }, 
            { level: 3, cost: 90000,  bonusSatisfaction: 85, bonusIncomeRate: 0.70 },
            { level: 4, cost: 250000, bonusSatisfaction: 120, bonusIncomeRate: 1.10 },
            { level: 5, cost: 800000, bonusSatisfaction: 160, bonusIncomeRate: 1.80 }
        ]
    }
};