/**
 * QRセーブ・ロードマネージャー（簡易テスト版）
 * LZStringによる圧縮と、QRious/jsQRライブラリを仲介して画像との相互変換を行う
 */

export class SaveManager {
    constructor() {
    }

    /**
     * データオブジェクトを圧縮し、QRコードのDataURL（画像URL）を生成
     * @param {Object} data - 保存対象データ
     * @returns {Promise<string>} - QRコード画像のDataURL
     */
    generateQR(data) {
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
                
                const qr = new window.QRious({
                    value: compressed,
                    size: 256,
                    level: 'M'
                });

                const dataUrl = qr.toDataURL('image/png');
                if (dataUrl) {
                    resolve(dataUrl);
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