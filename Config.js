/**
 * AI可読性・先祖返り防止コメント:
 * 【色彩工学に基づく、混戦時の視認性向上パレット】
 * 履歴262に基づき、暗い背景（ネイビー）で類似色（オレンジと赤等）が同化するバグを根絶しました。
 * プレイヤーの緑色を絶対保護した上で、ライバル各社を Tailwind CSS の 400〜500番台（パステルネオン調）
 * の色に統一し、「黄、みかん色、ローズレッド、インディゴ、紫」へと色相環上で均等に分散させました。
 * これにより、機体が密集しても絶対に誤認しない、美しく視認性の高いサイバー空間が実現します。
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
    // ★修正: トーン＆マナーを統一し、絶対に同化しない6つの色相へ分散再配置
    COMPANIES: [
        { id: 'player', name: 'Player Airlines', routeColor: 0x0ea5e9, planeColor: 0x34d399 }, // 自分（Emerald: 青緑）維持
        { id: 'rival_eu', name: 'Euro Wings',    routeColor: 0x818cf8, planeColor: 0x818cf8 }, // Indigo（青紫/藤色）: 原色マゼンタから変更
        { id: 'rival_as', name: 'Asia Orient',   routeColor: 0xfacc15, planeColor: 0xfacc15 }, // Yellow（ピュアな黄色）: 暗いゴールドから変更
        { id: 'rival_af', name: 'Africa Star',   routeColor: 0xfb923c, planeColor: 0xfb923c }, // Orange（みかん色）: 赤寄りのオレンジから変更
        { id: 'rival_am', name: 'Americas Air',  routeColor: 0xf43f5e, planeColor: 0xf43f5e }, // Rose（ローズレッド）: オレンジと同化する赤から変更
        { id: 'rival_oc', name: 'Oceania Fly',   routeColor: 0xc084fc, planeColor: 0xc084fc }  // Purple（ネオンパープル）: 暗い紫から変更
    ]
};