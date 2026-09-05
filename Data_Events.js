/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 5: 実績・ライバル状況連動型 動的イベント定義データ】
 * 1. トーストメッセージの文末を「〜しました！」に統一し、UI上の視認性と爽快感を向上。
 * 2. 構文エラーの原因となった不要なエスケープ記号を完全に排除し、安全でクリーンな構造を維持。
 * 3. 所持金や月収に対する割合（%）ベースの動的コスト計算、Stage 1〜6の進行条件等は100%保持しています。
 * 4. 【追加】マクロ経済を揺るがす「グローバルイベント（ワールドニュース）」を追加。
 * 5. 【改善】stage1_local_sweets の選択肢2のリザルトメッセージを適切な文脈に調整。
 */

export const EVENT_DATA = [
    // -------------------------------------------------------------
    // ■ Stage 1〜2: 創業・地域拡大期
    // -------------------------------------------------------------
    {
        id: 'stage1_local_sweets',
        stageMin: 1,
        stageMax: 2,
        title: 'ご当地スイーツの機内採用',
        description: '就航先の地元自治体から、機内サービスで地元の名産スイーツを採用してほしいとの提案が届きました。',
        condition: (ctx) => true,
        options: [
            {
                text: '採用して特別提供する',
                getCost: (ctx) => Math.max(50000, Math.round(ctx.funds * 0.04)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 12,
                    passengersRateDelta: 0.05,
                    durationMonths: 2,
                    message: 'ご当地スイーツが大好評！顧客満足度がアップしました！'
                })
            },
            {
                text: 'パンフレット紹介にとどめる',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 3,
                    message: '手堅く宣伝を行い、安定した運航を維持しました！'
                })
            }
        ]
    },
    {
        id: 'stage1_heavy_fog',
        stageMin: 1,
        stageMax: 2,
        title: '主要空港の濃霧による機材繰り悪化',
        description: '季節性の濃霧によりダイヤが乱れています。臨時整備とクルーの手配で遅延を最小限に抑えますか？',
        condition: (ctx) => true,
        options: [
            {
                text: '特別手当を出して臨時整備班を投入',
                getCost: (ctx) => Math.max(80000, Math.round(ctx.funds * 0.06)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 8,
                    message: '機体の点検・修繕を迅速に完了させました！'
                })
            },
            {
                text: '自然回復を待つ（欠航・遅延容認）',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: -10,
                    passengersRateDelta: -0.08,
                    durationMonths: 1,
                    message: '点検が遅れ、機材繰りに遅延が発生しました！'
                })
            }
        ]
    },
    {
        id: 'stage2_wifi_service',
        stageMin: 2,
        stageMax: 3,
        title: '全機無料Wi-Fi導入の検討',
        description: 'ビジネス客から機内Wi-Fiの強い要望が寄せられています。競合他社に先駆けて導入しますか？',
        condition: (ctx) => ctx.planeCount >= 3,
        options: [
            {
                text: '全機に高速Wi-Fiを導入する',
                getCost: (ctx) => Math.max(200000, Math.round(ctx.funds * 0.08)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 20,
                    passengersRateDelta: 0.10,
                    durationMonths: 3,
                    message: '快適なWi-Fi環境がビジネス客に大好評です！'
                })
            },
            {
                text: '時期尚早として見送る',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: -5,
                    message: 'Wi-Fi未整備のため、一部顧客から不満の声が上がりました！'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ Stage 3〜4: 大陸横断・国際線展開期
    // -------------------------------------------------------------
    {
        id: 'stage3_fuel_crisis',
        stageMin: 3,
        stageMax: 4,
        title: '国際原油価格の急騰',
        description: '地政学リスクにより航空燃油サーチャージが高騰しています。ヘッジ取引でコストを抑えますか？',
        condition: (ctx) => true,
        options: [
            {
                text: '燃油先物ヘッジを一括購入',
                getCost: (ctx) => Math.max(500000, Math.round(ctx.funds * 0.09)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    incomeRateDelta: -0.05,
                    durationMonths: 2,
                    message: '高効率運航により燃料費の高騰を最小限に抑えました！'
                })
            },
            {
                text: '運航効率化で耐え忍ぶ',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    incomeRateDelta: -0.15,
                    durationMonths: 2,
                    message: '燃料高騰の直撃を受け、収益が一時的に圧迫されました！'
                })
            }
        ]
    },
    {
        id: 'stage3_vip_charter',
        stageMin: 3,
        stageMax: 5,
        title: '大統領・要人チャーター便の要請',
        description: '国際会議のため、政府要人から急遽チャーター機の運航打診がありました。最優先で対応しますか？',
        condition: (ctx) => ctx.planeCount >= 5,
        options: [
            {
                text: '専用機を仕立てて最高待遇で受託',
                getCost: (ctx) => Math.max(300000, Math.round(ctx.funds * 0.05)),
                apply: (ctx, cost) => ({
                    fundsDelta: Math.round(cost * 2.8),
                    satisfactionDelta: 15,
                    message: 'VIPチャーター便が大成功！多額のチャーター料を獲得しました！'
                })
            },
            {
                text: '通常便の運行を最優先して断る',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    message: 'トラブルなく通常運航を維持しました！'
                })
            }
        ]
    },
    {
        id: 'stage4_alliance_invite',
        stageMin: 4,
        stageMax: 5,
        title: '世界的航空アライアンスからの加盟招待',
        description: '大手航空連合から加盟の誘いを受けました。加盟一時金が必要ですが、コードシェアで客数が急増します。',
        condition: (ctx) => ctx.routeCount >= 10,
        options: [
            {
                text: 'アライアンスに正式加盟する',
                getCost: (ctx) => Math.max(2000000, Math.round(ctx.funds * 0.12)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.20,
                    satisfactionDelta: 25,
                    durationMonths: 4,
                    message: '世界規模のアライアンスに加盟！ネットワーク価値が跳ね上がりました！'
                })
            },
            {
                text: '独立系キャリアとして独自展開',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 5,
                    message: '独自路線を貫き、自社ブランドの個性を維持しました！'
                })
            }
        ]
    },
    {
        id: 'stage4_celeb_endorse',
        stageMin: 4,
        stageMax: 6,
        title: '世界的スーパースターのアンバサダー就任',
        description: '世界的セレブが自社便を絶賛。正式にグローバルアンバサダー契約を結ぶ好機です。',
        condition: (ctx) => true,
        options: [
            {
                text: '巨額の契約金で専属契約を締結',
                getCost: (ctx) => Math.max(1500000, Math.round(ctx.funds * 0.10)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.25,
                    satisfactionDelta: 30,
                    durationMonths: 3,
                    message: '世界的タレントのCMが大反響！ブランド知名度が急上昇しました！'
                })
            },
            {
                text: 'SNSでの自然な口コミに任せる',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    passengersRateDelta: 0.05,
                    durationMonths: 1,
                    message: '地道な信頼経営を継続しました！'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ Stage 5〜6: 世界覇権・グローバル首位期
    // -------------------------------------------------------------
    {
        id: 'stage5_airline_of_the_year',
        stageMin: 5,
        stageMax: 6,
        title: '『ワールド・ベスト・エアライン』受賞の栄冠',
        description: '国際航空評価機関より、今年度の世界最優秀エアラインに選出されました！記念キャンペーンを打ちますか？',
        condition: (ctx) => ctx.globalShare >= 0.25,
        options: [
            {
                text: '世界規模の大感謝セールを展開！',
                getCost: (ctx) => Math.max(3000000, Math.round(ctx.funds * 0.08)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.35,
                    satisfactionDelta: 40,
                    durationMonths: 3,
                    message: '『世界最優秀航空会社』を受賞！世界中から予約が殺到しています！'
                })
            },
            {
                text: '社員への利益還元ボーナスを支給',
                getCost: (ctx) => Math.max(1500000, Math.round(ctx.funds * 0.05)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 25,
                    message: '現場への利益還元を実施し、クルーの結束力が高まりました！'
                })
            }
        ]
    },
    {
        id: 'stage6_space_tourism',
        stageMin: 6,
        stageMax: 6,
        title: '準軌道・宇宙旅行プロジェクトへの参画',
        description: '大気圏を飛び越える次世代スペースプレーン開発への出資要請が届きました。航空宇宙の覇者を目指しますか？',
        condition: (ctx) => ctx.funds >= 50000000,
        options: [
            {
                text: '莫大な開発投資を主導する',
                getCost: (ctx) => Math.max(20000000, Math.round(ctx.funds * 0.25)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.50,
                    satisfactionDelta: 60,
                    durationMonths: 6,
                    message: '次世代宇宙旅行プロジェクトを始動！航空宇宙の歴史に名を刻みました！'
                })
            },
            {
                text: '地球規模メガキャリアの完成に集中',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 10,
                    message: '堅実な地球圏メガキャリアとして、絶対的なシェアを確立しました！'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ 特殊条件・ライバル衝突・救済イベント
    // -------------------------------------------------------------
    {
        id: 'special_fare_war',
        stageMin: 2,
        stageMax: 6,
        title: 'ライバル企業からの熾烈な値下げ攻勢',
        description: '同一航路を運航する競合社が破格の割引キャンペーンを仕掛けてきました。対抗値下げを行いますか？',
        condition: (ctx) => ctx.recentWithdrawal === true,
        options: [
            {
                text: '対抗値下げで返り討ちにする！',
                getCost: (ctx) => Math.max(100000, Math.round(ctx.funds * 0.05)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.15,
                    satisfactionDelta: 10,
                    durationMonths: 2,
                    message: '徹底対抗でライバルを圧倒！市場シェアを奪還しました！'
                })
            },
            {
                text: '品質重視のサービスでブランド勝負',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    incomeRateDelta: -0.05,
                    satisfactionDelta: 5,
                    durationMonths: 2,
                    message: '一時的な戦略的後退により、無駄な消耗戦を回避しました！'
                })
            }
        ]
    },
    {
        id: 'special_bailout_fund',
        stageMin: 1,
        stageMax: 6,
        title: '地域公共交通維持機構からの緊急復興支援',
        description: '資金難に陥った当社に対し、公的ファンドから事業継続のための緊急支援金が提示されました。',
        condition: (ctx) => ctx.funds < 2000000 && ctx.planeCount >= 2,
        options: [
            {
                text: '支援金を受け取り、事業を立て直す',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    fundsDelta: 5000000,
                    satisfactionDelta: 10,
                    message: '+$5.0Mの支援金を獲得！経営の立て直しに弾みがつきました！'
                })
            },
            {
                text: '自力での再建を誓い感謝して辞退',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 20,
                    message: '現場の結束が強まり、スタッフの士気が大幅に向上しました！'
                })
            }
        ]
    },
    {
        id: 'bonus_special_dividend',
        stageMin: 2,
        stageMax: 6,
        title: '好業績に伴う社員特別ボーナス',
        description: '黒字経営を支え続けてくれた現場クルー・整備士へ、特別賞与の支給を検討します。',
        condition: (ctx) => ctx.funds >= 25000000,
        options: [
            {
                text: '大盤振る舞いの特別賞与を支給！',
                getCost: (ctx) => Math.max(1000000, Math.round(ctx.funds * 0.07)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 30,
                    durationMonths: 3,
                    message: '特別賞与を支給！現場スタッフのモチベーションが爆発しました！'
                })
            },
            {
                text: '次なる路線投資のために資金温存',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 0,
                    message: '手元資金を温存し、将来の設備投資に備えました！'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ グローバルイベント（ワールドニュース）
    // ※全社に影響を与えるマクロ経済イベント
    // -------------------------------------------------------------
    {
        id: 'global_eu_strike',
        type: 'global',
        stageMin: 2,
        stageMax: 6,
        title: '【国際速報】欧州 大規模航空ストライキ',
        description: 'ヨーロッパ地域の空港で大規模なストライキが発生。欧州発着便の需要が3ヶ月間、半減します。',
        condition: (ctx) => true,
        options: [
            {
                text: '確認',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    globalEffect: { region: 'eu', passengersRateDelta: -0.50, durationMonths: 3 },
                    message: '欧州路線の需要が激減しています！'
                })
            }
        ]
    },
    {
        id: 'global_asia_boom',
        type: 'global',
        stageMin: 2,
        stageMax: 6,
        title: '【国際速報】アジア・太平洋 経済ブーム',
        description: 'アジア・オセアニア地域で歴史的な好景気が到来。同地域発着便の収益が4ヶ月間、+40%増加します。',
        condition: (ctx) => true,
        options: [
            {
                text: '確認',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    globalEffect: { region: 'as_oc', incomeRateDelta: 0.40, durationMonths: 4 },
                    message: 'アジア・太平洋路線の収益が急増しています！'
                })
            }
        ]
    },
    {
        id: 'global_fuel_crisis',
        type: 'global',
        stageMin: 3,
        stageMax: 6,
        title: '【国際速報】世界的な航空燃油高騰',
        description: '地政学的要因により、航空燃油サーチャージが世界的に高騰。全社の全路線で収益率が3ヶ月間、-25%悪化します。',
        condition: (ctx) => true,
        options: [
            {
                text: '確認',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    globalEffect: { region: 'all', incomeRateDelta: -0.25, durationMonths: 3 },
                    message: '世界的に航空会社の収益が圧迫されています！'
                })
            }
        ]
    }
];