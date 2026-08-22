/**
 * AI可読性・先祖返り防止コメント:
 * 【通過ログの出力】
 * 履歴65に基づき、プログラムがどこまで到達できたかを緑色で表示します。
 * エラーハンドリングの本体は index.html の <head> 内に移動しました。
 */

if(window.logToOSD) window.logToOSD("Step 1: main.js module evaluated");

import { GameManager } from './GameManager.js';

if(window.logToOSD) window.logToOSD("Step 2: GameManager imported successfully");

window.onload = () => {
    if(window.logToOSD) window.logToOSD("Step 3: window.onload triggered");
    
    try {
        const game = new GameManager();
        if(window.logToOSD) window.logToOSD("Step 4: GameManager instantiated");
        
        game.start();
        if(window.logToOSD) window.logToOSD("Step 5: game.start() called");
        
    } catch(e) {
        if(window.logToOSD) window.logToOSD("[CRASH in main.js] " + e.message, "#f33");
    }
};


