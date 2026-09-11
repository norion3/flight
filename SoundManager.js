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
 * 
 * 【花火音響の自然化・リアル大気反響エンジン刷新】
 * 6. 打ち上げ気流音（サイン波昇り笛から、バンドパスノイズによるリアルな空気摩擦昇り気流音「シュルルル…」へ刷新）。
 * 7. 炸裂音（鋭い衝撃波パルス＋地響きのような超低周波大気反響ランブル音「ズゥゥン…」を動的合成）。
 * 8. 破裂後の星屑パチパチ爆ぜ音（インパルスノイズによる乾いた「パラパラ…」音）を多重合成。
 * 9. 小玉・中玉・特大玉の規模別音響差別化（引数 isMajor に応じた音圧・周波数・余韻制御）。
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
     * 🎆 ★刷新: Web Audio API 自然花火音響エンジン
     * 1. 昇り気流音: ホワイトノイズ＋バンドパスフィルターによる空気摩擦音「シュルルル…」
     * 2. 炸裂＆大気反響: 耳元を突く衝撃波アタック ＋ 超低周波大気反響ランブル「ズゥゥン…」
     * 3. 星屑爆ぜ音: 微小インパルスノイズによるリアルな乾いた音「パラパラパラ…」
     */
    playFireworkSound(isMajor = true) {
        if (this.isMuted) return;
        this._initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. 昇空気流摩擦音（電子音ではなく、風切りホワイトノイズの周波数スイープ）
        try {
            const bufferDuration = 0.40;
            const bufferSize = Math.floor(this.ctx.sampleRate * bufferDuration);
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const out = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                out[i] = Math.random() * 2 - 1;
            }

            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.setValueAtTime(4.0, now);
            bandpass.frequency.setValueAtTime(380, now);
            bandpass.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(isMajor ? 0.14 : 0.08, now + 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            noiseSource.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(this.ctx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.40);
        } catch (e) {}

        // 2. 炸裂＆大気反響ランブル（ズゥゥン…ゴォォォ）
        const boomTime = now + 0.32;
        try {
            // ① 超低周波サブベース・大気反響（65Hz ➔ 22Hz）
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(isMajor ? 75 : 95, boomTime);
            subOsc.frequency.exponentialRampToValueAtTime(22, boomTime + (isMajor ? 1.2 : 0.7));

            subGain.gain.setValueAtTime(isMajor ? 0.42 : 0.25, boomTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, boomTime + (isMajor ? 1.4 : 0.8));

            subOsc.connect(subGain);
            subGain.connect(this.ctx.destination);
            subOsc.start(boomTime);
            subOsc.stop(boomTime + (isMajor ? 1.45 : 0.85));

            // ② 鋭い衝撃波ノイズ破裂音
            const noiseDuration = isMajor ? 1.0 : 0.6;
            const burstSize = Math.floor(this.ctx.sampleRate * noiseDuration);
            const burstBuffer = this.ctx.createBuffer(1, burstSize, this.ctx.sampleRate);
            const bOut = burstBuffer.getChannelData(0);
            for (let i = 0; i < burstSize; i++) {
                // 指数減衰させたインパルスノイズ
                bOut[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
            }

            const burstSource = this.ctx.createBufferSource();
            burstSource.buffer = burstBuffer;

            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(550, boomTime);
            lowpass.frequency.exponentialRampToValueAtTime(80, boomTime + (isMajor ? 0.9 : 0.5));

            const burstGain = this.ctx.createGain();
            burstGain.gain.setValueAtTime(isMajor ? 0.38 : 0.22, boomTime);
            burstGain.gain.exponentialRampToValueAtTime(0.001, boomTime + noiseDuration);

            burstSource.connect(lowpass);
            lowpass.connect(burstGain);
            burstGain.connect(this.ctx.destination);

            burstSource.start(boomTime);
            burstSource.stop(boomTime + noiseDuration);
        } catch (e) {}

        // 3. 星屑のパチパチ爆ぜ音（リアルな乾いた火薬クラックルノイズ）
        const crackleCount = isMajor ? 6 : 3;
        for (let k = 0; k < crackleCount; k++) {
            const crackleDelay = 0.50 + Math.random() * (isMajor ? 0.70 : 0.45);
            setTimeout(() => {
                if (this.isMuted || !this.ctx) return;
                try {
                    const cNow = this.ctx.currentTime;
                    const cLen = Math.floor(this.ctx.sampleRate * 0.03);
                    const cBuf = this.ctx.createBuffer(1, cLen, this.ctx.sampleRate);
                    const cData = cBuf.getChannelData(0);
                    for (let j = 0; j < cLen; j++) {
                        cData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (this.ctx.sampleRate * 0.006));
                    }
                    const cSource = this.ctx.createBufferSource();
                    cSource.buffer = cBuf;

                    const cFilter = this.ctx.createBiquadFilter();
                    cFilter.type = 'highpass';
                    cFilter.frequency.setValueAtTime(1400 + Math.random() * 600, cNow);

                    const cGain = this.ctx.createGain();
                    cGain.gain.setValueAtTime(isMajor ? 0.08 : 0.04, cNow);
                    cGain.gain.exponentialRampToValueAtTime(0.001, cNow + 0.03);

                    cSource.connect(cFilter);
                    cFilter.connect(cGain);
                    cGain.connect(this.ctx.destination);

                    cSource.start(cNow);
                    cSource.stop(cNow + 0.035);
                } catch (err) {}
            }, crackleDelay * 1000);
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