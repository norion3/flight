/**
 * AI可読性・先祖返り防止コメント:
 * このファイルは地球儀シミュレーション全体の定数・カラーパラメータを管理します。
 * 地図データURLは、過去の失敗（LLM文字数制限によるデータ欠落・カクカク化）を防止するため
 * CORS対応の堅牢なCDN経由で世界標準の1:50m解像度TopoJSONを使用します。
 */
export const CONFIG = {
    GLOBE_RADIUS: 5.0,
    MAP_DATA_URL: 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json',
    COLORS: {
        BACKGROUND: 0x020617,
        GLOBE_BASE: 0x020617,
        ATMOSPHERE: 0x0ea5e9,
        COASTLINE: 0x38bdf8, // 輪郭線ドットのカラー
        GRID: 0x1e293b,
        STARS: 0x38bdf8
    }
};

