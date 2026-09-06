/**
 * QRセーブ・ロードマネージャー（簡易テスト版）
 * LZStringによる圧縮と、QRious/jsQRライブラリを仲介して画像との相互変換を行う
 */

export class SaveManager {
    constructor() {
    }

    /**
     * データオブジェクトを圧縮し、進行度・ステータス情報を焼き込んだQRコードカード画像のDataURLを生成
     * @param {Object} data - 保存対象データ
     * @param {Object} [metaInfo] - 画像内に印字するメタ情報 { yearTitle, statusText, timeText }
     * @returns {Promise<string>} - 合成されたカード画像のDataURL
     */
    generateQR(data, metaInfo = null) {
        // ★修正: iPhoneおよびGRAVITY環境に特化したQRious（cdnjs版）による同期型DataURL生成
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
                
                const qrSize = 240;
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

                // ★提案仕様: ロゴを排除し、進行度・資金・機体数・発行日時を焼き込んだ白地カード画像を合成
                const cardWidth = 320;
                const cardHeight = 400;

                const canvas = document.createElement('canvas');
                canvas.width = cardWidth;
                canvas.height = cardHeight;
                const ctx = canvas.getContext('2d');

                // 1. 背景（純白）
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, cardWidth, cardHeight);

                // 2. 上部: 進行度の大見出し（例: 【 1年目 - 6月 】）
                ctx.textAlign = 'center';
                ctx.fillStyle = '#0f172a'; // 濃紺・ダークスレート
                ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(metaInfo.yearTitle || '【 セーブデータ 】', cardWidth / 2, 42);

                // 3. 中央: QRコードの描画（240x240、余白を十分確保）
                const qrX = (cardWidth - qrSize) / 2;
                const qrY = 62;
                ctx.drawImage(qr.image, qrX, qrY, qrSize, qrSize);

                // 4. 下部 1行目: 当時のステータス（資金・機体数）
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(metaInfo.statusText || '', cardWidth / 2, 335);

                // 5. 下部 2行目: 発行実日時タイムスタンプ
                ctx.fillStyle = '#64748b'; // 落ち着いたスレートグレー
                ctx.font = 'normal 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(metaInfo.timeText || '', cardWidth / 2, 362);

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
                        if (!decompressed) {
                            decompressed = code.data;
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