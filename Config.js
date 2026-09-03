/**
 * AI可読性・先祖返り防止コメント:
 * 【プレイヤー初期資金100M設定 ＆ 全機能完全保持】
 * 1. プレイヤー初期資金を 100M（100,000,000）に設定。
 * 2. AI初期資金 30M、機体パラメータ、5段階の距離別ベース開拓コスト設定等は100%完全保持。
 */

export const CONFIG = {
    GLOBE_RADIUS: 5,
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x0f172a,
        COASTLINE: 0x38bdf8
    },
    MAP_DATA_URL: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json',
    
    COMPANIES: [
        { id: 'player', name: 'Player Airlines', routeColor: 0x34d399, planeColor: 0x34d399 }, 
        { id: 'rival_eu', name: 'Euro Wings',    routeColor: 0x0044ff, planeColor: 0x0044ff }, 
        { id: 'rival_as', name: 'Asia Orient',   routeColor: 0xffff00, planeColor: 0xffff00 }, 
        { id: 'rival_af', name: 'Africa Star',   routeColor: 0xff1493, planeColor: 0xff1493 }, 
        { id: 'rival_am', name: 'Americas Air',  routeColor: 0xff0000, planeColor: 0xff0000 }, 
        { id: 'rival_oc', name: 'Oceania Fly',   routeColor: 0x8a2be2, planeColor: 0x8a2be2 }  
    ],

    ECONOMY: {
        INITIAL_FUNDS: 100000000,   // ★プレイヤー初期資金: 100M
        AI_INITIAL_FUNDS: 30000000, // ★AI初期資金: 30M（維持）
        MAX_PLANES_INITIAL: 10,
        
        // 爽快感重視の機体パラメータ設定
        PLANES: {
            small:  { cost: 5000000,   sellRate: 0.70, upkeep: 250,  baseDemand: 30,  incomeBase: 1200 },
            medium: { cost: 25000000,  sellRate: 0.60, upkeep: 750,  baseDemand: 90,  incomeBase: 4200 },
            large:  { cost: 60000000,  sellRate: 0.50, upkeep: 2200, baseDemand: 220, incomeBase: 12500 },
            super:  { cost: 150000000, sellRate: 0.40, upkeep: 6000, baseDemand: 500, incomeBase: 32000 }
        },

        // 5段階の距離別ベース開拓コスト設定
        ROUTE_TIERS: [
            { maxDist: 0.6,  cost: 200000,   name: '国内線 / 近距離' },
            { maxDist: 1.2,  cost: 1000000,  name: '大陸内 / 中距離' },
            { maxDist: 2.0,  cost: 4000000,  name: '国際線 / 準長距離' },
            { maxDist: 3.2,  cost: 12000000, name: '大陸横断 / 長距離' },
            { maxDist: 9.99, cost: 25000000, name: '海洋横断 / 超長距離' }
        ]
    },

    EVENTS: {
        INTERVAL_MIN: 45,
        INTERVAL_MAX: 90,
        TYPES: [
            {
                id: 'fuel_surge',
                title: '燃料価格高騰',
                desc: '原油価格の急騰により、全機の維持費が一時的に増加します。',
                duration: 25,
                effect: { type: 'upkeep_mult', value: 1.4 }
            },
            {
                id: 'tourism_boom',
                title: '世界観光ブーム',
                desc: '海外旅行需要が急増し、すべての路線の旅客需要と収益が大幅にアップします！',
                duration: 30,
                effect: { type: 'income_mult', value: 1.5 }
            },
            {
                id: 'subsidy',
                title: '航空振興助成金',
                desc: '政府からの観光・地域振興助成金が交付され、臨時収入を得ました。',
                duration: 0,
                effect: { type: 'grant', value: 15000000 }
            },
            {
                id: 'weather_storm',
                title: '悪天候と遅延',
                desc: '広範囲の気象悪化により一時的に運航効率が低下し、収益が減少します。',
                duration: 20,
                effect: { type: 'income_mult', value: 0.7 }
            }
        ]
    }
};