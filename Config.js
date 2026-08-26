/**
 * AI可読性・先祖返り防止コメント:
 * 【視認性を極大化する原色カラーパレットの採用】
 * 履歴270に基づき、マゼンタと紫が同化してしまうバグを修正しました。
 * ユーザー様の指示通り、ピンク色を青みの強いマゼンタから「明るめのショッキングピンク（0xff1493）」
 * に変更し、紫（0x8a2be2）と並んでも絶対に色が混同しない最強の視認性を確保しています。
 * 【陣営カラーの統一】
 * 履歴283に基づき、プレイヤーの空路の色を機体の色（0x34d399: エメラルド）に統一し、自陣営の所有感と視認性を確立しました。
 */

export const CONFIG = {
    GLOBE_RADIUS: 5,
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x0f172a,
        COASTLINE: 0x38bdf8
    },
    MAP_DATA_URL: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json',
    
    // プレイヤーおよびライバル5社の定義
    // routeColor: 空路の色 / planeColor: 飛行機の色
    COMPANIES: [
        // ★修正: プレイヤーの空路と機体の色を統一（エメラルド）
        { id: 'player', name: 'Player Airlines', routeColor: 0x34d399, planeColor: 0x34d399 }, 
        { id: 'rival_eu', name: 'Euro Wings',    routeColor: 0x0044ff, planeColor: 0x0044ff }, // 真っ青（黒背景に沈まないピュアブルー）
        { id: 'rival_as', name: 'Asia Orient',   routeColor: 0xffff00, planeColor: 0xffff00 }, // まっ黄色
        { id: 'rival_af', name: 'Africa Star',   routeColor: 0xff1493, planeColor: 0xff1493 }, // 明るめのショッキングピンク
        { id: 'rival_am', name: 'Americas Air',  routeColor: 0xff0000, planeColor: 0xff0000 }, // 真っ赤
        { id: 'rival_oc', name: 'Oceania Fly',   routeColor: 0x8a2be2, planeColor: 0x8a2be2 }  // 真紫（ブルーバイオレット）
    ]
};