export const CONFIG = {
    GLOBE_RADIUS: 5,
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x0f172a,
        COASTLINE: 0x38bdf8
    },
    MAP_DATA_URL: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json',
    
    // ★追加: プレイヤーおよびライバル5社の定義
    // routeColor: 空路の色 / planeColor: 飛行機の色
    // プレイヤーの色は元ファイルで指定されていた色（青線、緑機体）を尊重しています
    COMPANIES: [
        { id: 'player', name: 'Player Airlines', routeColor: 0x0ea5e9, planeColor: 0x34d399 },
        { id: 'rival_eu', name: 'Euro Wings', routeColor: 0xff00ff, planeColor: 0xff00ff },
        { id: 'rival_as', name: 'Asia Orient', routeColor: 0xffd700, planeColor: 0xffd700 },
        { id: 'rival_af', name: 'Africa Star', routeColor: 0xff4500, planeColor: 0xff4500 },
        { id: 'rival_am', name: 'Americas Air', routeColor: 0x00fa9a, planeColor: 0x00fa9a },
        { id: 'rival_oc', name: 'Oceania Fly', routeColor: 0x9370db, planeColor: 0x9370db }
    ]
};