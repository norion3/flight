/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 2.1: 投資データ構造の定義】
 * UIのモックアップと一致するアップグレード項目（財務、人員、サービス）および
 * プロジェクトの根幹である「機体保有枠の拡張（最大200機）」のデータを定義しています。
 * このファイルは静的なデータのみを保持し、他のロジックにはまだ影響を与えません。
 */

export const UPGRADE_DATA = {
    // --- 特殊枠：機体保有枠の拡張 ---
    // Proposal 017 に基づくインフレ対応
    fleet_capacity: {
        id: 'fleet_capacity',
        name: '駐機場・機体保有枠の拡張',
        maxLevel: 4,
        levels: [
            { level: 0, cost: 0,          capacity: 5 },   // 初期状態
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
            { level: 3, cost: 461000,  bonusIncomeRate: 1.8 },  // +180% (UIモック準拠)
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
            { level: 3, cost: 922000,  speedMultiplier: 1.3 },  // +30% (UIモック準拠)
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
            { level: 3, cost: 519000,  bonusSatisfaction: 60 },  // UIモック準拠
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
            { level: 2, cost: 27000,   bonusIncomeRate: 1.04 }, // +104% (UIモック準拠)
            { level: 3, cost: 85000,   bonusIncomeRate: 1.8 },
            { level: 4, cost: 250000,  bonusIncomeRate: 3.0 },
            { level: 5, cost: 800000,  bonusIncomeRate: 5.0 }
        ]
    },
    ground_ops: {
        id: 'ground_ops',
        name: '地上オペレーション',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       turnaroundReduction: 0.0 },
            { level: 1, cost: 50000,   turnaroundReduction: 0.05 },
            { level: 2, cost: 293000,  turnaroundReduction: 0.15 }, // UIモック準拠
            { level: 3, cost: 800000,  turnaroundReduction: 0.25 },
            { level: 4, cost: 2000000, turnaroundReduction: 0.35 },
            { level: 5, cost: 5000000, turnaroundReduction: 0.50 }
        ]
    },
    hr_management: {
        id: 'hr_management',
        name: '人事管理・採用',
        maxLevel: 5,
        levels: [
            { level: 0, cost: 0,       bonusSatisfaction: 0 },
            { level: 1, cost: 60000,   bonusSatisfaction: 20 },
            { level: 2, cost: 197000,  bonusSatisfaction: 48 }, // UIモック準拠
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
            { level: 3, cost: 922000,  bonusSatisfaction: 80 }, // UIモック準拠
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
            { level: 3, cost: 634000,  bonusIncomeRate: 0.9 }, // UIモック準拠
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
            { level: 2, cost: 27000,  bonusSatisfaction: 52, bonusIncomeRate: 0.39 }, // UIモック準拠
            { level: 3, cost: 90000,  bonusSatisfaction: 85, bonusIncomeRate: 0.70 },
            { level: 4, cost: 250000, bonusSatisfaction: 120, bonusIncomeRate: 1.10 },
            { level: 5, cost: 800000, bonusSatisfaction: 160, bonusIncomeRate: 1.80 }
        ]
    }
};