"use strict";

/**
 * AirportManager クラス
 * 空港データの非同期読み込み、エラーハンドリング、データのサニタイズを管理します。
 */
class AirportManager {
    constructor() {
        this.airports = [];
        this.isLoaded = false;
        this.isLoading = false;
    }

    /**
     * 空港データを非同期で読み込むメインメソッド
     * @returns {Promise<Array>} 読み込まれた空港データの配列
     */
    async loadData() {
        if (this.isLoading) {
            throw new Error("現在データを読み込み中です。");
        }

        this.isLoading = true;
        this.isLoaded = false;

        try {
            console.log("データの取得を開始します...");
            
            // 実際の環境では fetch('api/airports') などを呼び出します
            const rawData = await this._mockFetchData();

            // 1. データ構造の検証
            if (!rawData || !Array.isArray(rawData)) {
                throw new TypeError("無効なデータ形式を受信しました。配列が必要です。");
            }

            // 2. データのサニタイズとマッピング（欠損値の補完など）
            this.airports = rawData.map(apt => {
                // 必須フィールドのチェック
                if (!apt.code) {
                    console.warn("コードが欠損している空港データをスキップしました:", apt);
                    return null;
                }

                return {
                    code: String(apt.code).trim().toUpperCase(),
                    name: apt.name ? String(apt.name).trim() : 'Unknown Airport',
                    city: apt.city ? String(apt.city).trim() : 'Unknown City',
                    runways: typeof apt.runways === 'number' && apt.runways >= 0 ? apt.runways : 0,
                    isActive: apt.isActive !== undefined ? Boolean(apt.isActive) : true
                };
            }).filter(apt => apt !== null); // null (無効なデータ) を除外

            this.isLoaded = true;
            console.log(`データの読み込みが完了しました。${this.airports.length}件の空港を登録しました。`);
            
            return this.airports;

        } catch (error) {
            console.error("データ読み込み処理で致命的なエラーが発生しました:", error);
            this.isLoaded = false;
            // 上位の呼び出し元（UI層など）にエラーを伝播させる
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 指定されたコードの空港を取得する
     * @param {string} code - 取得したい空港のIATAコード
     * @returns {Object|null} 空港オブジェクト、存在しないか未読み込みの場合はnull
     */
    getAirport(code) {
        if (!this.isLoaded) return null;
        return this.airports.find(a => a.code === code) || null;
    }

    /**
     * API通信をシミュレートするプライベートメソッド
     * @returns {Promise<Array>} 
     * @private
     */
    _mockFetchData() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 約10%の確率で通信エラーをシミュレート
                if (Math.random() < 0.1) {
                    reject(new Error("ネットワーク接続がタイムアウトしました。"));
                    return;
                }

                // モックデータ（一部意図的に欠損値を含める）
                const mockResponse = [
                    { code: "HND", name: "Tokyo Haneda", city: "Tokyo", runways: 4, isActive: true },
                    { code: "NRT", name: "Narita International", city: "Chiba", runways: 2, isActive: true },
                    { code: "KIX", name: "Kansai International", city: "Osaka", runways: 2, isActive: true },
                    { code: "ITM", name: "Osaka International (Itami)", city: "Osaka", runways: 2, isActive: true },
                    { code: "FUK", name: "Fukuoka", city: "Fukuoka", runways: 1, isActive: true },
                    { code: "CTS", name: "New Chitose", city: "Sapporo", runways: 2, isActive: true },
                    { code: "OKA", name: "Naha", city: "Naha", runways: 2, isActive: true },
                    // 意図的な不良データ
                    { code: "XYZ", name: "Test Airport", city: "Test City", runways: "invalid", isActive: false }, 
                    { name: "No Code Airport" } // codeがないデータ
                ];
                
                resolve(mockResponse);
            }, 1500); // 1.5秒の遅延
        });
    }
}

// プロジェクトのモジュールシステムに合わせて以下を使用してください
// export default AirportManager;
// module.exports = AirportManager;


