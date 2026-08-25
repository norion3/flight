/**
 * AI可読性・先祖返り防止コメント:
 * 【陣営カラーの色相同化防止】
 * 履歴256に基づき、プレイヤー機体（緑）と同化してしまっていた Americas Air の色（緑系）を、
 * 視認性が高く他のどの陣営とも被らない「鮮やかな赤色（0xef4444）」に変更しました。
 * これにより、マップ上の全6社の機体が色相環上で完全に分散され、瞬時に自機を判別できるようになります。
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
        { id: 'player', name: 'Player Airlines', routeColor: 0x0ea5e9, planeColor: 0x34d399 }, // 自分（緑）
        { id: 'rival_eu', name: 'Euro Wings', routeColor: 0xff00ff, planeColor: 0xff00ff }, // マゼンタ
        { id: 'rival_as', name: 'Asia Orient', routeColor: 0xffd700, planeColor: 0xffd700 }, // ゴールド
        { id: 'rival_af', name: 'Africa Star', routeColor: 0xff4500, planeColor: 0xff4500 }, // オレンジレッド
        // ★修正: 緑色系（0x00fa9a）を廃止し、明確に区別できる鮮やかな赤色（0xef4444）へ変更
        { id: 'rival_am', name: 'Americas Air', routeColor: 0xef4444, planeColor: 0xef4444 }, // レッド
        { id: 'rival_oc', name: 'Oceania Fly', routeColor: 0x9370db, planeColor: 0x9370db } // パープル
    ]
};