/**
 * AI可読性・先祖返り防止コメント:
 * 【初期機体枠10へのスライド調整】
 * fleet_capacity の初期値を 10 機に合わせるため、Lv 0〜2 の容量を自然なカーブに調整しました。
 */

export const UPGRADE_DATA = {
    fleet_capacity: {
        id: 'fleet_capacity',
        name: '駐機場・機体保有枠の拡張',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, capacity: 10 }, { step: 1, cost: 5000000, capacity: 12 }, { step: 2, cost: 8000000, capacity: 15 }, { step: 3, cost: 12000000, capacity: 18 }, { step: 4, cost: 18000000, capacity: 22 }, { step: 5, cost: 25000000, capacity: 30 }] },
            { level: 1, steps: [{ step: 0, cost: 0, capacity: 30 }, { step: 1, cost: 28000000, capacity: 35 }, { step: 2, cost: 32000000, capacity: 40 }, { step: 3, cost: 38000000, capacity: 45 }, { step: 4, cost: 45000000, capacity: 50 }, { step: 5, cost: 60000000, capacity: 60 }] },
            { level: 2, steps: [{ step: 0, cost: 0, capacity: 60 }, { step: 1, cost: 65000000, capacity: 65 }, { step: 2, cost: 72000000, capacity: 72 }, { step: 3, cost: 80000000, capacity: 80 }, { step: 4, cost: 90000000, capacity: 90 }, { step: 5, cost: 120000000, capacity: 100 }] },
            { level: 3, steps: [{ step: 0, cost: 0, capacity: 100 }, { step: 1, cost: 130000000, capacity: 105 }, { step: 2, cost: 145000000, capacity: 110 }, { step: 3, cost: 160000000, capacity: 115 }, { step: 4, cost: 180000000, capacity: 125 }, { step: 5, cost: 250000000, capacity: 150 }] },
            { level: 4, steps: [{ step: 0, cost: 0, capacity: 150 }, { step: 1, cost: 265000000, capacity: 160 }, { step: 2, cost: 280000000, capacity: 170 }, { step: 3, cost: 300000000, capacity: 180 }, { step: 4, cost: 325000000, capacity: 195 }, { step: 5, cost: 450000000, capacity: 250 }] },
            { level: 5, steps: [{ step: 0, cost: 0, capacity: 250 }, { step: 1, cost: 480000000, capacity: 265 }, { step: 2, cost: 520000000, capacity: 280 }, { step: 3, cost: 570000000, capacity: 295 }, { step: 4, cost: 630000000, capacity: 315 }, { step: 5, cost: 800000000, capacity: 380 }] },
            { level: 6, steps: [{ step: 0, cost: 0, capacity: 380 }, { step: 1, cost: 2000000000, capacity: 400 }, { step: 2, cost: 2500000000, capacity: 420 }, { step: 3, cost: 3500000000, capacity: 440 }, { step: 4, cost: 5000000000, capacity: 460 }, { step: 5, cost: 10000000000, capacity: 550 }] },
            { level: 7, steps: [{ step: 0, cost: 0, capacity: 550 }, { step: 1, cost: 15000000000, capacity: 575 }, { step: 2, cost: 20000000000, capacity: 600 }, { step: 3, cost: 30000000000, capacity: 630 }, { step: 4, cost: 45000000000, capacity: 660 }, { step: 5, cost: 80000000000, capacity: 750 }] },
            { level: 8, steps: [{ step: 0, cost: 0, capacity: 750 }, { step: 1, cost: 120000000000, capacity: 780 }, { step: 2, cost: 160000000000, capacity: 810 }, { step: 3, cost: 220000000000, capacity: 840 }, { step: 4, cost: 300000000000, capacity: 880 }, { step: 5, cost: 500000000000, capacity: 950 }] },
            { level: 9, steps: [{ step: 0, cost: 0, capacity: 950 }, { step: 1, cost: 800000000000, capacity: 960 }, { step: 2, cost: 1200000000000, capacity: 970 }, { step: 3, cost: 2000000000000, capacity: 980 }, { step: 4, cost: 3500000000000, capacity: 990 }, { step: 5, cost: 6000000000000, capacity: 1000 }] },
            { level: 10, steps: [{ step: 0, cost: 0, capacity: 1000 }] }
        ]
    },

    ticket_price: {
        id: 'ticket_price',
        name: 'チケット価格設定',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.0 }, { step: 1, cost: 10000, bonusIncomeRate: 0.05 }, { step: 2, cost: 15000, bonusIncomeRate: 0.1 }, { step: 3, cost: 22000, bonusIncomeRate: 0.15 }, { step: 4, cost: 35000, bonusIncomeRate: 0.22 }, { step: 5, cost: 50000, bonusIncomeRate: 0.5 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.5 }, { step: 1, cost: 55000, bonusIncomeRate: 0.55 }, { step: 2, cost: 65000, bonusIncomeRate: 0.6 }, { step: 3, cost: 80000, bonusIncomeRate: 0.68 }, { step: 4, cost: 100000, bonusIncomeRate: 0.78 }, { step: 5, cost: 150000, bonusIncomeRate: 1.0 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.0 }, { step: 1, cost: 165000, bonusIncomeRate: 1.08 }, { step: 2, cost: 185000, bonusIncomeRate: 1.16 }, { step: 3, cost: 215000, bonusIncomeRate: 1.25 }, { step: 4, cost: 250000, bonusIncomeRate: 1.35 }, { step: 5, cost: 350000, bonusIncomeRate: 1.8 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.8 }, { step: 1, cost: 380000, bonusIncomeRate: 1.9 }, { step: 2, cost: 420000, bonusIncomeRate: 2.0 }, { step: 3, cost: 470000, bonusIncomeRate: 2.15 }, { step: 4, cost: 530000, bonusIncomeRate: 2.3 }, { step: 5, cost: 750000, bonusIncomeRate: 3.0 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 3.0 }, { step: 1, cost: 820000, bonusIncomeRate: 3.15 }, { step: 2, cost: 900000, bonusIncomeRate: 3.3 }, { step: 3, cost: 1000000, bonusIncomeRate: 3.5 }, { step: 4, cost: 1150000, bonusIncomeRate: 3.7 }, { step: 5, cost: 1600000, bonusIncomeRate: 5.0 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 5.0 }, { step: 1, cost: 1750000, bonusIncomeRate: 5.2 }, { step: 2, cost: 1950000, bonusIncomeRate: 5.4 }, { step: 3, cost: 2200000, bonusIncomeRate: 5.65 }, { step: 4, cost: 2500000, bonusIncomeRate: 5.9 }, { step: 5, cost: 3500000, bonusIncomeRate: 8.0 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 8.0 }, { step: 1, cost: 8000000000, bonusIncomeRate: 8.3 }, { step: 2, cost: 10000000000, bonusIncomeRate: 8.6 }, { step: 3, cost: 15000000000, bonusIncomeRate: 9.0 }, { step: 4, cost: 22000000000, bonusIncomeRate: 9.4 }, { step: 5, cost: 45000000000, bonusIncomeRate: 12.0 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 12.0 }, { step: 1, cost: 60000000000, bonusIncomeRate: 12.5 }, { step: 2, cost: 85000000000, bonusIncomeRate: 13.0 }, { step: 3, cost: 120000000000, bonusIncomeRate: 13.6 }, { step: 4, cost: 180000000000, bonusIncomeRate: 14.3 }, { step: 5, cost: 350000000000, bonusIncomeRate: 18.0 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 18.0 }, { step: 1, cost: 500000000000, bonusIncomeRate: 18.8 }, { step: 2, cost: 750000000000, bonusIncomeRate: 19.6 }, { step: 3, cost: 1100000000000, bonusIncomeRate: 20.5 }, { step: 4, cost: 1700000000000, bonusIncomeRate: 21.5 }, { step: 5, cost: 3000000000000, bonusIncomeRate: 28.0 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 28.0 }, { step: 1, cost: 4500000000000, bonusIncomeRate: 29.0 }, { step: 2, cost: 6500000000000, bonusIncomeRate: 30.0 }, { step: 3, cost: 10000000000000, bonusIncomeRate: 31.5 }, { step: 4, cost: 15000000000000, bonusIncomeRate: 33.0 }, { step: 5, cost: 30000000000000, bonusIncomeRate: 40.0 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 40.0 }] }
        ]
    },

    flight_speed: {
        id: 'flight_speed',
        name: 'フライト速度強化',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, speedMultiplier: 1.0 }, { step: 1, cost: 20000, speedMultiplier: 1.02 }, { step: 2, cost: 35000, speedMultiplier: 1.04 }, { step: 3, cost: 55000, speedMultiplier: 1.06 }, { step: 4, cost: 80000, speedMultiplier: 1.08 }, { step: 5, cost: 120000, speedMultiplier: 1.15 }] },
            { level: 1, steps: [{ step: 0, cost: 0, speedMultiplier: 1.15 }, { step: 1, cost: 130000, speedMultiplier: 1.16 }, { step: 2, cost: 145000, speedMultiplier: 1.17 }, { step: 3, cost: 165000, speedMultiplier: 1.18 }, { step: 4, cost: 190000, speedMultiplier: 1.19 }, { step: 5, cost: 250000, speedMultiplier: 1.25 }] },
            { level: 2, steps: [{ step: 0, cost: 0, speedMultiplier: 1.25 }, { step: 1, cost: 275000, speedMultiplier: 1.26 }, { step: 2, cost: 305000, speedMultiplier: 1.27 }, { step: 3, cost: 340000, speedMultiplier: 1.28 }, { step: 4, cost: 385000, speedMultiplier: 1.29 }, { step: 5, cost: 480000, speedMultiplier: 1.35 }] },
            { level: 3, steps: [{ step: 0, cost: 0, speedMultiplier: 1.35 }, { step: 1, cost: 530000, speedMultiplier: 1.36 }, { step: 2, cost: 590000, speedMultiplier: 1.37 }, { step: 3, cost: 660000, speedMultiplier: 1.38 }, { step: 4, cost: 740000, speedMultiplier: 1.39 }, { step: 5, cost: 900000, speedMultiplier: 1.45 }] },
            { level: 4, steps: [{ step: 0, cost: 0, speedMultiplier: 1.45 }, { step: 1, cost: 990000, speedMultiplier: 1.46 }, { step: 2, cost: 1100000, speedMultiplier: 1.47 }, { step: 3, cost: 1230000, speedMultiplier: 1.48 }, { step: 4, cost: 1380000, speedMultiplier: 1.49 }, { step: 5, cost: 1700000, speedMultiplier: 1.55 }] },
            { level: 5, steps: [{ step: 0, cost: 0, speedMultiplier: 1.55 }, { step: 1, cost: 1850000, speedMultiplier: 1.56 }, { step: 2, cost: 2050000, speedMultiplier: 1.57 }, { step: 3, cost: 2300000, speedMultiplier: 1.58 }, { step: 4, cost: 2600000, speedMultiplier: 1.59 }, { step: 5, cost: 3200000, speedMultiplier: 1.65 }] },
            { level: 6, steps: [{ step: 0, cost: 0, speedMultiplier: 1.65 }, { step: 1, cost: 7000000000, speedMultiplier: 1.67 }, { step: 2, cost: 9000000000, speedMultiplier: 1.69 }, { step: 3, cost: 12000000000, speedMultiplier: 1.71 }, { step: 4, cost: 18000000000, speedMultiplier: 1.73 }, { step: 5, cost: 35000000000, speedMultiplier: 1.80 }] },
            { level: 7, steps: [{ step: 0, cost: 0, speedMultiplier: 1.80 }, { step: 1, cost: 48000000000, speedMultiplier: 1.82 }, { step: 2, cost: 65000000000, speedMultiplier: 1.84 }, { step: 3, cost: 90000000000, speedMultiplier: 1.86 }, { step: 4, cost: 135000000000, speedMultiplier: 1.88 }, { step: 5, cost: 280000000000, speedMultiplier: 2.00 }] },
            { level: 8, steps: [{ step: 0, cost: 0, speedMultiplier: 2.00 }, { step: 1, cost: 400000000000, speedMultiplier: 2.03 }, { step: 2, cost: 600000000000, speedMultiplier: 2.06 }, { step: 3, cost: 900000000000, speedMultiplier: 2.09 }, { step: 4, cost: 1400000000000, speedMultiplier: 2.12 }, { step: 5, cost: 2500000000000, speedMultiplier: 2.30 }] },
            { level: 9, steps: [{ step: 0, cost: 0, speedMultiplier: 2.30 }, { step: 1, cost: 3800000000000, speedMultiplier: 2.34 }, { step: 2, cost: 5500000000000, speedMultiplier: 2.38 }, { step: 3, cost: 8500000000000, speedMultiplier: 2.42 }, { step: 4, cost: 13000000000000, speedMultiplier: 2.46 }, { step: 5, cost: 25000000000000, speedMultiplier: 2.80 }] },
            { level: 10, steps: [{ step: 0, cost: 0, speedMultiplier: 2.80 }] }
        ]
    },

    cabin_comfort: {
        id: 'cabin_comfort',
        name: '機内快適性',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 15000, bonusSatisfaction: 3 }, { step: 2, cost: 25000, bonusSatisfaction: 6 }, { step: 3, cost: 40000, bonusSatisfaction: 10 }, { step: 4, cost: 60000, bonusSatisfaction: 15 }, { step: 5, cost: 90000, bonusSatisfaction: 25 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 25 }, { step: 1, cost: 100000, bonusSatisfaction: 28 }, { step: 2, cost: 115000, bonusSatisfaction: 31 }, { step: 3, cost: 135000, bonusSatisfaction: 34 }, { step: 4, cost: 160000, bonusSatisfaction: 38 }, { step: 5, cost: 250000, bonusSatisfaction: 50 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 50 }, { step: 1, cost: 275000, bonusSatisfaction: 54 }, { step: 2, cost: 305000, bonusSatisfaction: 58 }, { step: 3, cost: 340000, bonusSatisfaction: 62 }, { step: 4, cost: 385000, bonusSatisfaction: 67 }, { step: 5, cost: 550000, bonusSatisfaction: 80 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 80 }, { step: 1, cost: 600000, bonusSatisfaction: 85 }, { step: 2, cost: 660000, bonusSatisfaction: 90 }, { step: 3, cost: 730000, bonusSatisfaction: 95 }, { step: 4, cost: 820000, bonusSatisfaction: 101 }, { step: 5, cost: 1200000, bonusSatisfaction: 120 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 120 }, { step: 1, cost: 1300000, bonusSatisfaction: 126 }, { step: 2, cost: 1450000, bonusSatisfaction: 132 }, { step: 3, cost: 1600000, bonusSatisfaction: 139 }, { step: 4, cost: 1800000, bonusSatisfaction: 146 }, { step: 5, cost: 2500000, bonusSatisfaction: 170 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 170 }, { step: 1, cost: 2750000, bonusSatisfaction: 178 }, { step: 2, cost: 3050000, bonusSatisfaction: 186 }, { step: 3, cost: 3400000, bonusSatisfaction: 195 }, { step: 4, cost: 3850000, bonusSatisfaction: 204 }, { step: 5, cost: 5000000, bonusSatisfaction: 240 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 240 }, { step: 1, cost: 9000000000, bonusSatisfaction: 250 }, { step: 2, cost: 12000000000, bonusSatisfaction: 260 }, { step: 3, cost: 18000000000, bonusSatisfaction: 272 }, { step: 4, cost: 28000000000, bonusSatisfaction: 284 }, { step: 5, cost: 55000000000, bonusSatisfaction: 330 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 330 }, { step: 1, cost: 75000000000, bonusSatisfaction: 345 }, { step: 2, cost: 100000000000, bonusSatisfaction: 360 }, { step: 3, cost: 150000000000, bonusSatisfaction: 376 }, { step: 4, cost: 230000000000, bonusSatisfaction: 393 }, { step: 5, cost: 420000000000, bonusSatisfaction: 450 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 450 }, { step: 1, cost: 600000000000, bonusSatisfaction: 470 }, { step: 2, cost: 850000000000, bonusSatisfaction: 490 }, { step: 3, cost: 1200000000000, bonusSatisfaction: 512 }, { step: 4, cost: 1800000000000, bonusSatisfaction: 535 }, { step: 5, cost: 3500000000000, bonusSatisfaction: 600 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 600 }, { step: 1, cost: 5000000000000, bonusSatisfaction: 625 }, { step: 2, cost: 7500000000000, bonusSatisfaction: 650 }, { step: 3, cost: 12000000000000, bonusSatisfaction: 678 }, { step: 4, cost: 18000000000000, bonusSatisfaction: 707 }, { step: 5, cost: 35000000000000, bonusSatisfaction: 850 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 850 }] }
        ]
    },

    pilot_training: {
        id: 'pilot_training',
        name: 'パイロット訓練',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.0 }, { step: 1, cost: 2000, bonusIncomeRate: 0.02 }, { step: 2, cost: 3500, bonusIncomeRate: 0.05 }, { step: 3, cost: 6000, bonusIncomeRate: 0.09 }, { step: 4, cost: 9500, bonusIncomeRate: 0.14 }, { step: 5, cost: 15000, bonusIncomeRate: 0.25 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.25 }, { step: 1, cost: 16500, bonusIncomeRate: 0.28 }, { step: 2, cost: 18500, bonusIncomeRate: 0.31 }, { step: 3, cost: 21500, bonusIncomeRate: 0.35 }, { step: 4, cost: 25000, bonusIncomeRate: 0.40 }, { step: 5, cost: 40000, bonusIncomeRate: 0.60 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.60 }, { step: 1, cost: 44000, bonusIncomeRate: 0.65 }, { step: 2, cost: 49000, bonusIncomeRate: 0.70 }, { step: 3, cost: 55000, bonusIncomeRate: 0.76 }, { step: 4, cost: 62000, bonusIncomeRate: 0.83 }, { step: 5, cost: 100000, bonusIncomeRate: 1.2 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.2 }, { step: 1, cost: 110000, bonusIncomeRate: 1.28 }, { step: 2, cost: 125000, bonusIncomeRate: 1.36 }, { step: 3, cost: 145000, bonusIncomeRate: 1.45 }, { step: 4, cost: 170000, bonusIncomeRate: 1.55 }, { step: 5, cost: 280000, bonusIncomeRate: 2.2 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 2.2 }, { step: 1, cost: 310000, bonusIncomeRate: 2.32 }, { step: 2, cost: 350000, bonusIncomeRate: 2.44 }, { step: 3, cost: 400000, bonusIncomeRate: 2.58 }, { step: 4, cost: 460000, bonusIncomeRate: 2.73 }, { step: 5, cost: 750000, bonusIncomeRate: 3.8 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 3.8 }, { step: 1, cost: 820000, bonusIncomeRate: 4.0 }, { step: 2, cost: 920000, bonusIncomeRate: 4.2 }, { step: 3, cost: 1050000, bonusIncomeRate: 4.45 }, { step: 4, cost: 1200000, bonusIncomeRate: 4.7 }, { step: 5, cost: 2000000, bonusIncomeRate: 6.5 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 6.5 }, { step: 1, cost: 5000000000, bonusIncomeRate: 6.8 }, { step: 2, cost: 7000000000, bonusIncomeRate: 7.1 }, { step: 3, cost: 10000000000, bonusIncomeRate: 7.45 }, { step: 4, cost: 15000000000, bonusIncomeRate: 7.8 }, { step: 5, cost: 30000000000, bonusIncomeRate: 10.5 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 10.5 }, { step: 1, cost: 45000000000, bonusIncomeRate: 11.0 }, { step: 2, cost: 60000000000, bonusIncomeRate: 11.5 }, { step: 3, cost: 85000000000, bonusIncomeRate: 12.1 }, { step: 4, cost: 130000000000, bonusIncomeRate: 12.8 }, { step: 5, cost: 250000000000, bonusIncomeRate: 16.5 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 16.5 }, { step: 1, cost: 380000000000, bonusIncomeRate: 17.2 }, { step: 2, cost: 550000000000, bonusIncomeRate: 17.9 }, { step: 3, cost: 850000000000, bonusIncomeRate: 18.7 }, { step: 4, cost: 1300000000000, bonusIncomeRate: 19.6 }, { step: 5, cost: 2400000000000, bonusIncomeRate: 25.5 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 25.5 }, { step: 1, cost: 3500000000000, bonusIncomeRate: 26.5 }, { step: 2, cost: 5000000000000, bonusIncomeRate: 27.5 }, { step: 3, cost: 8000000000000, bonusIncomeRate: 28.7 }, { step: 4, cost: 12000000000000, bonusIncomeRate: 30.0 }, { step: 5, cost: 22000000000000, bonusIncomeRate: 38.0 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 38.0 }] }
        ]
    },

    ground_ops: {
        id: 'ground_ops',
        name: '空港オペレーション最適化',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.0 }, { step: 1, cost: 10000, bonusIncomeRate: 0.03 }, { step: 2, cost: 16000, bonusIncomeRate: 0.06 }, { step: 3, cost: 25000, bonusIncomeRate: 0.10 }, { step: 4, cost: 38000, bonusIncomeRate: 0.15 }, { step: 5, cost: 60000, bonusIncomeRate: 0.30 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.30 }, { step: 1, cost: 66000, bonusIncomeRate: 0.33 }, { step: 2, cost: 74000, bonusIncomeRate: 0.36 }, { step: 3, cost: 84000, bonusIncomeRate: 0.40 }, { step: 4, cost: 96000, bonusIncomeRate: 0.45 }, { step: 5, cost: 160000, bonusIncomeRate: 0.70 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.70 }, { step: 1, cost: 175000, bonusIncomeRate: 0.75 }, { step: 2, cost: 195000, bonusIncomeRate: 0.80 }, { step: 3, cost: 220000, bonusIncomeRate: 0.86 }, { step: 4, cost: 250000, bonusIncomeRate: 0.93 }, { step: 5, cost: 420000, bonusIncomeRate: 1.3 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.3 }, { step: 1, cost: 460000, bonusIncomeRate: 1.38 }, { step: 2, cost: 510000, bonusIncomeRate: 1.46 }, { step: 3, cost: 580000, bonusIncomeRate: 1.55 }, { step: 4, cost: 660000, bonusIncomeRate: 1.65 }, { step: 5, cost: 1100000, bonusIncomeRate: 2.3 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 2.3 }, { step: 1, cost: 1200000, bonusIncomeRate: 2.42 }, { step: 2, cost: 1350000, bonusIncomeRate: 2.54 }, { step: 3, cost: 1500000, bonusIncomeRate: 2.68 }, { step: 4, cost: 1700000, bonusIncomeRate: 2.83 }, { step: 5, cost: 2800000, bonusIncomeRate: 3.8 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 3.8 }, { step: 1, cost: 3100000, bonusIncomeRate: 4.0 }, { step: 2, cost: 3450000, bonusIncomeRate: 4.2 }, { step: 3, cost: 3850000, bonusIncomeRate: 4.45 }, { step: 4, cost: 4350000, bonusIncomeRate: 4.7 }, { step: 5, cost: 7200000, bonusIncomeRate: 6.5 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 6.5 }, { step: 1, cost: 6000000000, bonusIncomeRate: 6.8 }, { step: 2, cost: 8000000000, bonusIncomeRate: 7.1 }, { step: 3, cost: 11000000000, bonusIncomeRate: 7.45 }, { step: 4, cost: 16000000000, bonusIncomeRate: 7.8 }, { step: 5, cost: 32000000000, bonusIncomeRate: 10.5 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 10.5 }, { step: 1, cost: 48000000000, bonusIncomeRate: 11.0 }, { step: 2, cost: 65000000000, bonusIncomeRate: 11.5 }, { step: 3, cost: 90000000000, bonusIncomeRate: 12.1 }, { step: 4, cost: 140000000000, bonusIncomeRate: 12.8 }, { step: 5, cost: 260000000000, bonusIncomeRate: 16.5 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 16.5 }, { step: 1, cost: 400000000000, bonusIncomeRate: 17.2 }, { step: 2, cost: 580000000000, bonusIncomeRate: 17.9 }, { step: 3, cost: 880000000000, bonusIncomeRate: 18.7 }, { step: 4, cost: 1350000000000, bonusIncomeRate: 19.6 }, { step: 5, cost: 2500000000000, bonusIncomeRate: 25.5 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 25.5 }, { step: 1, cost: 3600000000000, bonusIncomeRate: 26.5 }, { step: 2, cost: 5200000000000, bonusIncomeRate: 27.5 }, { step: 3, cost: 8200000000000, bonusIncomeRate: 28.7 }, { step: 4, cost: 12500000000000, bonusIncomeRate: 30.0 }, { step: 5, cost: 23000000000000, bonusIncomeRate: 38.0 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 38.0 }] }
        ]
    },

    hr_management: {
        id: 'hr_management',
        name: '人事管理・採用',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 12000, bonusSatisfaction: 3 }, { step: 2, cost: 20000, bonusSatisfaction: 7 }, { step: 3, cost: 32000, bonusSatisfaction: 12 }, { step: 4, cost: 50000, bonusSatisfaction: 18 }, { step: 5, cost: 80000, bonusSatisfaction: 30 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 30 }, { step: 1, cost: 88000, bonusSatisfaction: 33 }, { step: 2, cost: 98000, bonusSatisfaction: 36 }, { step: 3, cost: 112000, bonusSatisfaction: 40 }, { step: 4, cost: 128000, bonusSatisfaction: 45 }, { step: 5, cost: 210000, bonusSatisfaction: 60 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 60 }, { step: 1, cost: 230000, bonusSatisfaction: 64 }, { step: 2, cost: 255000, bonusSatisfaction: 68 }, { step: 3, cost: 285000, bonusSatisfaction: 73 }, { step: 4, cost: 325000, bonusSatisfaction: 79 }, { step: 5, cost: 550000, bonusSatisfaction: 95 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 95 }, { step: 1, cost: 600000, bonusSatisfaction: 100 }, { step: 2, cost: 670000, bonusSatisfaction: 105 }, { step: 3, cost: 750000, bonusSatisfaction: 111 }, { step: 4, cost: 850000, bonusSatisfaction: 118 }, { step: 5, cost: 1400000, bonusSatisfaction: 140 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 140 }, { step: 1, cost: 1540000, bonusSatisfaction: 146 }, { step: 2, cost: 1710000, bonusSatisfaction: 152 }, { step: 3, cost: 1910000, bonusSatisfaction: 159 }, { step: 4, cost: 2160000, bonusSatisfaction: 167 }, { step: 5, cost: 3600000, bonusSatisfaction: 195 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 195 }, { step: 1, cost: 3950000, bonusSatisfaction: 203 }, { step: 2, cost: 4400000, bonusSatisfaction: 211 }, { step: 3, cost: 4900000, bonusSatisfaction: 220 }, { step: 4, cost: 5550000, bonusSatisfaction: 230 }, { step: 5, cost: 9200000, bonusSatisfaction: 270 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 270 }, { step: 1, cost: 8500000000, bonusSatisfaction: 280 }, { step: 2, cost: 11500000000, bonusSatisfaction: 290 }, { step: 3, cost: 17000000000, bonusSatisfaction: 302 }, { step: 4, cost: 26000000000, bonusSatisfaction: 315 }, { step: 5, cost: 50000000000, bonusSatisfaction: 360 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 360 }, { step: 1, cost: 70000000000, bonusSatisfaction: 375 }, { step: 2, cost: 95000000000, bonusSatisfaction: 390 }, { step: 3, cost: 140000000000, bonusSatisfaction: 407 }, { step: 4, cost: 210000000000, bonusSatisfaction: 425 }, { step: 5, cost: 400000000000, bonusSatisfaction: 480 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 480 }, { step: 1, cost: 550000000000, bonusSatisfaction: 500 }, { step: 2, cost: 800000000000, bonusSatisfaction: 520 }, { step: 3, cost: 1150000000000, bonusSatisfaction: 542 }, { step: 4, cost: 1750000000000, bonusSatisfaction: 566 }, { step: 5, cost: 3200000000000, bonusSatisfaction: 630 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 630 }, { step: 1, cost: 4800000000000, bonusSatisfaction: 655 }, { step: 2, cost: 7200000000000, bonusSatisfaction: 680 }, { step: 3, cost: 11000000000000, bonusSatisfaction: 708 }, { step: 4, cost: 17000000000000, bonusSatisfaction: 738 }, { step: 5, cost: 32000000000000, bonusSatisfaction: 880 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 880 }] }
        ]
    },

    catering: {
        id: 'catering',
        name: '機内食・ケータリング',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 25000, bonusSatisfaction: 5 }, { step: 2, cost: 40000, bonusSatisfaction: 10 }, { step: 3, cost: 62000, bonusSatisfaction: 16 }, { step: 4, cost: 95000, bonusSatisfaction: 23 }, { step: 5, cost: 150000, bonusSatisfaction: 35 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 35 }, { step: 1, cost: 165000, bonusSatisfaction: 38 }, { step: 2, cost: 185000, bonusSatisfaction: 41 }, { step: 3, cost: 210000, bonusSatisfaction: 45 }, { step: 4, cost: 240000, bonusSatisfaction: 50 }, { step: 5, cost: 380000, bonusSatisfaction: 65 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 65 }, { step: 1, cost: 420000, bonusSatisfaction: 69 }, { step: 2, cost: 470000, bonusSatisfaction: 73 }, { step: 3, cost: 530000, bonusSatisfaction: 78 }, { step: 4, cost: 600000, bonusSatisfaction: 84 }, { step: 5, cost: 1000000, bonusSatisfaction: 100 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 100 }, { step: 1, cost: 1100000, bonusSatisfaction: 105 }, { step: 2, cost: 1220000, bonusSatisfaction: 110 }, { step: 3, cost: 1360000, bonusSatisfaction: 116 }, { step: 4, cost: 1540000, bonusSatisfaction: 123 }, { step: 5, cost: 2600000, bonusSatisfaction: 145 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 145 }, { step: 1, cost: 2850000, bonusSatisfaction: 151 }, { step: 2, cost: 3150000, bonusSatisfaction: 157 }, { step: 3, cost: 3500000, bonusSatisfaction: 164 }, { step: 4, cost: 3950000, bonusSatisfaction: 172 }, { step: 5, cost: 6500000, bonusSatisfaction: 200 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 200 }, { step: 1, cost: 7150000, bonusSatisfaction: 208 }, { step: 2, cost: 7900000, bonusSatisfaction: 216 }, { step: 3, cost: 8800000, bonusSatisfaction: 225 }, { step: 4, cost: 9900000, bonusSatisfaction: 235 }, { step: 5, cost: 16000000, bonusSatisfaction: 275 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 275 }, { step: 1, cost: 12000000000, bonusSatisfaction: 285 }, { step: 2, cost: 16000000000, bonusSatisfaction: 295 }, { step: 3, cost: 24000000000, bonusSatisfaction: 307 }, { step: 4, cost: 36000000000, bonusSatisfaction: 320 }, { step: 5, cost: 70000000000, bonusSatisfaction: 365 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 365 }, { step: 1, cost: 95000000000, bonusSatisfaction: 380 }, { step: 2, cost: 130000000000, bonusSatisfaction: 395 }, { step: 3, cost: 190000000000, bonusSatisfaction: 412 }, { step: 4, cost: 280000000000, bonusSatisfaction: 430 }, { step: 5, cost: 550000000000, bonusSatisfaction: 485 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 485 }, { step: 1, cost: 750000000000, bonusSatisfaction: 505 }, { step: 2, cost: 1050000000000, bonusSatisfaction: 525 }, { step: 3, cost: 1600000000000, bonusSatisfaction: 547 }, { step: 4, cost: 2400000000000, bonusSatisfaction: 571 }, { step: 5, cost: 4500000000000, bonusSatisfaction: 635 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 635 }, { step: 1, cost: 6500000000000, bonusSatisfaction: 660 }, { step: 2, cost: 9500000000000, bonusSatisfaction: 685 }, { step: 3, cost: 14500000000000, bonusSatisfaction: 713 }, { step: 4, cost: 22500000000000, bonusSatisfaction: 743 }, { step: 5, cost: 42000000000000, bonusSatisfaction: 890 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 890 }] }
        ]
    },

    entertainment: {
        id: 'entertainment',
        name: '機内エンターテインメント',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.0 }, { step: 1, cost: 18000, bonusIncomeRate: 0.04 }, { step: 2, cost: 29000, bonusIncomeRate: 0.08 }, { step: 3, cost: 45000, bonusIncomeRate: 0.13 }, { step: 4, cost: 68000, bonusIncomeRate: 0.19 }, { step: 5, cost: 110000, bonusIncomeRate: 0.35 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.35 }, { step: 1, cost: 120000, bonusIncomeRate: 0.38 }, { step: 2, cost: 135000, bonusIncomeRate: 0.41 }, { step: 3, cost: 155000, bonusIncomeRate: 0.45 }, { step: 4, cost: 180000, bonusIncomeRate: 0.50 }, { step: 5, cost: 280000, bonusIncomeRate: 0.80 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.80 }, { step: 1, cost: 310000, bonusIncomeRate: 0.85 }, { step: 2, cost: 350000, bonusIncomeRate: 0.90 }, { step: 3, cost: 390000, bonusIncomeRate: 0.96 }, { step: 4, cost: 440000, bonusIncomeRate: 1.03 }, { step: 5, cost: 720000, bonusIncomeRate: 1.5 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.5 }, { step: 1, cost: 790000, bonusIncomeRate: 1.58 }, { step: 2, cost: 880000, bonusIncomeRate: 1.66 }, { step: 3, cost: 980000, bonusIncomeRate: 1.75 }, { step: 4, cost: 1100000, bonusIncomeRate: 1.85 }, { step: 5, cost: 1800000, bonusIncomeRate: 2.5 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 2.5 }, { step: 1, cost: 1980000, bonusIncomeRate: 2.62 }, { step: 2, cost: 2190000, bonusIncomeRate: 2.74 }, { step: 3, cost: 2430000, bonusIncomeRate: 2.88 }, { step: 4, cost: 2710000, bonusIncomeRate: 3.03 }, { step: 5, cost: 4500000, bonusIncomeRate: 4.2 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 4.2 }, { step: 1, cost: 4950000, bonusIncomeRate: 4.4 }, { step: 2, cost: 5500000, bonusIncomeRate: 4.6 }, { step: 3, cost: 6150000, bonusIncomeRate: 4.85 }, { step: 4, cost: 6900000, bonusIncomeRate: 5.1 }, { step: 5, cost: 11000000, bonusIncomeRate: 6.8 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 6.8 }, { step: 1, cost: 9000000000, bonusIncomeRate: 7.1 }, { step: 2, cost: 12000000000, bonusIncomeRate: 7.4 }, { step: 3, cost: 18000000000, bonusIncomeRate: 7.75 }, { step: 4, cost: 28000000000, bonusIncomeRate: 8.1 }, { step: 5, cost: 55000000000, bonusIncomeRate: 10.8 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 10.8 }, { step: 1, cost: 75000000000, bonusIncomeRate: 11.3 }, { step: 2, cost: 100000000000, bonusIncomeRate: 11.8 }, { step: 3, cost: 150000000000, bonusIncomeRate: 12.4 }, { step: 4, cost: 230000000000, bonusIncomeRate: 13.1 }, { step: 5, cost: 420000000000, bonusIncomeRate: 16.8 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 16.8 }, { step: 1, cost: 600000000000, bonusIncomeRate: 17.5 }, { step: 2, cost: 850000000000, bonusIncomeRate: 18.2 }, { step: 3, cost: 1200000000000, bonusIncomeRate: 19.0 }, { step: 4, cost: 1800000000000, bonusIncomeRate: 19.9 }, { step: 5, cost: 3500000000000, bonusIncomeRate: 25.8 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 25.8 }, { step: 1, cost: 5000000000000, bonusIncomeRate: 26.8 }, { step: 2, cost: 7500000000000, bonusIncomeRate: 27.8 }, { step: 3, cost: 12000000000000, bonusIncomeRate: 29.0 }, { step: 4, cost: 18000000000000, bonusIncomeRate: 30.3 }, { step: 5, cost: 35000000000000, bonusIncomeRate: 38.3 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 38.3 }] }
        ]
    },

    vip_lounge: {
        id: 'vip_lounge',
        name: 'VIPラウンジ設備',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0, bonusIncomeRate: 0.0 }, { step: 1, cost: 16000, bonusSatisfaction: 4, bonusIncomeRate: 0.02 }, { step: 2, cost: 26000, bonusSatisfaction: 8, bonusIncomeRate: 0.05 }, { step: 3, cost: 41000, bonusSatisfaction: 13, bonusIncomeRate: 0.09 }, { step: 4, cost: 62000, bonusSatisfaction: 19, bonusIncomeRate: 0.14 }, { step: 5, cost: 100000, bonusSatisfaction: 35, bonusIncomeRate: 0.25 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 35, bonusIncomeRate: 0.25 }, { step: 1, cost: 110000, bonusSatisfaction: 38, bonusIncomeRate: 0.27 }, { step: 2, cost: 125000, bonusSatisfaction: 41, bonusIncomeRate: 0.29 }, { step: 3, cost: 145000, bonusSatisfaction: 45, bonusIncomeRate: 0.32 }, { step: 4, cost: 170000, bonusSatisfaction: 50, bonusIncomeRate: 0.36 }, { step: 5, cost: 260000, bonusSatisfaction: 65, bonusIncomeRate: 0.55 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 65, bonusIncomeRate: 0.55 }, { step: 1, cost: 285000, bonusSatisfaction: 69, bonusIncomeRate: 0.59 }, { step: 2, cost: 320000, bonusSatisfaction: 73, bonusIncomeRate: 0.63 }, { step: 3, cost: 360000, bonusSatisfaction: 78, bonusIncomeRate: 0.68 }, { step: 4, cost: 410000, bonusSatisfaction: 84, bonusIncomeRate: 0.74 }, { step: 5, cost: 650000, bonusSatisfaction: 100, bonusIncomeRate: 1.0 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 100, bonusIncomeRate: 1.0 }, { step: 1, cost: 715000, bonusSatisfaction: 105, bonusIncomeRate: 1.05 }, { step: 2, cost: 790000, bonusSatisfaction: 110, bonusIncomeRate: 1.10 }, { step: 3, cost: 880000, bonusSatisfaction: 116, bonusIncomeRate: 1.16 }, { step: 4, cost: 990000, bonusSatisfaction: 123, bonusIncomeRate: 1.23 }, { step: 5, cost: 1600000, bonusSatisfaction: 145, bonusIncomeRate: 1.6 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 145, bonusIncomeRate: 1.6 }, { step: 1, cost: 1760000, bonusSatisfaction: 151, bonusIncomeRate: 1.66 }, { step: 2, cost: 1950000, bonusSatisfaction: 157, bonusIncomeRate: 1.72 }, { step: 3, cost: 2180000, bonusSatisfaction: 164, bonusIncomeRate: 1.80 }, { step: 4, cost: 2450000, bonusSatisfaction: 172, bonusIncomeRate: 1.89 }, { step: 5, cost: 4000000, bonusSatisfaction: 200, bonusIncomeRate: 2.5 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 200, bonusIncomeRate: 2.5 }, { step: 1, cost: 4400000, bonusSatisfaction: 208, bonusIncomeRate: 2.6 }, { step: 2, cost: 4900000, bonusSatisfaction: 216, bonusIncomeRate: 2.7 }, { step: 3, cost: 5500000, bonusSatisfaction: 225, bonusIncomeRate: 2.85 }, { step: 4, cost: 6200000, bonusSatisfaction: 235, bonusIncomeRate: 3.0 }, { step: 5, cost: 10000000, bonusSatisfaction: 275, bonusIncomeRate: 4.2 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 275, bonusIncomeRate: 4.2 }, { step: 1, cost: 11000000000, bonusSatisfaction: 285, bonusIncomeRate: 4.4 }, { step: 2, cost: 15000000000, bonusSatisfaction: 295, bonusIncomeRate: 4.6 }, { step: 3, cost: 22000000000, bonusSatisfaction: 307, bonusIncomeRate: 4.85 }, { step: 4, cost: 35000000000, bonusSatisfaction: 320, bonusIncomeRate: 5.1 }, { step: 5, cost: 65000000000, bonusSatisfaction: 365, bonusIncomeRate: 6.8 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 365, bonusIncomeRate: 6.8 }, { step: 1, cost: 85000000000, bonusSatisfaction: 380, bonusIncomeRate: 7.1 }, { step: 2, cost: 120000000000, bonusSatisfaction: 395, bonusIncomeRate: 7.4 }, { step: 3, cost: 170000000000, bonusSatisfaction: 412, bonusIncomeRate: 7.75 }, { step: 4, cost: 260000000000, bonusSatisfaction: 430, bonusIncomeRate: 8.1 }, { step: 5, cost: 500000000000, bonusSatisfaction: 485, bonusIncomeRate: 10.8 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 485, bonusIncomeRate: 10.8 }, { step: 1, cost: 650000000000, bonusSatisfaction: 505, bonusIncomeRate: 11.3 }, { step: 2, cost: 950000000000, bonusSatisfaction: 525, bonusIncomeRate: 11.8 }, { step: 3, cost: 1400000000000, bonusSatisfaction: 547, bonusIncomeRate: 12.4 }, { step: 4, cost: 2000000000000, bonusSatisfaction: 571, bonusIncomeRate: 13.1 }, { step: 5, cost: 4000000000000, bonusSatisfaction: 635, bonusIncomeRate: 16.8 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 635, bonusIncomeRate: 16.8 }, { step: 1, cost: 5500000000000, bonusSatisfaction: 660, bonusIncomeRate: 17.5 }, { step: 2, cost: 8500000000000, bonusSatisfaction: 685, bonusIncomeRate: 18.2 }, { step: 3, cost: 13000000000000, bonusSatisfaction: 713, bonusIncomeRate: 19.0 }, { step: 4, cost: 20000000000000, bonusSatisfaction: 743, bonusIncomeRate: 19.9 }, { step: 5, cost: 38000000000000, bonusSatisfaction: 890, bonusIncomeRate: 25.8 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 890, bonusIncomeRate: 25.8 }] }
        ]
    }
};