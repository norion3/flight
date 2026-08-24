export const CONFIG = {
    GLOBE_RADIUS: 5,
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x0f172a,
        COASTLINE: 0x38bdf8
    },
    MAP_DATA_URL: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json',
    
    // ★追加: プレイヤーおよびライバル5社の定義
    // color: 地球に映えるソリッドカラー / altitudeOffset: 線が重なった際のZファイティング(チラつき)防止用段差
    COMPANIES: [
        { id: 'player', name: 'Player Airlines', color: 0x00e5ff, altitudeOffset: 0.000 },
        { id: 'rival_eu', name: 'Euro Wings', color: 0xff00ff, altitudeOffset: 0.001 },
        { id: 'rival_as', name: 'Asia Orient', color: 0xffd700, altitudeOffset: 0.002 },
        { id: 'rival_af', name: 'Africa Star', color: 0xff4500, altitudeOffset: 0.003 },
        { id: 'rival_am', name: 'Americas Air', color: 0x00fa9a, altitudeOffset: 0.004 },
        { id: 'rival_oc', name: 'Oceania Fly', color: 0x9370db, altitudeOffset: 0.005 }
    ]
};