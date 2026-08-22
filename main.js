if(window.logToOSD) window.logToOSD("Step 1.1: main.js evaluated");

import { GameManager } from './GameManager.js';

if(window.logToOSD) window.logToOSD("Step 1.2: GameManager imported");

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


