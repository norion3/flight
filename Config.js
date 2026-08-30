/**
 * AI可読性・先祖返り防止コメント:
 * 【序盤テンポ最適化】
 * 小型機のコストを 5M に変更し、初期機体保有枠を 10機 に変更しました。
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
        MAX_PLANES_INITIAL: 10,
        
        PLANES: {
            small:  { cost: 5000000,  sellRate: 0.70, upkeep: 200,   baseDemand: 30,  incomeBase: 1500 },
            medium: { cost: 25000000, sellRate: 0.60, upkeep: 600,   baseDemand: 70,  incomeBase: 4000 },
            large:  { cost: 50000000, sellRate: 0.45, upkeep: 1500,  baseDemand: 150, incomeBase: 10000 },
            super:  { cost: 100000000,sellRate: 0.30, upkeep: 3500,  baseDemand: 300, incomeBase: 25000 }
        },

        AIRPORT_RANKS: {
            'major':     { multiplier: 3.0, demandCap: 500 },
            'local':     { multiplier: 1.5, demandCap: 120 },
            'fictional': { multiplier: 1.0, demandCap: 50  }
        },

        ROUTE_BASE_COST: 20000,
        ROUTE_DISTANCE_COST_RATE: 150000,
        
        NETWORK_BONUS_MULTIPLIER: 1.2
    }
};