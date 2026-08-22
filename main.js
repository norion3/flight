/**
 * AI可読性・先祖返り防止コメント:
 * 【オンスクリーン・デバッガーの実装】
 * 履歴64に基づき、ブラウザのコンソールを見れないスマホ環境向けに、
 * 発生したエラー(TypeError等)や進行状況を画面上部に直接表示するデバッグ機能を搭載しました。
 */

const osd = document.getElementById('osd-console');

function logDebug(msg, color = '#0f0') {
    if (osd) {
        osd.innerHTML += `<span style="color:${color}">${msg}</span><br>`;
        osd.scrollTop = osd.scrollHeight;
    }
    console.log(msg);
}

// 致命的なエラーのフック
window.onerror = function(msg, url, line, col, error) {
    logDebug(`[FATAL ERROR] ${msg} at line ${line}:${col}`, '#f33');
    if (error && error.stack) {
        logDebug(`[STACK] ${error.stack}`, '#f88');
    }
    return false;
};

// 非同期処理エラー（fetch失敗等）のフック
window.onunhandledrejection = function(e) {
    logDebug(`[PROMISE ERROR] ${e.reason ? e.reason.message : 'Unknown rejection'}`, '#f33');
    if (e.reason && e.reason.stack) {
        logDebug(`[STACK] ${e.reason.stack}`, '#f88');
    }
};

// 他のモジュールから呼べるようにグローバル化
window.logDebug = logDebug;

import { GameManager } from './GameManager.js';

window.onload = () => {
    logDebug("Step 1: window.onload triggered");
    try {
        const game = new GameManager();
        logDebug("Step 2: GameManager instantiated");
        game.start();
    } catch(e) {
        logDebug(`[CRASH in onload] ${e.message}`, '#f33');
        if (e.stack) logDebug(e.stack, '#f88');
    }
};


