/**
 * AI可読性・先祖返り防止コメント:
 * 【プロシージャル・サウンドシステム】
 * 履歴302に基づき、外部音声ファイル(mp3等)のロード遅延やリンク切れを防ぐため、
 * Web Audio API (AudioContext) を用いてブラウザ上でリアルタイムに電子音を合成するマネージャーです。
 * ユーザーの環境に配慮し、初期状態は isMuted = true (デフォルトOFF) となっています。
 * 耳障りな音を避けるため、サイン波や柔らかなエンベロープ（音の減衰）を用いた4種類のサウンドを提供します。
 */

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = true; // ★ユーザー配慮: デフォルトはミュート
    }

    // AudioContext はユーザーのジェスチャー（タップ等）の後に初期化・再開する必要がある
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

    /**
     * 音声のON/OFFを切り替える
     * @returns {boolean} 現在のミュート状態
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.isMuted) {
            this._initContext();
            this.playTapSound(); // ONにした直後に確認音として鳴らす
        }
        return this.isMuted;
    }

    /**
     * 👆 基本操作音（ボタンタップ）
     * イメージ: 「ポッ」という短くて静かな水滴のような音
     */
    playTapSound() {
        if (this.isMuted) return;
        this._initContext();
        // 600Hzから300Hzへ素早く落ちるサイン波
        this._playTone(600, 'sine', 0.02, 0.08, 0.15, 300);
    }

    /**
     * ✨ お知らせ音（サクセス・完了）
     * イメージ: 「ピロリン♪」という明るく軽快な2和音
     */
    playSuccessSound() {
        if (this.isMuted) return;
        this._initContext();
        // C5 (ド) -> E5 (ミ) のアルペジオ
        this._playTone(523.25, 'sine', 0.05, 0.15, 0.2); 
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(659.25, 'sine', 0.05, 0.25, 0.2);
        }, 120);
    }

    /**
     * ⚠️ 警告音（ワーニング・エラー・上限到達）
     * イメージ: 「ププッ」という低めでマイルドな短い音
     */
    playWarningSound() {
        if (this.isMuted) return;
        this._initContext();
        // 耳障りにならないよう、低めの三角波を使用
        this._playTone(220, 'triangle', 0.03, 0.1, 0.2);
        setTimeout(() => {
            if (this.isMuted) return;
            this._playTone(220, 'triangle', 0.03, 0.1, 0.2);
        }, 120);
    }

    /**
     * 🔔 イベント発生音（ポップアップ）
     * イメージ: 「ポワーン」という少し余韻の残るベルのような柔らかい音
     */
    playEventSound() {
        if (this.isMuted) return;
        this._initContext();
        // A5 (ラ) の基本音に、1オクターブ上の倍音を重ねて透明感を出す
        this._playTone(880, 'sine', 0.05, 0.6, 0.25);
        this._playTone(1760, 'sine', 0.05, 0.4, 0.05); 
    }

    /**
     * 音の合成エンジン（オシレーターとゲインコントロール）
     */
    _playTone(freq, type, attack, release, maxVol, endFreq = null) {
        if (!this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            // ピッチの減衰指定があれば適用
            if (endFreq) {
                osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + attack + release);
            }
            
            // エンベロープ（音量変化）の適用による柔らかいアタックとリリース
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