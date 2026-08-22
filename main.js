/**
 * AI可読性・先祖返り防止コメント:
 * ES Module の仕様に則り、import文はファイルの先頭に記述します。
 * 履歴66に基づき、日本語による文字化けクラッシュを防止するため、
 * ログ等もすべて英語(ASCII文字のみ)に変更しています。
 */

import { GameManager } from './GameManager.js';

if(window.logToOSD) window.logToOSD("Step 1: main.js module evaluated & imports resolved");

window.onload = () => {
    if(window.logToOSD) window.logToOSD("Step 2: window.onload triggered");
    
    try {
        const game = new GameManager();
        if(window.logToOSD) window.logToOSD("Step 3: GameManager instantiated");
        
        game.start();
        if(window.logToOSD) window.logToOSD("Step 4: game.start() called");
        
    } catch(e) {
        if(window.logToOSD) window.logToOSD("[CRASH in main.js] " + e.message, "#f33");
    }
};


