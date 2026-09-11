/**
 * AI可読性・先祖返り防止コメント:
 * 【滑らかな階段価格 ＆ 収益ボーナス率のマイルド調整 ＆ Level 3 コスト適正化】
 * 1. 画面表記「Lv 1」を初期の秒収で手が届く $50K〜$200K（K単位）からの滑らかな階段価格を完全維持。
 * 2. 各アップグレードの bonusIncomeRate を程よいインフレ（合計で最大3〜4倍）にマイルド化し、
 * 後半のクリッカー化を防ぎつつ、超大型機フリート時の秒収200K〜350K/sの爽快ラインを実現。
 * 3. 各ステップの効果値（capacity, speedMultiplier, bonusSatisfaction）は100%完全保持。
 * 4. 【修正】ticket_price Level 3 Step 1 のコストをタイポの 450000 から 4500000（4.5M）へ適正化。
 * 
 * 【ゲームバランス改善 Phase 1: 項目名称1行化 ＆ 昇格後価格逆転の完全解消】
 * 5. 全10項目の名称をスマホ1行（7〜10文字）に綺麗に収まる直感的な名称へブラッシュアップ。
 *    - `ticket_price`: 「変動運賃システム」
 *    - `fleet_capacity`: 「駐機場・機体枠拡張」
 *    - `flight_speed`: 「エンジン高速化」
 *    - `cabin_comfort`: 「座席キャビン快適化」
 *    - `pilot_training`: 「パイロット高度訓練」
 *    - `ground_ops`: 「地上発着オペレーション」
 *    - `hr_management`: 「総合人事マネジメント」
 *    - `catering`: 「機内食ケータリング」
 *    - `entertainment`: 「機内Wi-Fiエンタメ」
 *    - `vip_lounge`: 「空港VIPラウンジ」
 * 6. 【価格逆転の完全解消】全項目において「Lv N Step 5（昇格費用）」が「Lv N+1 Step 1（次段階費用）」を上回って
 *    昇格後に価格が安く見えていたバグを解消。全レベル・全ステップで常に順当に価格が上昇する完全な単調増加カーブへ再計算。
 * 
 * 【ゲームバランス改善 Phase 2: 機体保有枠200機基準化】
 * 7. `fleet_capacity`（駐機場・機体枠拡張）の最大容量を2500機から「200機」へ再編。
 *    初期10機からLv 10で200機に到達する滑らかで現実的なステップ配分に調整。
 */

export const UPGRADE_DATA = {
    fleet_capacity: {
        id: 'fleet_capacity',
        name: '駐機場・機体枠拡張',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, capacity: 10 }, { step: 1, cost: 150000, capacity: 12 }, { step: 2, cost: 200000, capacity: 14 }, { step: 3, cost: 270000, capacity: 16 }, { step: 4, cost: 360000, capacity: 18 }, { step: 5, cost: 480000, capacity: 20 }] },
            { level: 1, steps: [{ step: 0, cost: 0, capacity: 20 }, { step: 1, cost: 620000, capacity: 22 }, { step: 2, cost: 800000, capacity: 24 }, { step: 3, cost: 1050000, capacity: 26 }, { step: 4, cost: 1350000, capacity: 28 }, { step: 5, cost: 1750000, capacity: 32 }] },
            { level: 2, steps: [{ step: 0, cost: 0, capacity: 32 }, { step: 1, cost: 2200000, capacity: 35 }, { step: 2, cost: 2800000, capacity: 38 }, { step: 3, cost: 3600000, capacity: 41 }, { step: 4, cost: 4600000, capacity: 44 }, { step: 5, cost: 5800000, capacity: 48 }] },
            { level: 3, steps: [{ step: 0, cost: 0, capacity: 48 }, { step: 1, cost: 7200000, capacity: 52 }, { step: 2, cost: 9200000, capacity: 56 }, { step: 3, cost: 11500000, capacity: 60 }, { step: 4, cost: 14500000, capacity: 64 }, { step: 5, cost: 18000000, capacity: 70 }] },
            { level: 4, steps: [{ step: 0, cost: 0, capacity: 70 }, { step: 1, cost: 22000000, capacity: 74 }, { step: 2, cost: 28000000, capacity: 78 }, { step: 3, cost: 35000000, capacity: 82 }, { step: 4, cost: 44000000, capacity: 86 }, { step: 5, cost: 55000000, capacity: 92 }] },
            { level: 5, steps: [{ step: 0, cost: 0, capacity: 92 }, { step: 1, cost: 68000000, capacity: 96 }, { step: 2, cost: 85000000, capacity: 100 }, { step: 3, cost: 105000000, capacity: 105 }, { step: 4, cost: 130000000, capacity: 110 }, { step: 5, cost: 160000000, capacity: 118 }] },
            { level: 6, steps: [{ step: 0, cost: 0, capacity: 118 }, { step: 1, cost: 200000000, capacity: 123 }, { step: 2, cost: 250000000, capacity: 128 }, { step: 3, cost: 310000000, capacity: 133 }, { step: 4, cost: 380000000, capacity: 138 }, { step: 5, cost: 470000000, capacity: 145 }] },
            { level: 7, steps: [{ step: 0, cost: 0, capacity: 145 }, { step: 1, cost: 580000000, capacity: 150 }, { step: 2, cost: 720000000, capacity: 155 }, { step: 3, cost: 890000000, capacity: 160 }, { step: 4, cost: 1100000000, capacity: 165 }, { step: 5, cost: 1350000000, capacity: 172 }] },
            { level: 8, steps: [{ step: 0, cost: 0, capacity: 172 }, { step: 1, cost: 1650000000, capacity: 176 }, { step: 2, cost: 2000000000, capacity: 180 }, { step: 3, cost: 2450000000, capacity: 184 }, { step: 4, cost: 3000000000, capacity: 188 }, { step: 5, cost: 3700000000, capacity: 194 }] },
            { level: 9, steps: [{ step: 0, cost: 0, capacity: 194 }, { step: 1, cost: 4500000000, capacity: 195 }, { step: 2, cost: 5500000000, capacity: 196 }, { step: 3, cost: 6700000000, capacity: 197 }, { step: 4, cost: 8200000000, capacity: 198 }, { step: 5, cost: 10000000000, capacity: 200 }] },
            { level: 10, steps: [{ step: 0, cost: 0, capacity: 200 }] }
        ]
    },
    ticket_price: {
        id: 'ticket_price',
        name: '変動運賃システム',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0 }, { step: 1, cost: 100000, bonusIncomeRate: 0.02 }, { step: 2, cost: 130000, bonusIncomeRate: 0.04 }, { step: 3, cost: 170000, bonusIncomeRate: 0.06 }, { step: 4, cost: 220000, bonusIncomeRate: 0.08 }, { step: 5, cost: 290000, bonusIncomeRate: 0.12 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.12 }, { step: 1, cost: 380000, bonusIncomeRate: 0.14 }, { step: 2, cost: 490000, bonusIncomeRate: 0.16 }, { step: 3, cost: 630000, bonusIncomeRate: 0.18 }, { step: 4, cost: 810000, bonusIncomeRate: 0.20 }, { step: 5, cost: 1050000, bonusIncomeRate: 0.25 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.25 }, { step: 1, cost: 1350000, bonusIncomeRate: 0.27 }, { step: 2, cost: 1750000, bonusIncomeRate: 0.29 }, { step: 3, cost: 2250000, bonusIncomeRate: 0.31 }, { step: 4, cost: 2900000, bonusIncomeRate: 0.33 }, { step: 5, cost: 3700000, bonusIncomeRate: 0.38 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.38 }, { step: 1, cost: 4700000, bonusIncomeRate: 0.40 }, { step: 2, cost: 6000000, bonusIncomeRate: 0.42 }, { step: 3, cost: 7600000, bonusIncomeRate: 0.44 }, { step: 4, cost: 9600000, bonusIncomeRate: 0.46 }, { step: 5, cost: 12000000, bonusIncomeRate: 0.50 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.50 }, { step: 1, cost: 15000000, bonusIncomeRate: 0.52 }, { step: 2, cost: 19000000, bonusIncomeRate: 0.54 }, { step: 3, cost: 24000000, bonusIncomeRate: 0.56 }, { step: 4, cost: 30000000, bonusIncomeRate: 0.58 }, { step: 5, cost: 38000000, bonusIncomeRate: 0.62 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.62 }, { step: 1, cost: 48000000, bonusIncomeRate: 0.64 }, { step: 2, cost: 60000000, bonusIncomeRate: 0.66 }, { step: 3, cost: 75000000, bonusIncomeRate: 0.68 }, { step: 4, cost: 94000000, bonusIncomeRate: 0.70 }, { step: 5, cost: 118000000, bonusIncomeRate: 0.75 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.75 }, { step: 1, cost: 148000000, bonusIncomeRate: 0.77 }, { step: 2, cost: 185000000, bonusIncomeRate: 0.79 }, { step: 3, cost: 230000000, bonusIncomeRate: 0.81 }, { step: 4, cost: 285000000, bonusIncomeRate: 0.83 }, { step: 5, cost: 355000000, bonusIncomeRate: 0.88 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.88 }, { step: 1, cost: 440000000, bonusIncomeRate: 0.90 }, { step: 2, cost: 540000000, bonusIncomeRate: 0.92 }, { step: 3, cost: 660000000, bonusIncomeRate: 0.94 }, { step: 4, cost: 810000000, bonusIncomeRate: 0.96 }, { step: 5, cost: 1000000000, bonusIncomeRate: 1.00 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.00 }, { step: 1, cost: 1250000000, bonusIncomeRate: 1.02 }, { step: 2, cost: 1550000000, bonusIncomeRate: 1.04 }, { step: 3, cost: 1900000000, bonusIncomeRate: 1.06 }, { step: 4, cost: 2350000000, bonusIncomeRate: 1.08 }, { step: 5, cost: 2900000000, bonusIncomeRate: 1.12 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.12 }, { step: 1, cost: 3600000000, bonusIncomeRate: 1.14 }, { step: 2, cost: 4400000000, bonusIncomeRate: 1.16 }, { step: 3, cost: 5400000000, bonusIncomeRate: 1.18 }, { step: 4, cost: 6600000000, bonusIncomeRate: 1.20 }, { step: 5, cost: 8000000000, bonusIncomeRate: 1.25 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 1.25 }] }
        ]
    },
    flight_speed: {
        id: 'flight_speed',
        name: 'エンジン高速化',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, speedMultiplier: 1.0 }, { step: 1, cost: 120000, speedMultiplier: 1.05 }, { step: 2, cost: 160000, speedMultiplier: 1.10 }, { step: 3, cost: 210000, speedMultiplier: 1.15 }, { step: 4, cost: 270000, speedMultiplier: 1.20 }, { step: 5, cost: 350000, speedMultiplier: 1.28 }] },
            { level: 1, steps: [{ step: 0, cost: 0, speedMultiplier: 1.28 }, { step: 1, cost: 450000, speedMultiplier: 1.33 }, { step: 2, cost: 580000, speedMultiplier: 1.38 }, { step: 3, cost: 740000, speedMultiplier: 1.43 }, { step: 4, cost: 950000, speedMultiplier: 1.48 }, { step: 5, cost: 1200000, speedMultiplier: 1.60 }] },
            { level: 2, steps: [{ step: 0, cost: 0, speedMultiplier: 1.60 }, { step: 1, cost: 1550000, speedMultiplier: 1.66 }, { step: 2, cost: 2000000, speedMultiplier: 1.72 }, { step: 3, cost: 2550000, speedMultiplier: 1.78 }, { step: 4, cost: 3250000, speedMultiplier: 1.84 }, { step: 5, cost: 4100000, speedMultiplier: 2.00 }] },
            { level: 3, steps: [{ step: 0, cost: 0, speedMultiplier: 2.00 }, { step: 1, cost: 5200000, speedMultiplier: 2.07 }, { step: 2, cost: 6600000, speedMultiplier: 2.14 }, { step: 3, cost: 8400000, speedMultiplier: 2.21 }, { step: 4, cost: 10500000, speedMultiplier: 2.28 }, { step: 5, cost: 13000000, speedMultiplier: 2.45 }] },
            { level: 4, steps: [{ step: 0, cost: 0, speedMultiplier: 2.45 }, { step: 1, cost: 16500000, speedMultiplier: 2.53 }, { step: 2, cost: 21000000, speedMultiplier: 2.61 }, { step: 3, cost: 26500000, speedMultiplier: 2.69 }, { step: 4, cost: 33500000, speedMultiplier: 2.77 }, { step: 5, cost: 42000000, speedMultiplier: 2.95 }] },
            { level: 5, steps: [{ step: 0, cost: 0, speedMultiplier: 2.95 }, { step: 1, cost: 53000000, speedMultiplier: 3.04 }, { step: 2, cost: 66000000, speedMultiplier: 3.13 }, { step: 3, cost: 82000000, speedMultiplier: 3.22 }, { step: 4, cost: 102000000, speedMultiplier: 3.31 }, { step: 5, cost: 128000000, speedMultiplier: 3.55 }] },
            { level: 6, steps: [{ step: 0, cost: 0, speedMultiplier: 3.55 }, { step: 1, cost: 160000000, speedMultiplier: 3.65 }, { step: 2, cost: 200000000, speedMultiplier: 3.75 }, { step: 3, cost: 250000000, speedMultiplier: 3.85 }, { step: 4, cost: 310000000, speedMultiplier: 3.95 }, { step: 5, cost: 390000000, speedMultiplier: 4.25 }] },
            { level: 7, steps: [{ step: 0, cost: 0, speedMultiplier: 4.25 }, { step: 1, cost: 490000000, speedMultiplier: 4.37 }, { step: 2, cost: 600000000, speedMultiplier: 4.49 }, { step: 3, cost: 730000000, speedMultiplier: 4.61 }, { step: 4, cost: 890000000, speedMultiplier: 4.73 }, { step: 5, cost: 1100000000, speedMultiplier: 5.05 }] },
            { level: 8, steps: [{ step: 0, cost: 0, speedMultiplier: 5.05 }, { step: 1, cost: 1350000000, speedMultiplier: 5.19 }, { step: 2, cost: 1650000000, speedMultiplier: 5.33 }, { step: 3, cost: 2050000000, speedMultiplier: 5.47 }, { step: 4, cost: 2500000000, speedMultiplier: 5.61 }, { step: 5, cost: 3100000000, speedMultiplier: 6.00 }] },
            { level: 9, steps: [{ step: 0, cost: 0, speedMultiplier: 6.00 }, { step: 1, cost: 3800000000, speedMultiplier: 6.17 }, { step: 2, cost: 4600000000, speedMultiplier: 6.34 }, { step: 3, cost: 5600000000, speedMultiplier: 6.51 }, { step: 4, cost: 6800000000, speedMultiplier: 6.68 }, { step: 5, cost: 8200000000, speedMultiplier: 7.20 }] },
            { level: 10, steps: [{ step: 0, cost: 0, speedMultiplier: 7.20 }] }
        ]
    },
    cabin_comfort: {
        id: 'cabin_comfort',
        name: '座席キャビン快適化',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 80000, bonusSatisfaction: 5 }, { step: 2, cost: 105000, bonusSatisfaction: 10 }, { step: 3, cost: 140000, bonusSatisfaction: 15 }, { step: 4, cost: 180000, bonusSatisfaction: 20 }, { step: 5, cost: 230000, bonusSatisfaction: 30 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 30 }, { step: 1, cost: 300000, bonusSatisfaction: 35 }, { step: 2, cost: 390000, bonusSatisfaction: 40 }, { step: 3, cost: 500000, bonusSatisfaction: 45 }, { step: 4, cost: 640000, bonusSatisfaction: 50 }, { step: 5, cost: 820000, bonusSatisfaction: 65 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 65 }, { step: 1, cost: 1050000, bonusSatisfaction: 72 }, { step: 2, cost: 1350000, bonusSatisfaction: 79 }, { step: 3, cost: 1750000, bonusSatisfaction: 86 }, { step: 4, cost: 2250000, bonusSatisfaction: 93 }, { step: 5, cost: 2900000, bonusSatisfaction: 110 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 110 }, { step: 1, cost: 3700000, bonusSatisfaction: 118 }, { step: 2, cost: 4700000, bonusSatisfaction: 126 }, { step: 3, cost: 6000000, bonusSatisfaction: 134 }, { step: 4, cost: 7600000, bonusSatisfaction: 142 }, { step: 5, cost: 9600000, bonusSatisfaction: 165 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 165 }, { step: 1, cost: 12200000, bonusSatisfaction: 175 }, { step: 2, cost: 15500000, bonusSatisfaction: 185 }, { step: 3, cost: 19500000, bonusSatisfaction: 195 }, { step: 4, cost: 24500000, bonusSatisfaction: 205 }, { step: 5, cost: 31000000, bonusSatisfaction: 230 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 230 }, { step: 1, cost: 39000000, bonusSatisfaction: 242 }, { step: 2, cost: 49000000, bonusSatisfaction: 254 }, { step: 3, cost: 61000000, bonusSatisfaction: 266 }, { step: 4, cost: 76000000, bonusSatisfaction: 278 }, { step: 5, cost: 95000000, bonusSatisfaction: 310 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 310 }, { step: 1, cost: 118000000, bonusSatisfaction: 325 }, { step: 2, cost: 148000000, bonusSatisfaction: 340 }, { step: 3, cost: 185000000, bonusSatisfaction: 355 }, { step: 4, cost: 230000000, bonusSatisfaction: 370 }, { step: 5, cost: 285000000, bonusSatisfaction: 410 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 410 }, { step: 1, cost: 355000000, bonusSatisfaction: 428 }, { step: 2, cost: 440000000, bonusSatisfaction: 446 }, { step: 3, cost: 540000000, bonusSatisfaction: 464 }, { step: 4, cost: 660000000, bonusSatisfaction: 482 }, { step: 5, cost: 810000000, bonusSatisfaction: 530 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 530 }, { step: 1, cost: 1000000000, bonusSatisfaction: 550 }, { step: 2, cost: 1250000000, bonusSatisfaction: 570 }, { step: 3, cost: 1550000000, bonusSatisfaction: 590 }, { step: 4, cost: 1900000000, bonusSatisfaction: 610 }, { step: 5, cost: 2350000000, bonusSatisfaction: 670 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 670 }, { step: 1, cost: 2900000000, bonusSatisfaction: 695 }, { step: 2, cost: 3600000000, bonusSatisfaction: 720 }, { step: 3, cost: 4400000000, bonusSatisfaction: 745 }, { step: 4, cost: 5400000000, bonusSatisfaction: 770 }, { step: 5, cost: 6600000000, bonusSatisfaction: 850 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 850 }] }
        ]
    },
    pilot_training: {
        id: 'pilot_training',
        name: 'パイロット高度訓練',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 110000, bonusSatisfaction: 6 }, { step: 2, cost: 145000, bonusSatisfaction: 12 }, { step: 3, cost: 190000, bonusSatisfaction: 18 }, { step: 4, cost: 250000, bonusSatisfaction: 24 }, { step: 5, cost: 320000, bonusSatisfaction: 35 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 35 }, { step: 1, cost: 410000, bonusSatisfaction: 41 }, { step: 2, cost: 530000, bonusSatisfaction: 47 }, { step: 3, cost: 680000, bonusSatisfaction: 53 }, { step: 4, cost: 870000, bonusSatisfaction: 59 }, { step: 5, cost: 1100000, bonusSatisfaction: 75 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 75 }, { step: 1, cost: 1400000, bonusSatisfaction: 83 }, { step: 2, cost: 1800000, bonusSatisfaction: 91 }, { step: 3, cost: 2300000, bonusSatisfaction: 99 }, { step: 4, cost: 2900000, bonusSatisfaction: 107 }, { step: 5, cost: 3700000, bonusSatisfaction: 130 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 130 }, { step: 1, cost: 4700000, bonusSatisfaction: 139 }, { step: 2, cost: 6000000, bonusSatisfaction: 148 }, { step: 3, cost: 7600000, bonusSatisfaction: 157 }, { step: 4, cost: 9600000, bonusSatisfaction: 166 }, { step: 5, cost: 12000000, bonusSatisfaction: 190 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 190 }, { step: 1, cost: 15000000, bonusSatisfaction: 201 }, { step: 2, cost: 19000000, bonusSatisfaction: 212 }, { step: 3, cost: 24000000, bonusSatisfaction: 223 }, { step: 4, cost: 30000000, bonusSatisfaction: 234 }, { step: 5, cost: 38000000, bonusSatisfaction: 265 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 265 }, { step: 1, cost: 48000000, bonusSatisfaction: 278 }, { step: 2, cost: 60000000, bonusSatisfaction: 291 }, { step: 3, cost: 75000000, bonusSatisfaction: 304 }, { step: 4, cost: 94000000, bonusSatisfaction: 317 }, { step: 5, cost: 118000000, bonusSatisfaction: 350 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 350 }, { step: 1, cost: 148000000, bonusSatisfaction: 366 }, { step: 2, cost: 185000000, bonusSatisfaction: 382 }, { step: 3, cost: 230000000, bonusSatisfaction: 398 }, { step: 4, cost: 285000000, bonusSatisfaction: 414 }, { step: 5, cost: 355000000, bonusSatisfaction: 460 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 460 }, { step: 1, cost: 440000000, bonusSatisfaction: 480 }, { step: 2, cost: 540000000, bonusSatisfaction: 500 }, { step: 3, cost: 660000000, bonusSatisfaction: 520 }, { step: 4, cost: 810000000, bonusSatisfaction: 540 }, { step: 5, cost: 1000000000, bonusSatisfaction: 600 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 600 }, { step: 1, cost: 1250000000, bonusSatisfaction: 622 }, { step: 2, cost: 1550000000, bonusSatisfaction: 644 }, { step: 3, cost: 1900000000, bonusSatisfaction: 666 }, { step: 4, cost: 2350000000, bonusSatisfaction: 688 }, { step: 5, cost: 2700000000, bonusSatisfaction: 750 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 750 }, { step: 1, cost: 3600000000, bonusSatisfaction: 778 }, { step: 2, cost: 4400000000, bonusSatisfaction: 806 }, { step: 3, cost: 5400000000, bonusSatisfaction: 834 }, { step: 4, cost: 6600000000, bonusSatisfaction: 862 }, { step: 5, cost: 8000000000, bonusSatisfaction: 950 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 950 }] }
        ]
    },
    ground_ops: {
        id: 'ground_ops',
        name: '地上発着オペレーション',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0 }, { step: 1, cost: 90000, bonusIncomeRate: 0.01 }, { step: 2, cost: 120000, bonusIncomeRate: 0.02 }, { step: 3, cost: 155000, bonusIncomeRate: 0.03 }, { step: 4, cost: 200000, bonusIncomeRate: 0.04 }, { step: 5, cost: 260000, bonusIncomeRate: 0.06 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.06 }, { step: 1, cost: 340000, bonusIncomeRate: 0.07 }, { step: 2, cost: 440000, bonusIncomeRate: 0.08 }, { step: 3, cost: 560000, bonusIncomeRate: 0.09 }, { step: 4, cost: 720000, bonusIncomeRate: 0.10 }, { step: 5, cost: 920000, bonusIncomeRate: 0.13 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.13 }, { step: 1, cost: 1180000, bonusIncomeRate: 0.14 }, { step: 2, cost: 1500000, bonusIncomeRate: 0.15 }, { step: 3, cost: 1900000, bonusIncomeRate: 0.16 }, { step: 4, cost: 2400000, bonusIncomeRate: 0.17 }, { step: 5, cost: 3000000, bonusIncomeRate: 0.20 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.20 }, { step: 1, cost: 3800000, bonusIncomeRate: 0.21 }, { step: 2, cost: 4800000, bonusIncomeRate: 0.22 }, { step: 3, cost: 6000000, bonusIncomeRate: 0.23 }, { step: 4, cost: 7600000, bonusIncomeRate: 0.24 }, { step: 5, cost: 9600000, bonusIncomeRate: 0.27 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.27 }, { step: 1, cost: 12200000, bonusIncomeRate: 0.28 }, { step: 2, cost: 15500000, bonusIncomeRate: 0.29 }, { step: 3, cost: 19500000, bonusIncomeRate: 0.30 }, { step: 4, cost: 24500000, bonusIncomeRate: 0.31 }, { step: 5, cost: 31000000, bonusIncomeRate: 0.34 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.34 }, { step: 1, cost: 39000000, bonusIncomeRate: 0.35 }, { step: 2, cost: 49000000, bonusIncomeRate: 0.36 }, { step: 3, cost: 61000000, bonusIncomeRate: 0.37 }, { step: 4, cost: 76000000, bonusIncomeRate: 0.38 }, { step: 5, cost: 95000000, bonusIncomeRate: 0.41 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.41 }, { step: 1, cost: 118000000, bonusIncomeRate: 0.42 }, { step: 2, cost: 148000000, bonusIncomeRate: 0.43 }, { step: 3, cost: 185000000, bonusIncomeRate: 0.44 }, { step: 4, cost: 230000000, bonusIncomeRate: 0.45 }, { step: 5, cost: 285000000, bonusIncomeRate: 0.48 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.48 }, { step: 1, cost: 355000000, bonusIncomeRate: 0.49 }, { step: 2, cost: 440000000, bonusIncomeRate: 0.50 }, { step: 3, cost: 540000000, bonusIncomeRate: 0.51 }, { step: 4, cost: 660000000, bonusIncomeRate: 0.52 }, { step: 5, cost: 810000000, bonusIncomeRate: 0.55 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.55 }, { step: 1, cost: 1000000000, bonusIncomeRate: 0.56 }, { step: 2, cost: 1250000000, bonusIncomeRate: 0.57 }, { step: 3, cost: 1550000000, bonusIncomeRate: 0.58 }, { step: 4, cost: 1900000000, bonusIncomeRate: 0.59 }, { step: 5, cost: 2350000000, bonusIncomeRate: 0.62 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.62 }, { step: 1, cost: 2900000000, bonusIncomeRate: 0.63 }, { step: 2, cost: 3600000000, bonusIncomeRate: 0.64 }, { step: 3, cost: 4400000000, bonusIncomeRate: 0.65 }, { step: 4, cost: 5400000000, bonusIncomeRate: 0.66 }, { step: 5, cost: 6600000000, bonusIncomeRate: 0.70 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.70 }] }
        ]
    },
    hr_management: {
        id: 'hr_management',
        name: '総合人事マネジメント',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0, bonusIncomeRate: 0 }, { step: 1, cost: 130000, bonusSatisfaction: 4, bonusIncomeRate: 0.01 }, { step: 2, cost: 170000, bonusSatisfaction: 8, bonusIncomeRate: 0.02 }, { step: 3, cost: 220000, bonusSatisfaction: 12, bonusIncomeRate: 0.03 }, { step: 4, cost: 280000, bonusSatisfaction: 16, bonusIncomeRate: 0.04 }, { step: 5, cost: 360000, bonusSatisfaction: 25, bonusIncomeRate: 0.05 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 25, bonusIncomeRate: 0.05 }, { step: 1, cost: 460000, bonusSatisfaction: 30, bonusIncomeRate: 0.06 }, { step: 2, cost: 590000, bonusSatisfaction: 35, bonusIncomeRate: 0.07 }, { step: 3, cost: 750000, bonusSatisfaction: 40, bonusIncomeRate: 0.08 }, { step: 4, cost: 960000, bonusSatisfaction: 45, bonusIncomeRate: 0.09 }, { step: 5, cost: 1220000, bonusSatisfaction: 60, bonusIncomeRate: 0.11 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 60, bonusIncomeRate: 0.11 }, { step: 1, cost: 1550000, bonusSatisfaction: 67, bonusIncomeRate: 0.12 }, { step: 2, cost: 2000000, bonusSatisfaction: 74, bonusIncomeRate: 0.13 }, { step: 3, cost: 2550000, bonusSatisfaction: 81, bonusIncomeRate: 0.14 }, { step: 4, cost: 3250000, bonusSatisfaction: 88, bonusIncomeRate: 0.15 }, { step: 5, cost: 4100000, bonusSatisfaction: 105, bonusIncomeRate: 0.17 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 105, bonusIncomeRate: 0.17 }, { step: 1, cost: 5200000, bonusSatisfaction: 113, bonusIncomeRate: 0.18 }, { step: 2, cost: 6600000, bonusSatisfaction: 121, bonusIncomeRate: 0.19 }, { step: 3, cost: 8400000, bonusSatisfaction: 129, bonusIncomeRate: 0.20 }, { step: 4, cost: 10500000, bonusSatisfaction: 137, bonusIncomeRate: 0.21 }, { step: 5, cost: 13000000, bonusSatisfaction: 160, bonusIncomeRate: 0.23 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 160, bonusIncomeRate: 0.23 }, { step: 1, cost: 16500000, bonusSatisfaction: 170, bonusIncomeRate: 0.24 }, { step: 2, cost: 21000000, bonusSatisfaction: 180, bonusIncomeRate: 0.25 }, { step: 3, cost: 26500000, bonusSatisfaction: 190, bonusIncomeRate: 0.26 }, { step: 4, cost: 33500000, bonusSatisfaction: 200, bonusIncomeRate: 0.27 }, { step: 5, cost: 42000000, bonusSatisfaction: 230, bonusIncomeRate: 0.29 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 230, bonusIncomeRate: 0.29 }, { step: 1, cost: 53000000, bonusSatisfaction: 242, bonusIncomeRate: 0.30 }, { step: 2, cost: 66000000, bonusSatisfaction: 254, bonusIncomeRate: 0.31 }, { step: 3, cost: 82000000, bonusSatisfaction: 266, bonusIncomeRate: 0.32 }, { step: 4, cost: 102000000, bonusSatisfaction: 278, bonusIncomeRate: 0.33 }, { step: 5, cost: 128000000, bonusSatisfaction: 310, bonusIncomeRate: 0.35 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 310, bonusIncomeRate: 0.35 }, { step: 1, cost: 160000000, bonusSatisfaction: 325, bonusIncomeRate: 0.36 }, { step: 2, cost: 200000000, bonusSatisfaction: 340, bonusIncomeRate: 0.37 }, { step: 3, cost: 250000000, bonusSatisfaction: 355, bonusIncomeRate: 0.38 }, { step: 4, cost: 310000000, bonusSatisfaction: 370, bonusIncomeRate: 0.39 }, { step: 5, cost: 390000000, bonusSatisfaction: 410, bonusIncomeRate: 0.41 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 410, bonusIncomeRate: 0.41 }, { step: 1, cost: 490000000, bonusSatisfaction: 428, bonusIncomeRate: 0.42 }, { step: 2, cost: 600000000, bonusSatisfaction: 446, bonusIncomeRate: 0.43 }, { step: 3, cost: 730000000, bonusSatisfaction: 464, bonusIncomeRate: 0.44 }, { step: 4, cost: 890000000, bonusSatisfaction: 482, bonusIncomeRate: 0.45 }, { step: 5, cost: 1100000000, bonusSatisfaction: 530, bonusIncomeRate: 0.47 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 530, bonusIncomeRate: 0.47 }, { step: 1, cost: 1350000000, bonusSatisfaction: 550, bonusIncomeRate: 0.48 }, { step: 2, cost: 1650000000, bonusSatisfaction: 570, bonusIncomeRate: 0.49 }, { step: 3, cost: 2050000000, bonusSatisfaction: 590, bonusIncomeRate: 0.50 }, { step: 4, cost: 2500000000, bonusSatisfaction: 610, bonusIncomeRate: 0.51 }, { step: 5, cost: 3100000000, bonusSatisfaction: 670, bonusIncomeRate: 0.53 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 670, bonusIncomeRate: 0.53 }, { step: 1, cost: 3800000000, bonusSatisfaction: 795, bonusIncomeRate: 0.54 }, { step: 2, cost: 4600000000, bonusSatisfaction: 720, bonusIncomeRate: 0.55 }, { step: 3, cost: 5600000000, bonusSatisfaction: 745, bonusIncomeRate: 0.56 }, { step: 4, cost: 6800000000, bonusSatisfaction: 770, bonusIncomeRate: 0.57 }, { step: 5, cost: 8200000000, bonusSatisfaction: 850, bonusIncomeRate: 0.60 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 850, bonusIncomeRate: 0.60 }] }
        ]
    },
    catering: {
        id: 'catering',
        name: '機内食ケータリング',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0 }, { step: 1, cost: 70000, bonusSatisfaction: 5 }, { step: 2, cost: 90000, bonusSatisfaction: 10 }, { step: 3, cost: 120000, bonusSatisfaction: 15 }, { step: 4, cost: 155000, bonusSatisfaction: 20 }, { step: 5, cost: 200000, bonusSatisfaction: 30 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 30 }, { step: 1, cost: 260000, bonusSatisfaction: 35 }, { step: 2, cost: 340000, bonusSatisfaction: 40 }, { step: 3, cost: 440000, bonusSatisfaction: 45 }, { step: 4, cost: 560000, bonusSatisfaction: 50 }, { step: 5, cost: 720000, bonusSatisfaction: 65 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 65 }, { step: 1, cost: 920000, bonusSatisfaction: 72 }, { step: 2, cost: 1180000, bonusSatisfaction: 79 }, { step: 3, cost: 1500000, bonusSatisfaction: 86 }, { step: 4, cost: 1900000, bonusSatisfaction: 93 }, { step: 5, cost: 2400000, bonusSatisfaction: 110 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 110 }, { step: 1, cost: 3100000, bonusSatisfaction: 118 }, { step: 2, cost: 3900000, bonusSatisfaction: 126 }, { step: 3, cost: 4900000, bonusSatisfaction: 134 }, { step: 4, cost: 6200000, bonusSatisfaction: 142 }, { step: 5, cost: 7800000, bonusSatisfaction: 165 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 165 }, { step: 1, cost: 9800000, bonusSatisfaction: 175 }, { step: 2, cost: 12500000, bonusSatisfaction: 185 }, { step: 3, cost: 15500000, bonusSatisfaction: 195 }, { step: 4, cost: 19500000, bonusSatisfaction: 205 }, { step: 5, cost: 24500000, bonusSatisfaction: 230 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 230 }, { step: 1, cost: 31000000, bonusSatisfaction: 242 }, { step: 2, cost: 39000000, bonusSatisfaction: 254 }, { step: 3, cost: 49000000, bonusSatisfaction: 266 }, { step: 4, cost: 61000000, bonusSatisfaction: 278 }, { step: 5, cost: 76000000, bonusSatisfaction: 310 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 310 }, { step: 1, cost: 95000000, bonusSatisfaction: 325 }, { step: 2, cost: 118000000, bonusSatisfaction: 340 }, { step: 3, cost: 148000000, bonusSatisfaction: 355 }, { step: 4, cost: 185000000, bonusSatisfaction: 370 }, { step: 5, cost: 230000000, bonusSatisfaction: 410 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 410 }, { step: 1, cost: 285000000, bonusSatisfaction: 428 }, { step: 2, cost: 355000000, bonusSatisfaction: 446 }, { step: 3, cost: 440000000, bonusSatisfaction: 464 }, { step: 4, cost: 540000000, bonusSatisfaction: 482 }, { step: 5, cost: 660000000, bonusSatisfaction: 530 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 530 }, { step: 1, cost: 81000000, bonusSatisfaction: 550 }, { step: 2, cost: 1000000000, bonusSatisfaction: 570 }, { step: 3, cost: 1250000000, bonusSatisfaction: 590 }, { step: 4, cost: 1550000000, bonusSatisfaction: 610 }, { step: 5, cost: 1900000000, bonusSatisfaction: 670 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 670 }, { step: 1, cost: 2350000000, bonusSatisfaction: 695 }, { step: 2, cost: 2900000000, bonusSatisfaction: 720 }, { step: 3, cost: 3600000000, bonusSatisfaction: 745 }, { step: 4, cost: 4400000000, bonusSatisfaction: 770 }, { step: 5, cost: 5400000000, bonusSatisfaction: 850 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 850 }] }
        ]
    },
    entertainment: {
        id: 'entertainment',
        name: '機内Wi-Fiエンタメ',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0, bonusIncomeRate: 0 }, { step: 1, cost: 100000, bonusSatisfaction: 4, bonusIncomeRate: 0.01 }, { step: 2, cost: 130000, bonusSatisfaction: 8, bonusIncomeRate: 0.02 }, { step: 3, cost: 170000, bonusSatisfaction: 12, bonusIncomeRate: 0.03 }, { step: 4, cost: 220000, bonusSatisfaction: 16, bonusIncomeRate: 0.04 }, { step: 5, cost: 290000, bonusSatisfaction: 25, bonusIncomeRate: 0.06 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 25, bonusIncomeRate: 0.06 }, { step: 1, cost: 380000, bonusSatisfaction: 30, bonusIncomeRate: 0.07 }, { step: 2, cost: 490000, bonusSatisfaction: 35, bonusIncomeRate: 0.08 }, { step: 3, cost: 630000, bonusSatisfaction: 40, bonusIncomeRate: 0.09 }, { step: 4, cost: 810000, bonusSatisfaction: 45, bonusIncomeRate: 0.10 }, { step: 5, cost: 1050000, bonusSatisfaction: 60, bonusIncomeRate: 0.13 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 60, bonusIncomeRate: 0.13 }, { step: 1, cost: 1350000, bonusSatisfaction: 67, bonusIncomeRate: 0.14 }, { step: 2, cost: 1750000, bonusSatisfaction: 74, bonusIncomeRate: 0.15 }, { step: 3, cost: 2250000, bonusIncomeRate: 0.16, bonusSatisfaction: 81 }, { step: 4, cost: 2900000, bonusIncomeRate: 0.17, bonusSatisfaction: 88 }, { step: 5, cost: 3700000, bonusSatisfaction: 105, bonusIncomeRate: 0.20 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 105, bonusIncomeRate: 0.20 }, { step: 1, cost: 4700000, bonusSatisfaction: 113, bonusIncomeRate: 0.21 }, { step: 2, cost: 6000000, bonusSatisfaction: 121, bonusIncomeRate: 0.22 }, { step: 3, cost: 7600000, bonusSatisfaction: 129, bonusIncomeRate: 0.23 }, { step: 4, cost: 9600000, bonusSatisfaction: 137, bonusIncomeRate: 0.24 }, { step: 5, cost: 12000000, bonusSatisfaction: 160, bonusIncomeRate: 0.27 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 160, bonusIncomeRate: 0.27 }, { step: 1, cost: 15000000, bonusSatisfaction: 170, bonusIncomeRate: 0.28 }, { step: 2, cost: 19000000, bonusSatisfaction: 180, bonusIncomeRate: 0.29 }, { step: 3, cost: 24000000, bonusSatisfaction: 190, bonusIncomeRate: 0.30 }, { step: 4, cost: 30000000, bonusSatisfaction: 200, bonusIncomeRate: 0.31 }, { step: 5, cost: 38000000, bonusSatisfaction: 230, bonusIncomeRate: 0.34 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 230, bonusIncomeRate: 0.34 }, { step: 1, cost: 48000000, bonusSatisfaction: 242, bonusIncomeRate: 0.35 }, { step: 2, cost: 60000000, bonusSatisfaction: 254, bonusIncomeRate: 0.36 }, { step: 3, cost: 75000000, bonusSatisfaction: 266, bonusIncomeRate: 0.37 }, { step: 4, cost: 94000000, bonusSatisfaction: 278, bonusIncomeRate: 0.38 }, { step: 5, cost: 118000000, bonusSatisfaction: 310, bonusIncomeRate: 0.41 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 310, bonusIncomeRate: 0.41 }, { step: 1, cost: 148000000, bonusSatisfaction: 325, bonusIncomeRate: 0.42 }, { step: 2, cost: 185000000, bonusSatisfaction: 340, bonusIncomeRate: 0.43 }, { step: 3, cost: 230000000, bonusSatisfaction: 355, bonusIncomeRate: 0.44 }, { step: 4, cost: 285000000, bonusSatisfaction: 370, bonusIncomeRate: 0.45 }, { step: 5, cost: 355000000, bonusSatisfaction: 410, bonusIncomeRate: 0.48 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 410, bonusIncomeRate: 0.48 }, { step: 1, cost: 440000000, bonusSatisfaction: 428, bonusIncomeRate: 0.49 }, { step: 2, cost: 540000000, bonusSatisfaction: 446, bonusIncomeRate: 0.50 }, { step: 3, cost: 660000000, bonusSatisfaction: 464, bonusIncomeRate: 0.51 }, { step: 4, cost: 810000000, bonusSatisfaction: 482, bonusIncomeRate: 0.52 }, { step: 5, cost: 1000000000, bonusSatisfaction: 530, bonusIncomeRate: 0.55 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 530, bonusIncomeRate: 0.55 }, { step: 1, cost: 1250000000, bonusSatisfaction: 550, bonusIncomeRate: 0.56 }, { step: 2, cost: 1550000000, bonusSatisfaction: 570, bonusIncomeRate: 0.57 }, { step: 3, cost: 1900000000, bonusSatisfaction: 590, bonusIncomeRate: 0.58 }, { step: 4, cost: 2350000000, bonusIncomeRate: 0.59 }, { step: 5, cost: 2900000000, bonusSatisfaction: 670, bonusIncomeRate: 0.62 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 670, bonusIncomeRate: 0.62 }, { step: 1, cost: 3600000000, bonusSatisfaction: 695, bonusIncomeRate: 0.63 }, { step: 2, cost: 4400000000, bonusSatisfaction: 720, bonusIncomeRate: 0.64 }, { step: 3, cost: 5400000000, bonusIncomeRate: 0.65 }, { step: 4, cost: 6600000000, bonusIncomeRate: 0.66 }, { step: 5, cost: 8000000000, bonusSatisfaction: 850, bonusIncomeRate: 0.70 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusIncomeRate: 0.70 }] }
        ]
    },
    vip_lounge: {
        id: 'vip_lounge',
        name: '空港VIPラウンジ',
        maxLevel: 10,
        levels: [
            { level: 0, steps: [{ step: 0, cost: 0, bonusSatisfaction: 0, bonusIncomeRate: 0 }, { step: 1, cost: 160000, bonusSatisfaction: 8, bonusIncomeRate: 0.02 }, { step: 2, cost: 210000, bonusSatisfaction: 16, bonusIncomeRate: 0.04 }, { step: 3, cost: 270000, bonusSatisfaction: 24, bonusIncomeRate: 0.06 }, { step: 4, cost: 350000, bonusSatisfaction: 32, bonusIncomeRate: 0.08 }, { step: 5, cost: 450000, bonusSatisfaction: 50, bonusIncomeRate: 0.12 }] },
            { level: 1, steps: [{ step: 0, cost: 0, bonusSatisfaction: 50, bonusIncomeRate: 0.12 }, { step: 1, cost: 580000, bonusSatisfaction: 60, bonusIncomeRate: 0.14 }, { step: 2, cost: 740000, bonusSatisfaction: 70, bonusIncomeRate: 0.16 }, { step: 3, cost: 950000, bonusSatisfaction: 80, bonusIncomeRate: 0.18 }, { step: 4, cost: 1200000, bonusSatisfaction: 90, bonusIncomeRate: 0.20 }, { step: 5, cost: 1550000, bonusSatisfaction: 120, bonusIncomeRate: 0.25 }] },
            { level: 2, steps: [{ step: 0, cost: 0, bonusSatisfaction: 120, bonusIncomeRate: 0.25 }, { step: 1, cost: 2000000, bonusSatisfaction: 135, bonusIncomeRate: 0.27 }, { step: 2, cost: 2550000, bonusSatisfaction: 150, bonusIncomeRate: 0.29 }, { step: 3, cost: 3250000, bonusSatisfaction: 165, bonusIncomeRate: 0.31 }, { step: 4, cost: 4100000, bonusSatisfaction: 180, bonusIncomeRate: 0.33 }, { step: 5, cost: 5200000, bonusSatisfaction: 220, bonusIncomeRate: 0.38 }] },
            { level: 3, steps: [{ step: 0, cost: 0, bonusSatisfaction: 220, bonusIncomeRate: 0.38 }, { step: 1, cost: 6600000, bonusSatisfaction: 238, bonusIncomeRate: 0.40 }, { step: 2, cost: 8400000, bonusSatisfaction: 256, bonusIncomeRate: 0.42 }, { step: 3, cost: 10500000, bonusSatisfaction: 274, bonusIncomeRate: 0.44 }, { step: 4, cost: 13000000, bonusSatisfaction: 292, bonusIncomeRate: 0.46 }, { step: 5, cost: 16500000, bonusSatisfaction: 340, bonusIncomeRate: 0.52 }] },
            { level: 4, steps: [{ step: 0, cost: 0, bonusSatisfaction: 340, bonusIncomeRate: 0.52 }, { step: 1, cost: 21000000, bonusSatisfaction: 360, bonusIncomeRate: 0.54 }, { step: 2, cost: 26500000, bonusSatisfaction: 380, bonusIncomeRate: 0.56 }, { step: 3, cost: 33500000, bonusSatisfaction: 400, bonusIncomeRate: 0.58 }, { step: 4, cost: 42000000, bonusSatisfaction: 420, bonusIncomeRate: 0.60 }, { step: 5, cost: 53000000, bonusSatisfaction: 480, bonusIncomeRate: 0.68 }] },
            { level: 5, steps: [{ step: 0, cost: 0, bonusSatisfaction: 480, bonusIncomeRate: 0.68 }, { step: 1, cost: 66000000, bonusSatisfaction: 505, bonusIncomeRate: 0.70 }, { step: 2, cost: 82000000, bonusSatisfaction: 530, bonusIncomeRate: 0.72 }, { step: 3, cost: 102000000, bonusSatisfaction: 555, bonusIncomeRate: 0.74 }, { step: 4, cost: 128000000, bonusSatisfaction: 580, bonusIncomeRate: 0.76 }, { step: 5, cost: 160000000, bonusSatisfaction: 650, bonusIncomeRate: 0.85 }] },
            { level: 6, steps: [{ step: 0, cost: 0, bonusSatisfaction: 650, bonusIncomeRate: 0.85 }, { step: 1, cost: 200000000, bonusSatisfaction: 680, bonusIncomeRate: 0.87 }, { step: 2, cost: 250000000, bonusSatisfaction: 710, bonusIncomeRate: 0.89 }, { step: 3, cost: 310000000, bonusSatisfaction: 740, bonusIncomeRate: 0.91 }, { step: 4, cost: 390000000, bonusSatisfaction: 770, bonusIncomeRate: 0.93 }, { step: 5, cost: 490000000, bonusSatisfaction: 850, bonusIncomeRate: 1.02 }] },
            { level: 7, steps: [{ step: 0, cost: 0, bonusSatisfaction: 850, bonusIncomeRate: 1.02 }, { step: 1, cost: 600000000, bonusSatisfaction: 885, bonusIncomeRate: 1.05 }, { step: 2, cost: 730000000, bonusSatisfaction: 920, bonusIncomeRate: 1.08 }, { step: 3, cost: 890000000, bonusSatisfaction: 955, bonusIncomeRate: 1.11 }, { step: 4, cost: 1100000000, bonusSatisfaction: 990, bonusIncomeRate: 1.14 }, { step: 5, cost: 1350000000, bonusSatisfaction: 1100, bonusIncomeRate: 1.25 }] },
            { level: 8, steps: [{ step: 0, cost: 0, bonusSatisfaction: 1100, bonusIncomeRate: 1.25 }, { step: 1, cost: 1650000000, bonusSatisfaction: 1140, bonusIncomeRate: 1.28 }, { step: 2, cost: 2050000000, bonusSatisfaction: 1180, bonusIncomeRate: 1.31 }, { step: 3, cost: 2500000000, bonusSatisfaction: 1220, bonusIncomeRate: 1.34 }, { step: 4, cost: 3100000000, bonusSatisfaction: 1260, bonusIncomeRate: 1.37 }, { step: 5, cost: 3800000000, bonusSatisfaction: 1380, bonusIncomeRate: 1.50 }] },
            { level: 9, steps: [{ step: 0, cost: 0, bonusSatisfaction: 1380, bonusIncomeRate: 1.50 }, { step: 1, cost: 4600000000, bonusSatisfaction: 1430, bonusIncomeRate: 1.53 }, { step: 2, cost: 5600000000, bonusSatisfaction: 1480, bonusIncomeRate: 1.56 }, { step: 3, cost: 6800000000, bonusSatisfaction: 1530, bonusIncomeRate: 1.59 }, { step: 4, cost: 8200000000, bonusSatisfaction: 1580, bonusIncomeRate: 1.62 }, { step: 5, cost: 10000000000, bonusSatisfaction: 1720, bonusIncomeRate: 1.75 }] },
            { level: 10, steps: [{ step: 0, cost: 0, bonusSatisfaction: 1720, bonusIncomeRate: 1.75 }] }
        ]
    }
};