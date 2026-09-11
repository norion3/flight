/**
 * AI可読性・先祖返り防止コメント:
 * 【イベント発生時「ピロリン♪」チャイム音の新設 ＆ 画面復帰時・音量ボタントグル時の音声エンジン自動再開】
 * 1. イベント発生を上品に知らせる3音上昇アルペジオの澄んだ通知音 `playNoticeSound` を保持。
 * 2. 既存のタップ音、サクセス音、警告音、イベントポップ音のタイトなウッドブロック特性は完全に保持しています。
 * 3. 【画面復帰時自動再開】別画面・別アプリから復帰した際の AudioContext 中断（suspended/interrupted）を検知し自動 resume 復帰。
 * 4. 【音量ボタントグル復帰】toggleMute 実行時に無条件で _initContext を呼び、消音解除・ボタン操作での元栓再起動を保証。
 * 
 * 【ゲームバランス改善 Phase 4: Web Audio API 合成花火音響エンジン新設】
 * 5. 外部mp3ファイル不要の内蔵シンセシスによる `playFireworkSound()` を新設。
 *    打上笛音（ヒュルルル…）➔ 重低音衝撃波（ドォォォン！）➔ 光球破裂ノイズ（パラパラ…）を完全動的合成。
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

    /**
     * 🎆 ★Phase 4新設: Web Audio API 合成花火音響エンジン
     * 1. 打ち上げ上昇笛音（400Hz ➔ 1400Hz）
     * 2. 重低音爆発衝撃波（低周波バースト 80Hz ➔ 30Hz ＋ ピンクノイズ）
     * 3. 時間差クラックル破裂音（パラパラ…）
     */
    playFireworkSound(isMajor = true) {
        if (this.isMuted) return;
        this._initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. 打ち上げ笛音（ヒュルルル…）
        try {
            const whistleOsc = this.ctx.createOscillator();
            const whistleGain = this.ctx.createGain();
            whistleOsc.type = 'sine';
            whistleOsc.frequency.setValueAtTime(420, now);
            whistleOsc.frequency.exponentialRampToValueAtTime(1300, now + 0.35);

            whistleGain.gain.setValueAtTime(0.01, now);
            whistleGain.gain.linearRampToValueAtTime(isMajor ? 0.15 : 0.08, now + 0.20);
            whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            whistleOsc.connect(whistleGain);
            whistleGain.connect(this.ctx.destination);
            whistleOsc.start(now);
            whistleOsc.stop(now + 0.40);
        } catch (e) {}

        // 2. 破裂・重低音衝撃波（ドォォォン！）
        const boomTime = now + 0.32;
        try {
            // 重低音サブベース
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(isMajor ? 95 : 120, boomTime);
            subOsc.frequency.exponentialRampToValueAtTime(28, boomTime + (isMajor ? 0.9 : 0.6));

            subGain.gain.setValueAtTime(isMajor ? 0.35 : 0.22, boomTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, boomTime + (isMajor ? 1.1 : 0.7));

            subOsc.connect(subGain);
            subGain.connect(this.ctx.destination);
            subOsc.start(boomTime);
            subOsc.stop(boomTime + (isMajor ? 1.15 : 0.75));

            // ノイズ破裂音（バースト）
            const bufferSize = Math.floor(this.ctx.sampleRate * (isMajor ? 0.8 : 0.5));
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, boomTime);
            filter.frequency.exponentialRampToValueAtTime(100, boomTime + 0.6);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(isMajor ? 0.30 : 0.18, boomTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, boomTime + (isMajor ? 0.8 : 0.5));

            whiteNoise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            whiteNoise.start(boomTime);
            whiteNoise.stop(boomTime + (isMajor ? 0.85 : 0.55));
        } catch (e) {}

        // 3. 余韻の光球パチパチ音（パラパラ…）
        if (isMajor) {
            for (let k = 0; k < 4; k++) {
                const crackleDelay = 0.55 + Math.random() * 0.45;
                setTimeout(() => {
                    if (this.isMuted || !this.ctx) return;
                    this._playTone(1600 + Math.random() * 600, 'sine', 0.005, 0.04, 0.05, 400);
                }, crackleDelay * 1000);
            }
        }
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