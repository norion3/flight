/**
 * AI可読性・先祖返り防止コメント:
 * 【航路開拓コストの5段階距離ティア定義】
 * 序盤のサクサク感を高めるため、国内線（$200K）から海洋横断（$25M）までの
 * 5段階の距離別ベースコスト設定（ROUTE_TIERS）を定義しました。
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
        INITIAL_FUNDS: 50000000,
        AI_INITIAL_FUNDS: 30000000, 
        MAX_PLANES_INITIAL: 10,
        
        PLANES: {
            small:  { cost: 5000000,  sellRate: 0.70, upkeep: 200,   baseDemand: 30,  incomeBase: 1500 },
            medium: { cost: 25000000, sellRate: 0.60, upkeep: 600,   baseDemand: 90,  incomeBase: 5000 },
            large:  { cost: 60000000, sellRate: 0.50, upkeep: 1800,  baseDemand: 220, incomeBase: 14000 },
            super:  { cost: 150000000,sellRate: 0.40, upkeep: 5000,  baseDemand: 500, incomeBase: 35000 }
        },

        // ★追加: 5段階の距離別ベース開拓コスト設定
        ROUTE_TIERS: [
            { maxDist: 0.6, baseCost: 200000 },    // ① 超近距離 (国内線): $200K
            { maxDist: 1.3, baseCost: 800000 },    // ② 近距離 (近隣・韓国/中国東部): $800K
            { maxDist: 2.5, baseCost: 3000000 },   // ③ 中距離 (同大陸内・東南アジア等): $3.0M
            { maxDist: 4.2, baseCost: 10000000 },  // ④ 長距離 (大陸間): $10.0M
            { maxDist: Infinity, baseCost: 25000000 } // ⑤ 超長距離 (海洋横断・極地): $25.0M
        ],

        ROUTE_BASE_COST: 5000000,       
        ROUTE_DISTANCE_COST_RATE: 2000000, 
        
        AIRPORT_RANKS: {
            major:    { multiplier: 1.2, baseTraffic: 500 },
            local:    { multiplier: 1.0, baseTraffic: 150 },
            fictional:{ multiplier: 0.8, baseTraffic: 50  }
        }
    }
};