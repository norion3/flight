/**
 * QRセーブ・ロードマネージャー（簡易テスト版 ➔ Step 4 完全版 ➔ 高精細シンプル化版 ➔ v6 エラーガード強化版）
 * LZStringによる極小圧縮と、QRious/jsQRライブラリを仲介して画像との相互変換を行う
 * 
 * 【QRコード認識率100%保護 ＆ サムネイル高視認性デザイン刷新】
 * 1. QRコード本体の解像度（640x640px）および周囲40pxの純白クワイエットゾーンを100%完全保持。
 * 2. カード縦幅を 720x920px に拡張し、写真一覧サムネイルでも即座に識別できるよう
 *    上部ヘッダーにタイトル「✈️ SimAirline」、実年月日・時刻、ゲーム期数を高コントラスト印字。
 * 3. 下部フッターに所持資金・保有机体数を明瞭に配置。
 * 
 * 【品質安定化 Step 1: QRコード上部クワイエットゾーンの均等40px白余白確保】
 * 4. ヘッダー案内文とQRコード上端との間隔を再調整し、上下左右すべてに40px以上の純白クワイエットゾーンを均等確保。
 */

export class SaveManager {
    constructor() {
    }

    /**
     * データオブジェクトを圧縮し、高精細（Retina対応）かつシンプルなQRコードカード画像のDataURLを生成
     * @param {Object} data - 保存対象データ
     * @param {Object} [metaInfo] - 画像内に印字するメタ情報 { yearTitle, statusText, timeText }
     * @returns {Promise<string>} - 合成されたカード画像のDataURL
     */
    generateQR(data, metaInfo = null) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof window.QRious === 'undefined') {
                    return reject(new Error('QRiousライブラリが見つかりません'));
                }
                if (typeof window.LZString === 'undefined') {
                    return reject(new Error('LZStringライブラリが見つかりません'));
                }

                const jsonStr = JSON.stringify(data);
                // URLセーフな形式で極小圧縮
                const compressed = window.LZString.compressToEncodedURIComponent(jsonStr);
                
                // ★大面積・高精細化（640x640px）＆ 誤り訂正level: 'L'（ドット粗大化・認識率劇的向上）
                const qrSize = 640;
                const qr = new window.QRious({
                    value: compressed,
                    size: qrSize,
                    level: 'L'
                });

                // メタ情報がない場合は純粋なQR画像を出力
                if (!metaInfo) {
                    const dataUrl = qr.toDataURL('image/png');
                    if (dataUrl) {
                        return resolve(dataUrl);
                    } else {
                        return reject(new Error('QR画像の生成に失敗しました'));
                    }
                }

                // ★極限シンプル・超高精細カード（720x920px 縦長拡張設計）
                const cardWidth = 720;
                const cardHeight = 920;

                const canvas = document.createElement('canvas');
                canvas.width = cardWidth;
                canvas.height = cardHeight;
                const ctx = canvas.getContext('2d');

                // 1. 背景（純白）
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, cardWidth, cardHeight);

                // 2. 上部ヘッダー（写真サムネイル対応高コントラスト印字）
                // アイキャッチ帯
                ctx.fillStyle = '#0f172a'; // 濃紺
                ctx.fillRect(0, 0, cardWidth, 52);

                ctx.fillStyle = '#38bdf8'; // シアン
                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✈️ SimAirline', cardWidth / 2, 26);

                // 発行実日時 ＆ ゲーム期数（サムネイルで即座に読めるサイズ）
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                const headerInfo = (metaInfo.timeText || '') + '   ' + (metaInfo.yearTitle || '');
                ctx.fillText(headerInfo.trim() || '【 OFFICIAL FLIGHT SAVE 】', cardWidth / 2, 85);

                ctx.fillStyle = '#64748b';
                ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText('QRコードの周囲に十分な余白を確保して保存されています', cardWidth / 2, 114);

                // 3. 中央: 高精細QRコードの描画（四方に広大な白余白クワイエットゾーンを確保）
                const qrX = (cardWidth - qrSize) / 2; // (720 - 640) / 2 = 40px
                const qrY = 165; // ★165pxに設定し、案内テキスト下端(121px)との間に44pxの純白余白を確保
                ctx.drawImage(qr.canvas, qrX, qrY, qrSize, qrSize);

                // 4. 下部フッター: 資産状況表示
                if (metaInfo.statusText) {
                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.fillText(metaInfo.statusText, cardWidth / 2, 855); // ★QR下端(805px)との間に50pxの純白余白を確保
                }

                ctx.fillStyle = '#94a3b8';
                ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText('※写真アプリからこの画像を読み込むことで、いつでも続きから再開できます', cardWidth / 2, 890);

                const finalDataUrl = canvas.toDataURL('image/png');
                if (finalDataUrl) {
                    resolve(finalDataUrl);
                } else {
                    reject(new Error('QR画像の生成に失敗しました'));
                }
            } catch (err) {
                console.error('[SaveManager] Failed to generate QR:', err);
                reject(err);
            }
        });
    }

    /**
     * 端末の写真/画像ファイルからQRコードを解析・解凍してデータを復元
     * @param {File} file - ユーザーが選択した画像ファイル
     * @returns {Promise<Object>} - 復元されたデータオブジェクト
     */
    readQRFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('No file provided'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        if (typeof window.jsQR === 'undefined') {
                            return reject(new Error('jsQRライブラリが見つかりません'));
                        }
                        if (typeof window.LZString === 'undefined') {
                            return reject(new Error('LZStringライブラリが見つかりません'));
                        }

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        
                        // 1回目：標準画像解析
                        let code = window.jsQR(imageData.data, imageData.width, imageData.height);

                        // ★二重コントラスト（二値化前処理）: 認識失敗時に白黒二値化ハイコントラスト処理を実施して再試行
                        if (!code || !code.data) {
                            const d = imageData.data;
                            for (let i = 0; i < d.length; i += 4) {
                                const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
                                const bin = gray > 128 ? 255 : 0;
                                d[i] = bin;
                                d[i + 1] = bin;
                                d[i + 2] = bin;
                            }
                            code = window.jsQR(d, imageData.width, imageData.height);
                        }

                        if (!code || !code.data) {
                            return reject(new Error('画像からQRコードが見つかりません'));
                        }

                        let decompressed = window.LZString.decompressFromEncodedURIComponent(code.data);
                        // ★エラーガード強化: 解凍に失敗した場合は圧縮文字列をそのまま渡さず、明確に拒否して横長赤帯エラーを防止
                        if (!decompressed) {
                            return reject(new Error('セーブデータの解凍に失敗しました（QRコードが不鮮明です）'));
                        }
                        const parsedData = JSON.parse(decompressed);
                        resolve(parsedData);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsDataURL(file);
        });
    }
}