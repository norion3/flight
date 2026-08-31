/**
 * AI可読性・先祖返り防止コメント:
 * 【AIへの初期資金導入】
 * AI各社がゲーム開始時に保有するリアルな現金（初期資金）として、
 * AI_INITIAL_FUNDS を $30,000,000（$30M）に設定しました。
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
        AI_INITIAL_FUNDS: 30000000, // ★追加: AIの初期資金(30M)
        MAX_PLANES_INITIAL: 10,
        
        PLANES: {
            small:  { cost: 5000000,  sellRate: 0.70, upkeep: 200,   baseDemand: 30,  incomeBase: 1500 },
            medium: { cost: 25000000, sellRate: 0.60, upkeep: 600,   baseDemand: 90,  incomeBase: 5000 },
            large:  { cost: 60000000, sellRate: 0.50, upkeep: 1800,  baseDemand: 220, incomeBase: 14000 },
            super:  { cost: 150000000,sellRate: 0.40, upkeep: 5000,  baseDemand: 500, incomeBase: 35000 }
        },

        ROUTE_BASE_COST: 5000000,       
        ROUTE_DISTANCE_COST_RATE: 2000000, 
        
        AIRPORT_RANKS: {
            major:    { multiplier: 1.5, baseTraffic: 500 },
            local:    { multiplier: 1.0, baseTraffic: 150 },
            fictional:{ multiplier: 0.8, baseTraffic: 50  }
        }
    }
};