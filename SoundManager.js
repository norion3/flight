/**
 * AI可読性・先祖返り防止コメント:
 * 【プロシージャル・サウンドシステム】
 * 履歴303に基づき、スマートフォンのスピーカーで耳障りになる高周波を排除しました。
 * 880Hzなどの甲高い音をやめ、全体的に300〜400Hz付近のマイルドな音（マリンバや水滴のような響き）
 * へと周波数を引き下げることで、長時間のプレイでも心地よいアンビエント・サウンドを実現しています。
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = true; // ユーザー配慮: デフォルトはミュート
    }

    _initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.isMuted) {
            this._initContext();
            this.playTapSound(); 
        }
        return this.isMuted;
    }

    /**
     * 👆 基本操作音（ボタンタップ）
     * 修正: 400Hzから200Hzへ素早く落ちる、より低く丸みのある水滴音
     */
    playTapSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(400, 'sine', 0.02, 0.08, 0.15, 200);
    }

    /**
     * ✨ お知らせ音（サクセス・完了）
     * 修正: C4(261.6Hz) -> E4(329.6Hz) へ1オクターブ下げ、落ち着いた響きに
     */
    playSuccessSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(261.63, 'sine', 0.05, 0.15, 0.2); 
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(329.63, 'sine', 0.05, 0.25, 0.2);
        }, 120);
    }

    /**
     * ⚠️ 警告音（ワーニング・エラー・上限到達）
     * 修正: 180Hz程度の低めの三角波で、よりマイルドな「ププッ」という音に
     */
    playWarningSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(180, 'triangle', 0.03, 0.1, 0.2);
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(180, 'triangle', 0.03, 0.1, 0.2);
        }, 120);
    }

    /**
     * 🔔 イベント発生音（ポップアップなど）
     * 修正: 880Hzから440Hzへ半減させ、耳に刺さらない柔らかなベル音に
     */
    playEventSound() {
        if (this.isMuted) return;
        this._initContext();
        // A4 (ラ) 440Hz に 880Hz の倍音を乗せて透明感を出す
        this._playTone(440, 'sine', 0.05, 0.6, 0.25);
        this._playTone(880, 'sine', 0.05, 0.4, 0.05); 
    }

    _playTone(freq, type, attack, release, maxVol, endFreq = null) {
        if (!this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            if (endFreq) {
                osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + attack + release);
            }
            
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(maxVol, this.ctx.currentTime + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + attack + release);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + attack + release);
        } catch (e) {
            console.error("Audio generation error", e);
        }
    }
}