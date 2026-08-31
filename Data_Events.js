/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 5: 実績・ライバル状況連動型 動的イベント定義データ】
 * 固定額の出費を完全撤廃し、所持金や月収に対する割合（%）で動的計算します。
 * Stage 1〜6の実績ステージおよびライバル盤面に応じた全15種のイベントを定義しています。
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
                    message: 'ご当地スイーツが大好評！顧客満足度がアップしました。'
                })
            },
            {
                text: 'パンフレット紹介にとどめる',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 4,
                    message: 'ささやかなPRとして喜ばれました。'
                })
            }
        ]
    },
    {
        id: 'stage1_crew_praise',
        stageMin: 1,
        stageMax: 2,
        title: '現場クルーの神対応が話題に',
        description: '新人クルーの親切で温かい接客が、利用客のSNS上で小さくバズり注目を集めています。',
        condition: (ctx) => true,
        options: [
            {
                text: '特別報奨金を支給して称える',
                getCost: (ctx) => Math.max(30000, Math.round(ctx.funds * 0.03)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 20,
                    message: '現場の士気が最高潮に！顧客満足度が大幅に上昇しました。'
                })
            },
            {
                text: '社内報でお礼メッセージを掲載',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 8,
                    message: '温かい会社の雰囲気が利用客に好印象を与えました。'
                })
            }
        ]
    },
    {
        id: 'stage1_fog_delay',
        stageMin: 1,
        stageMax: 2,
        title: '地方空港の濃霧による一時待機',
        description: '早朝の濃霧により、一部の地方空港で出発遅延の可能性が生じています。',
        condition: (ctx) => true,
        options: [
            {
                text: 'お詫びクーポンを配布し丁寧に対応',
                getCost: (ctx) => Math.max(40000, Math.round(ctx.funds * 0.04)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 6,
                    message: '誠実な神対応として利用客から高い評価を受けました。'
                })
            },
            {
                text: '安全確認を最優先に通常待機',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: -5,
                    message: '安全運航を第一に待機しました。'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ Stage 3〜4: 近隣進出・大陸横断期
    // -------------------------------------------------------------
    {
        id: 'stage3_wifi_upgrade',
        stageMin: 3,
        stageMax: 4,
        title: '最新機内Wi-Fiの導入検討',
        description: '中長距離便の拡大に伴い、ビジネス客から最新高速Wi-Fiの導入が強く要望されています。',
        condition: (ctx) => true,
        options: [
            {
                text: '全機に最新Wi-Fiを一斉導入',
                getCost: (ctx) => Math.max(500000, Math.round(ctx.funds * 0.09)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 28,
                    incomeRateDelta: 0.05,
                    durationMonths: 3,
                    message: '快適なフライト環境がビジネス客に絶賛されました！'
                })
            },
            {
                text: '機内誌とエンタメの充実で対応',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 6,
                    message: '手堅いサービスで満足度を維持しました。'
                })
            }
        ]
    },
    {
        id: 'stage3_fuel_surge',
        stageMin: 3,
        stageMax: 4,
        title: '国際燃料市況の一時的高騰',
        description: '国際情勢の変化により、航空ジェット燃料の調達コストが一時的に上昇しています。',
        condition: (ctx) => true,
        options: [
            {
                text: '自社努力で燃料費を吸収する',
                getCost: (ctx) => Math.max(300000, Math.round(ctx.funds * 0.07)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 22,
                    message: '運賃据え置きの企業努力が利用客から厚い信頼を得ました。'
                })
            },
            {
                text: 'サーチャージを導入し転嫁する',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: -10,
                    message: '収支を維持するため、一時的に運賃を調整しました。'
                })
            }
        ]
    },
    {
        id: 'stage3_tourism_boom',
        stageMin: 3,
        stageMax: 4,
        title: 'インバウンド観光ブーム到来！',
        description: '大型連休と観光ブームが重なり、就航地への旅行需要が急激に高まっています。',
        condition: (ctx) => true,
        options: [
            {
                text: '臨時増便・PRキャンペーンを展開',
                getCost: (ctx) => Math.max(400000, Math.round(ctx.funds * 0.06)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    passengersRateDelta: 0.35,
                    incomeRateDelta: 0.15,
                    durationMonths: 2,
                    message: '観光特需で搭乗客数と収益が大幅に急増しました！'
                })
            },
            {
                text: '定期便の満席運航で手堅く対応',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    passengersRateDelta: 0.12,
                    durationMonths: 2,
                    message: '定期便が連日満席となり順調に推移しています。'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ Stage 5〜6: 国際メガキャリア・世界覇権期
    // -------------------------------------------------------------
    {
        id: 'stage5_summit_airline',
        stageMin: 5,
        stageMax: 6,
        title: '国際メガサミットの公式航空会社に指名',
        description: '主要就航地で開催される国際サミットのオフィシャルエアライン就任オファーが届きました。',
        condition: (ctx) => true,
        options: [
            {
                text: '公式パートナーとして全社で参画',
                getCost: (ctx) => Math.max(2000000, Math.round(ctx.funds * 0.12)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 38,
                    passengersRateDelta: 0.25,
                    durationMonths: 3,
                    message: '世界中にブランドが知れ渡り、圧倒的な名声と客数を獲得！'
                })
            },
            {
                text: '特別塗装機の運航のみで参加',
                getCost: (ctx) => Math.max(500000, Math.round(ctx.funds * 0.03)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 14,
                    message: '記念フライトがファンの間で話題になりました。'
                })
            }
        ]
    },
    {
        id: 'stage5_saf_fuel',
        stageMin: 5,
        stageMax: 6,
        title: '持続可能航空燃料（SAF）の先行導入',
        description: '環境負荷を大幅に低減する次世代エコ燃料の導入プロジェクトが提案されました。',
        condition: (ctx) => true,
        options: [
            {
                text: 'SAFを先行導入し環境先進企業へ',
                getCost: (ctx) => Math.max(1500000, Math.round(ctx.funds * 0.10)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 32,
                    message: 'クリーンな航空会社として世界的評価が急上昇しました！'
                })
            },
            {
                text: '段階的な検討にとどめる',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    message: '計画通りの堅実な運航を継続します。'
                })
            }
        ]
    },
    {
        id: 'stage5_global_alliance',
        stageMin: 5,
        stageMax: 6,
        title: '世界最高峰アライアンス（航空連合）設立',
        description: '各国の主要航空会社と提携し、世界規模のコードシェアネットワークを構築する好機です。',
        condition: (ctx) => true,
        options: [
            {
                text: '主導権を握りグローバル連合を結成',
                getCost: (ctx) => Math.max(3000000, Math.round(ctx.funds * 0.15)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 40,
                    incomeRateDelta: 0.10,
                    durationMonths: 6,
                    message: '世界連合のリーダーに就任！全路線の基本収益が底上げされました。'
                })
            },
            {
                text: '独立独歩のオリジナル路線を貫く',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 10,
                    message: '独自ブランドとしての誇りとこだわりが評価されました。'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ ライバル盤面・状況連動イベント（特殊トリガー）
    // -------------------------------------------------------------
    {
        id: 'rival_dead_heat',
        stageMin: 1,
        stageMax: 6,
        title: '【首位攻防戦】ライバルとのデッドヒート！',
        description: '首位ライバル社とのシェア差がごく僅かとなり、航空業界の注目が一身に集まっています。',
        condition: (ctx) => ctx.isDeadHeat,
        options: [
            {
                text: '大規模比較キャンペーンを展開',
                getCost: (ctx) => Math.max(100000, Math.round(ctx.funds * 0.08)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 18,
                    message: 'ライバルとの直接対決に勝利し、シェアを大きく奪取しました！'
                })
            },
            {
                text: '誠実な安全第一の姿勢をアピール',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 12,
                    message: '落ち着いた企業姿勢が安心感を生み、固定客を獲得しました。'
                })
            }
        ]
    },
    {
        id: 'rival_dominant_counter',
        stageMin: 2,
        stageMax: 6,
        title: '【商圏防衛】ライバル優勢地域への対抗策',
        description: '他社が独占しつつある地域から、我が社の就航を心待ちにする声が多数寄せられています。',
        condition: (ctx) => ctx.isRivalDominant,
        options: [
            {
                text: '就航記念の特別価格キャンペーン',
                getCost: (ctx) => Math.max(150000, Math.round(ctx.funds * 0.07)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 24,
                    passengersRateDelta: 0.20,
                    durationMonths: 2,
                    message: 'ライバルの牙城を崩し、新規顧客が殺到しました！'
                })
            },
            {
                text: '手厚い接客サービスで差別化',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 15,
                    message: '質の高いサービスが口コミで広まりました。'
                })
            }
        ]
    },
    {
        id: 'rival_withdrawn_takeover',
        stageMin: 1,
        stageMax: 6,
        title: '【路線継承】撤退空港からの増便要請',
        description: 'ライバル他社が撤退した空港の自治体から、空いた発着枠を引き継いでほしいとの打診が届きました。',
        condition: (ctx) => ctx.recentWithdrawal,
        options: [
            {
                text: '要請に応じ速やかに発着枠を確保',
                getCost: (ctx) => Math.max(80000, Math.round(ctx.funds * 0.05)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 20,
                    passengersRateDelta: 0.15,
                    durationMonths: 2,
                    message: '地元住民から感謝され、該当空港の利用客を独占しました！'
                })
            },
            {
                text: '無理な拡大はせず現状を維持',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    message: '手持ちの路線を着実に維持・運航しました。'
                })
            }
        ]
    },
    {
        id: 'player_solo_leader',
        stageMin: 4,
        stageMax: 6,
        title: '【業界盟主】次世代パイロット育成基金',
        description: '世界シェア首位を独走する我が社に対し、航空業界全体のパイロット育成への支援が求められています。',
        condition: (ctx) => ctx.isSoloLeader,
        options: [
            {
                text: '育成基金を設立し業界に大きく貢献',
                getCost: (ctx) => Math.max(1000000, Math.round(ctx.funds * 0.10)),
                apply: (ctx, cost) => ({
                    fundsDelta: -cost,
                    satisfactionDelta: 35,
                    incomeRateDelta: 0.05,
                    durationMonths: 4,
                    message: '業界のリーダーとして絶賛され、優秀な人材が集結しました！'
                })
            },
            {
                text: '自社スタッフの教育を優先する',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    satisfactionDelta: 10,
                    message: '自社の運航品質をさらに高めることに集中しました。'
                })
            }
        ]
    },

    // -------------------------------------------------------------
    // ■ 救済・再起 / 資金潤沢特殊イベント
    // -------------------------------------------------------------
    {
        id: 'rescue_local_bank',
        stageMin: 1,
        stageMax: 6,
        title: '【地元支援】地域金融機関からの再起融資',
        description: '我が社の社会的意義を信じる地元金融機関から、無利子の事業支援資金が提示されました。',
        condition: (ctx) => ctx.funds <= 3000000,
        options: [
            {
                text: '支援金を受け取り、事業を立て直す',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    fundsDelta: 5000000,
                    satisfactionDelta: 10,
                    message: '+$5.0Mの支援金を獲得！経営の立て直しに弾みがつきました。'
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
                    message: '全社員の笑顔が溢れ、サービス品質と顧客満足度が急上昇！'
                })
            },
            {
                text: '将来の機体購入資金として内部留保',
                getCost: (ctx) => 0,
                apply: (ctx, cost) => ({
                    message: '堅実な財務体質を維持し、次なる投資に備えます。'
                })
            }
        ]
    }
];