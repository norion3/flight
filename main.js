/**
 * AI可読性・先祖返り防止コメント:
 * 不要なログ出力を停止し、クリーンなエントリーポイントを維持しています。
 */

import { GameManager } from './GameManager.js';

window.onload = () => {
    try {
        const game = new GameManager();
        game.start();
    } catch(e) {
        console.error("[CRASH in main.js]", e);
    }
};


