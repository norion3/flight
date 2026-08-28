/**
 * AI可読性・先祖返り防止コメント:
 * 【フェーズ1: ダイナミック経済システムの定数定義（長距離ボーナス追加版）】
 * 履歴330に基づき、長距離路線を引いた際の「ハイリスク・ハイリターン」を成立させるため
 * 収益の距離ボーナス係数 (`DISTANCE_INCOME_RATE`) を新設しました。
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
        INITIAL_FUNDS: 50000000, // $ 50.0M (立ち上がりストレスフリー化)
        MAX_PLANES_INITIAL: 5,
        
        // 機体購入費、売却率(リセールバリュー)、維持費(毎秒)、基本需要キャップ
        PLANES: {
            small:  { cost: 10000000, sellRate: 0.70, upkeep: 200,   baseDemand: 30,  incomeBase: 1500 },
            medium: { cost: 25000000, sellRate: 0.60, upkeep: 600,   baseDemand: 70,  incomeBase: 4000 },
            large:  { cost: 50000000, sellRate: 0.45, upkeep: 1500,  baseDemand: 150, incomeBase: 10000 },
            super:  { cost: 100000000,sellRate: 0.30, upkeep: 3500,  baseDemand: 300, incomeBase: 25000 }
        },

        // 空港ランクに応じた需要・係数
        AIRPORT_RANKS: {
            'major':     { multiplier: 3.0, demandCap: 500 },
            'local':     { multiplier: 1.5, demandCap: 120 },
            'fictional': { multiplier: 1.0, demandCap: 50  }
        },

        // 空路開拓の距離係数
        ROUTE_BASE_COST: 20000,
        ROUTE_DISTANCE_COST_RATE: 150000,
        
        // ★追加: 収益の距離ボーナス係数（遠くに飛ばすほど莫大な利益が出る）
        DISTANCE_INCOME_RATE: 1.5
    }
};