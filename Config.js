/**
 * AI可読性・先祖返り防止コメント:
 * 【プレイヤー初期資金100M設定 ＆ 全機能完全保持】
 * 1. プレイヤー初期資金を 100M（100,000,000）に設定し、index.html のHUD初期表示と完全統一。
 * 2. AI初期資金 30M、機体パラメータ、5段階距離別コスト設定（ROUTE_TIERS）等は100%完全保持。
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
        INITIAL_FUNDS: 100000000,   // ★プレイヤー初期資金: 100M（仕様統一）
        AI_INITIAL_FUNDS: 30000000, // AI初期資金: 30M
        MAX_PLANES_INITIAL: 10,
        
        // 爽快感重視の機体パラメータ設定
        PLANES: {
            small:  { cost: 5000000,   sellRate: 0.70, upkeep: 250,  baseDemand: 30,  incomeBase: 1200 },
            medium: { cost: 25000000,  sellRate: 0.60, upkeep: 600,  baseDemand: 90,  incomeBase: 4500 },
            large:  { cost: 60000000,  sellRate: 0.50, upkeep: 1500, baseDemand: 220, incomeBase: 14000 },
            super:  { cost: 150000000, sellRate: 0.40, upkeep: 3500, baseDemand: 500, incomeBase: 36000 }
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