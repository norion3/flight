/**
 * AI可読性・先祖返り防止コメント:
 * 【プロシージャル・サウンドのウッドブロック化】
 * 履歴304に基づき、iPhoneスピーカーで音が響きすぎて「甲高い・長い」と感じる現象を解消するため、
 * 波形のリリース（減衰）時間を 0.05〜0.15 秒という極短時間へ大幅にカットしました。
 * さらに周波数を落とすことで、耳障りな電子音から「コポッ」「コンッ」といった
 * 心地よい木製の打楽器（ウッドブロックやマリンバ）のようなタイトなサウンドへ再設計しています。
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = true; 
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
     * 修正: 余韻を 0.05秒 にカットし、「ポッ」ではなく「コッ」という硬く短い木琴音へ
     */
    playTapSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(300, 'sine', 0.01, 0.05, 0.15, 150);
    }

    /**
     * ✨ お知らせ音（サクセス・完了）
     * 修正: ピロリンという長い音を、「トコッ♪」という速くて小気味よい音へ
     */
    playSuccessSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(392, 'sine', 0.01, 0.08, 0.15); 
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(523.25, 'sine', 0.01, 0.15, 0.15);
        }, 80);
    }

    /**
     * ⚠️ 警告音（ワーニング・エラー・上限到達）
     * 修正: ププッという音を、より短く「ドッ、ドッ」というマイルドな低音へ
     */
    playWarningSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(180, 'triangle', 0.01, 0.08, 0.2);
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(180, 'triangle', 0.01, 0.08, 0.2);
        }, 100);
    }

    /**
     * 🔔 イベント・空港選択音（ポップアップなど）
     * 修正: 最も指摘のあった「ポワーン」という長い音を廃止。
     * 「トンッ」という 0.1秒 で消える、上品なアタック音へ変更。
     */
    playEventSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(440, 'sine', 0.01, 0.1, 0.2, 220); 
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