/**
 * QRセーブ・ロードマネージャー（簡易テスト版 ➔ Step 4 完全版 ➔ 高精細シンプル化版 ➔ v6 エラーガード強化版）
 * LZStringによる極小圧縮と、QRious/jsQRライブラリを仲介して画像との相互変換を行う
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
                
                // ★大面積・高精細化（400x400px）: ドット潰れを根絶
                const qrSize = 400;
                const qr = new window.QRious({
                    value: compressed,
                    size: qrSize,
                    level: 'M'
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

                // ★極限シンプル・高精細カード（480x540px）
                const cardWidth = 480;
                const cardHeight = 540;

                const canvas = document.createElement('canvas');
                canvas.width = cardWidth;
                canvas.height = cardHeight;
                const ctx = canvas.getContext('2d');

                // 1. 背景（純白）
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, cardWidth, cardHeight);

                // 2. 上部: 小型・控えめな見出し（QR認識を阻害しないサイズ）
                ctx.fillStyle = '#334155'; // 控えめな濃紺
                ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(metaInfo.yearTitle || '【 セーブデータ 】', cardWidth / 2, 35);

                // 3. 中央: 高精細QRコードの描画（四方に広大な白余白クワイエットゾーンを確保）
                const qrX = (cardWidth - qrSize) / 2; // (480 - 400) / 2 = 40px
                const qrY = 65;
                ctx.drawImage(qr.canvas, qrX, qrY, qrSize, qrSize);

                // 4. 下部ステータス表示は完全削除（白余白として開放し、jsQRの境界誤検出を100%防止）

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
                        const code = window.jsQR(imageData.data, imageData.width, imageData.height);

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