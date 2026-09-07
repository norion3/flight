/**
 * AI可読性・先祖返り防止コメント:
 * 【イベント発生時「ピロリン♪」チャイム音の新設 ＆ 画面復帰時・音量ボタントグル時の音声エンジン自動再開】
 * 1. イベント発生を上品に知らせる3音上昇アルペジオの澄んだ通知音 `playNoticeSound` を保持。
 * 2. 既存のタップ音、サクセス音、警告音、イベントポップ音のタイトなウッドブロック特性は完全に保持しています。
 * 3. 【画面復帰時自動再開】別画面・別アプリから復帰した際の AudioContext 中断（suspended/interrupted）を検知し自動 resume 復帰。
 * 4. 【音量ボタントグル復帰】toggleMute 実行時に無条件で _initContext を呼び、消音解除・ボタン操作での元栓再起動を保証。
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = true; 
        this._bindLifecycleEvents();
    }

    _bindLifecycleEvents() {
        const resumeAudio = () => {
            if (this.ctx && this.ctx.state !== 'running') {
                this.ctx.resume().catch(() => {});
            }
        };

        // 画面復帰（別タブ・別アプリから戻った瞬間）の検知
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                resumeAudio();
            }
        });
        window.addEventListener('focus', resumeAudio);

        // 画面復帰後のユーザー操作コンテキストでの再開セーフガード
        window.addEventListener('pointerdown', resumeAudio, { passive: true });
        window.addEventListener('touchstart', resumeAudio, { passive: true });
    }

    _initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state !== 'running') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this._initContext();
        if (!this.isMuted) {
            this.playTapSound(); 
        }
        return this.isMuted;
    }

    /**
     * 👆 基本操作音（ボタンタップ）
     * 余韻を 0.05秒 にカットした硬く短い木琴音
     */
    playTapSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(300, 'sine', 0.01, 0.05, 0.15, 150);
    }

    /**
     * ✨ お知らせ音（サクセス・完了）
     * 「トコッ♪」という速くて小気味よい音
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
     * 短く「ドッ、ドッ」というマイルドな低音
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
     * ⚠️ エラー・無効操作音
     * 既存の警告音（playWarningSound）と完全に統一
     */
    playErrorSound() {
        this.playWarningSound();
    }

    /**
     * 🔔 イベント・空港選択音（ポップアップなど）
     * 「トンッ」という 0.1秒 で消える上品なアタック音
     */
    playEventSound() {
        if (this.isMuted) return;
        this._initContext();
        this._playTone(440, 'sine', 0.01, 0.1, 0.2, 220); 
    }

    /**
     * 📢 ★新設: ランダムイベント発生時の「ピロリン♪」チャイム音
     * 澄んだベル音による 3音上昇アルペジオ（ソ ➔ ド ➔ ミ）
     */
    playNoticeSound() {
        if (this.isMuted) return;
        this._initContext();
        
        // 1音目: G5 (784Hz)
        this._playTone(784.0, 'sine', 0.01, 0.12, 0.18);
        
        // 2音目: C6 (1046.5Hz)
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(1046.5, 'sine', 0.01, 0.14, 0.18);
        }, 70);

        // 3音目: E6 (1318.5Hz)
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(1318.5, 'sine', 0.01, 0.22, 0.22);
        }, 140);
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