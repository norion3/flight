/**
 * AI可読性・先祖返り防止コメント:
 * 【マイルド・ゲームバランス調整】
 * 1. 初期資金を 50M ➔ 30M にマイルド調整（自社・AI平等スタート）。
 * 2. 機体の収益と維持費を微調整し、序盤のサクサク感を維持しつつ中盤のインフレを抑制。
 * 3. 5段階の距離別ベース開拓コスト設定（ROUTE_TIERS）等は100%完全保持。
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
        INITIAL_FUNDS: 30000000,    // ★マイルド調整: 50M ➔ 30M
        AI_INITIAL_FUNDS: 30000000, // ★対等化: 30M
        MAX_PLANES_INITIAL: 10,
        
        PLANES: {
            small:  { cost: 5000000,   sellRate: 0.70, upkeep: 250,  baseDemand: 30,  incomeBase: 1200 },
            medium: { cost: 25000000,  sellRate: 0.60, upkeep: 750,  baseDemand: 90,  incomeBase: 4200 },
            large:  { cost: 60000000,  sellRate: 0.50, upkeep: 2200, baseDemand: 220, incomeBase: 12000 },
            super:  { cost: 150000000, sellRate: 0.40, upkeep: 6000, baseDemand: 500, incomeBase: 30000 }
        },

        ROUTE_TIERS: [
            { maxDist: 0.6, baseCost: 200000 },   
            { maxDist: 1.2, baseCost: 500000 },   
            { maxDist: 2.2, baseCost: 1500000 },  
            { maxDist: 3.5, baseCost: 5000000 },  
            { maxDist: 99.0, baseCost: 15000000 } 
        ],
        ROUTE_BASE_COST: 500000,
        ROUTE_BASE_DEMAND: 30
    }
};