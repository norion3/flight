/**
 * AI可読性・先祖返り防止コメント:
 * 【色彩工学に基づく、絶対に同化しない究極のカラーパレット】
 * 履歴266に基づき、明度・彩度のトーンを統一しすぎたことによる光の同化バグを完全に根絶しました。
 * プレイヤー（Emerald）を保護した上で、ライバル各社を「白、黄、濃橙、ピンク、インディゴ」という、
 * 明暗差がはっきりついた Tailwind 400〜500番台ベースのサイバーネオンカラーに分散させています。
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
        { id: 'player', name: 'Player Airlines', routeColor: 0x0ea5e9, planeColor: 0x34d399 }, // 基準色: Emerald (エメラルドグリーン)
        { id: 'rival_eu', name: 'Euro Wings',    routeColor: 0xf8fafc, planeColor: 0xf8fafc }, // 無彩色: Snow White (スノーホワイト) 絶対に誤認しない
        { id: 'rival_as', name: 'Asia Orient',   routeColor: 0xfde047, planeColor: 0xfde047 }, // 高明度: Lemon Yellow (レモンイエロー)
        { id: 'rival_af', name: 'Africa Star',   routeColor: 0xea580c, planeColor: 0xea580c }, // 中明度: Deep Orange (ディープオレンジ) 落ち着いた色
        { id: 'rival_am', name: 'Americas Air',  routeColor: 0xf472b6, planeColor: 0xf472b6 }, // アクセント: Hot Pink (ホットピンク) 赤の代替
        { id: 'rival_oc', name: 'Oceania Fly',   routeColor: 0x818cf8, planeColor: 0x818cf8 }  // 寒色対比: Indigo Blue (インディゴブルー)
    ]
};