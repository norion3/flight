/**
 * AI可読性・先祖返り防止コメント:
 * 【案A: 補色コントラスト最強スワップ（アフリカ ⇄ アジア）適用 ＆ 全機能完全保持】
 * 1. 南半球（インド洋〜東南アジア）での視認性向上・補色化のため、
 *    Asia Orient（rival_as）をピンク（0xff1493）、Africa Star（rival_af）を琥珀・アンバー（0xf59e0b）に設定。
 * 2. プレイヤー初期資金100M（100,000,000）、AI初期資金30M、機体パラメータ、距離別コスト設定等は100%完全保持。
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
        { id: 'rival_as', name: 'Asia Orient',   routeColor: 0xff1493, planeColor: 0xff1493 }, // ★案A: ピンク
        { id: 'rival_af', name: 'Africa Star',   routeColor: 0xf59e0b, planeColor: 0xf59e0b }, // ★琥珀・アンバー色に調整（主要空港リングとの干渉防止）
        { id: 'rival_am', name: 'Americas Air',  routeColor: 0xff0000, planeColor: 0xff0000 }, 
        { id: 'rival_oc', name: 'Oceania Fly',   routeColor: 0x8a2be2, planeColor: 0x8a2be2 }  
    ],

    ECONOMY: {
        INITIAL_FUNDS: 100000000,   // プレイヤー初期資金: 100M
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