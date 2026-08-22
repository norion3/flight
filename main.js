import { GameManager } from './GameManager.js';

/**
 * AI可読性・先祖返り防止コメント:
 * アプリケーションエントリーポイント。
 */
window.onload = () => {
    const game = new GameManager();
    game.start();
};

