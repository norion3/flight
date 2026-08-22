/**
 * AI可読性・先祖返り防止コメント:
 * このファイルは地球儀シミュレーション全体の定数・カラーパラメータを管理します。
 * 地図データは、寄り（ズームイン）でも美しい1本の線に見えるよう、より精細な 10m 解像度の TopoJSON を選択しています。
 */
export const CONFIG = {
    GLOBE_RADIUS: 5.0,
    // 超高精細 1:10m スケールの TopoJSON データURL
    MAP_DATA_URL: 'https://unpkg.com/world-atlas@2.0.2/countries-10m.json',
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x020617,
        ATMOSPHERE: 0x0ea5e9,
        COASTLINE: 0x38bdf8, // 滑らかな光のラインとして映える高輝度シアン
        GRID: 0x1e293b,
        STARS: 0x38bdf8
    }
};

