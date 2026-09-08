/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 5: 主要空港開発（全80空港）2ビット・ビットマップ極小QRセーブ＆完全復元 ＆ 施設解体・50%返金連動】
 * 1. 【解体リクエスト処理】`onDowngradeAirportRequested` を実装。直前建設費の50%（Lv3->2: $1.75M / Lv2->1: $750K / Lv1->0: $250K）を
 *    即時返金（addFunds）し、3Dタワーを1段階低い造形へダウングレード（Lv 0到達時は黄金リングへ復帰）。
 * 2. 【v7極小セーブ発行 ➔ v8ムー完全対応版】`saveData.dev`（主要空港2ビット圧縮）に加え、
 *    `saveData.mu` にムー進行状態（3ビット整数: 0〜7）をわずか1文字で格納し、セーブデータバージョン `v: 8` へ更新。
 * 3. 【タワー完全一括復元】ロード時（onLoadSaveRequested）に `data.dev` を `airportManager.restoreDevLevels()` へ渡し、
 *    地球儀上の全主要空港の3Dタワーを一瞬で再構築。
 * 4. 【動的開発処理】開発ボタン押下時（onDevelopAirportRequested）にデバッグ価格（$500K / $1.5M / $3.5M）を
 *    所持金から引き落とし、該当空港の3Dタワーを動的にレベルアップ（Lv 0 ➔ 1 ➔ 2 ➔ 3）して即時反映。
 * 5. 【初期化リセット】全空港Lv 0の真っ新な状態から開発可能。
 * 6. 【情報連動】空港選択時（handleTap）に現在の開発レベルと所持金を UIManager へ伝達。
 * 7. 【リアルタイム同期】毎秒の資金変動時に checkAirportDevelopButton を呼び、開発ボタンの点灯・消灯を自動同期。
 * 8. 既存の軽快な45pxタップ判定、ライバル復活/撤退、期末決算モーダル、イベント等は100%完全保持。
 * 
 * 【ムー大陸 創世・航路開拓プロジェクト Phase 4 & Phase 5: 空路開通・初到着花火・極小QRセーブ＆完全復元】
 * 9. `onDevelopAirportRequested` 内で、第21段階到達後にいずれかの主要空港が新たに Lv 3 へ新設された瞬間を検知し空路開通。
 * 10. 条件達成時に `airportManager.unlockMuAirport()` を呼び出し、ムー中央古代空港（MU）を正式ノードとして解放。
 * 11. `handleTap` における空路接続の最大許容距離を `networkManager.getMaxAllowedDistance(originData, destData)` に更新し、
 *     ムー大陸関与路線は日本（羽田・成田）から直行可能な 1.72R（約118度）を自動適用。
 * 12. `planeManager.onFirstMuLanding` を購読し、初便着陸時に `muManager.triggerCelebrationFireworks()` を発火。
 *     初到着達成記念セレモニー電信モーダルを表示し、エンドレス経営の継続へ接続。
 * 13. `animate()` 内で毎フレーム `muManager.updateFireworks(delta)` を呼び出し、花火パーティクルを更新。
 * 14. 【Phase 5 Step 1 & 2】セーブ発行時に `hasReachedStage21`, `isMuUnlocked`, `isMuCelebrated` を 1 文字の 3 ビット整数文字列（saveData.mu）として出力（v8）。
 *     ロード時に `data.mu` から 3 つのフラグを復元し、`planeManager.hasLandedMu` の同期および `unlockMuAirport()` によるノード再配置を完全実行。
 */

import { CONFIG } from './Config.js';
import { Globe } from './Globe.js';
import { MapData } from './MapData.js';
import { AirportManager } from './AirportManager.js';
import { UIManager } from './UIManager.js';
import { NetworkManager } from './NetworkManager.js';
import { PlaneManager } from './PlaneManager.js';
import { RivalManager } from './RivalManager.js';
import { EconomyManager } from './EconomyManager.js';
import { UpgradeManager } from './UpgradeManager.js';
import { CompetitionManager } from './CompetitionManager.js';
import { EventManager } from './EventManager.js';
import { Utils } from './Utils.js';
import { SaveManager } from './SaveManager.js';
import { MuContinentManager } from './MuContinentManager.js'; // ★ムー大陸 Phase 1
import { getMuEventByStage } from './Data_MuEvents.js'; // ★ムー大陸 Phase 3

const STATE_IDLE = 0;
const STATE_CONNECTING = 1;

export class GameManager {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.loaderUI = document.getElementById('loading-screen');
        
        this.state = STATE_IDLE;
        this.selectedOrigin = null;
        this.targetDistance = null; 
        this.isPaused = false; 

        // ★新設: 観測電信の遅延予約・保留管理タイマー
        this.pendingMuTimeout = null;
        this.pendingMuStageData = null;

        // ★Phase 4 & Phase 5: ムー大陸の進行フラグ統括
        this.isMuUnlocked = false; // 空路開通済みフラグ
        this.hasReachedStage21 = false; // 第21段階到達フラグ
        this.isMuCelebrated = false; // 初到着セレモニー完了フラグ

        this.initThree();
        this.globe = new Globe(this.scene);
        this.mapData = new MapData();
        this.airportManager = new AirportManager(this.scene, this.globe.group);
        this.networkManager = new NetworkManager(this.scene, this.globe.group);
        this.planeManager = new PlaneManager(this.scene, this.globe.group, this.networkManager);
        this.uiManager = new UIManager();
        
        // ★ムー大陸 Phase 1: マネージャー初期化
        this.muManager = new MuContinentManager(this.scene, this.globe.group);
        this.lastMuStage = 0; // ★Phase 3: 電信通知済みの最大浮上段階

        // ★Phase 4新設: 自社機のムー中央古代空港（MU）への初到着コールバック登録
        this.planeManager.onFirstMuLanding = () => {
            if (this.isMuCelebrated) return;
            this.isMuCelebrated = true;

            // 1. 3Dサイバー粒子花火の打ち上げ
            if (this.muManager && this.muManager.triggerCelebrationFireworks) {
                this.muManager.triggerCelebrationFireworks();
            }

            // 2. 初到着記念の祝賀電信モーダルを着信表示
            const celebrationEventData = {
                stage: 21,
                title: "祝・ムー中央古代空港 初便到着！",
                sender: "世界航空連盟 ＆ 太古の碑文",
                body: "太平洋の彼方に眠りし「伝承のムー大陸」へ、貴社の航空機が歴史的第1便として見事にタッチダウンを果たしました！\n\n中央メガリスタワーと3連ピラミッドから祝賀のフォトン花火が天空へ放たれています。\nこれより、ムー大陸は世界屈指の超長距離メガハブとして恒久的に稼働します！"
            };
            setTimeout(() => {
                this.triggerMuModal(celebrationEventData);
            }, 800);
        };

        this.economyManager = new EconomyManager(this.uiManager);
        this.upgradeManager = new UpgradeManager();
        this.saveManager = new SaveManager();
        
        this.rivalManager = new RivalManager(this.networkManager, this.planeManager, this.airportManager, this.economyManager);
        
        this.rivalManager.onWithdraw = (companyId, airportId) => {
            const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
            if (comp) {
                this.uiManager.showWithdrawToast(`${comp.name} が撤退・逃亡しました！`, companyId);
            }
        };

        // ★追加: ライバル再起（復活）時のトースト通知コールバックを確実に登録
        this.rivalManager.onRevive = (companyId, airportId) => {
            const comp = CONFIG.COMPANIES.find(c => c.id === companyId);
            const compName = comp ? comp.name : companyId;
            this.uiManager.showReviveToast(`${compName} が新たな拠点で復活しました！`, companyId);
        };

        this.competitionManager = new CompetitionManager(
            this.networkManager,
            this.upgradeManager,
            this.rivalManager,
            this.airportManager
        );

        this.eventManager = new EventManager(
            this,
            this.uiManager,
            this.economyManager,
            this.upgradeManager,
            this.competitionManager,
            this.planeManager,
            this.rivalManager,
            this.networkManager
        );

        // Phase 6: 期末決算モーダルのハンドラ登録（★電信待機タイマーの一時退避 ＆ 決算終了後の保留電信自動発火）
        this.economyManager.onAnnualSettlement = (settlementData) => {
            // もし電信待機中のタイマーが走っていれば一旦クリア（データは pendingMuStageData に保持）
            if (this.pendingMuTimeout) {
                clearTimeout(this.pendingMuTimeout);
                this.pendingMuTimeout = null;
            }

            this.isPaused = true;
            this.uiManager.showSettlementModal(
                settlementData,
                () => {
                    this.isPaused = false;
                    if (this.eventManager) {
                        this.eventManager.cooldownTimer = 30.0;
                    }
                    // ★決算モーダルが閉じた直後（約0.5秒後）に、保留されていた電信モーダルを発火
                    if (this.pendingMuStageData) {
                        const stageData = this.pendingMuStageData;
                        this.pendingMuStageData = null;
                        setTimeout(() => {
                            this.triggerMuModal(stageData);
                        }, 500);
                    }
                },
                () => {
                    // ★修正: いきなり終了させず、安全な確認画面へ遷移
                    this.uiManager.showExitConfirm();
                }
            );
        };

        // ★追加: 終了確認画面でキャンセルされた場合、停止した時間を再開させる
        this.uiManager.onExitCanceled = () => {
            this.isPaused = false;
        };

        // ★Phase 4: 主要空港開発リクエストハンドラ（動的レベルアップ＆資金引き落とし ＆ Phase 3 トースト後3.8秒電信ディレイ連動 ＆ Phase 4 空路開通判定）
        this.uiManager.onDevelopAirportRequested = (airportData, currentDevLevel) => {
            if (!airportData || airportData.type !== 'major') return;
            if (currentDevLevel >= 3) return;

            const costs = [500000, 1500000, 3500000]; // デバッグ価格（Lv 0->1: $500K / Lv 1->2: $1.5M / Lv 2->3: $3.5M）
            const cost = costs[currentDevLevel] || 500000;

            if (!this.economyManager.canAfford(cost)) {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                return;
            }

            // 資金引き落とし
            this.economyManager.deductFunds(cost);

            // 該当空港マーカーを特定して3Dタワーをレベルアップ
            const marker = this.selectedHitMesh && this.selectedHitMesh.userData.airportData.id === airportData.id
                ? this.selectedHitMesh
                : this.airportManager.markers.find(m => m.userData.airportData.id === airportData.id);

            const nextLevel = currentDevLevel + 1;
            if (marker) {
                this.airportManager.setAirportDevLevel(marker, nextLevel);
            }

            // ボタン表示と価格・文言の即時更新
            this.uiManager.updateAirportDevelopButton(nextLevel, this.economyManager.funds);
            this.uiManager.showToast(`${airportData.name} を Lv ${nextLevel} へ開発しました！`, 'success');

            // ★Phase 4新設: 第21段階到達後にいずれかの主要空港を「新たに Lv 3 へ新設」した瞬間を検知
            const isMuUnlockTrigger = this.hasReachedStage21 && !this.isMuUnlocked && (nextLevel === 3);

            if (isMuUnlockTrigger) {
                this.isMuUnlocked = true;
                if (this.airportManager.unlockMuAirport) {
                    this.airportManager.unlockMuAirport();
                }

                // 3.8秒後に開通記念の緊急速報電信を発火
                if (this.pendingMuTimeout) {
                    clearTimeout(this.pendingMuTimeout);
                    this.pendingMuTimeout = null;
                }
                const unlockEventData = {
                    stage: 21,
                    title: "超長距離誘導ビーコン共鳴・空路開通",
                    sender: "ムー中央古代タワー通信",
                    body: "世界主要空港の極限開発（Lv 3）に呼応し、ムー中央タワーの古代ビーコンが共鳴発光！\n\nプラズマ磁気防壁が解除され、「ムー中央古代空港」への航路が正式に開通しました！\n日本（羽田・成田）をはじめとする環太平洋の各主要空港より、直行便の開設が可能です！"
                };
                this.pendingMuStageData = unlockEventData;
                this.pendingMuTimeout = setTimeout(() => {
                    this.pendingMuTimeout = null;
                    if (this.uiManager.isSettlementModalOpen && this.uiManager.isSettlementModalOpen()) return;
                    this.triggerMuModal(unlockEventData);
                }, 3800);
            } else {
                // 通常の浮上段階同期（トースト後3.8秒電信）
                this.syncMuContinentStage(true, 3800);
            }
        };

        // ★新設: 主要空港解体（ダウングレード）リクエストハンドラ（50%即時返金＆タワー降格 ＆ Phase 3 ムー大陸連動）
        this.uiManager.onDowngradeAirportRequested = (airportData, currentDevLevel) => {
            if (!airportData || airportData.type !== 'major') return;
            if (currentDevLevel <= 0) return;

            const refunds = [0, 250000, 750000, 1750000]; // 返金額（Lv 1➔0: $250K / Lv 2➔1: $750K / Lv 3➔2: $1.75M）
            const refund = refunds[currentDevLevel] || 0;

            // 資金返還加算
            this.economyManager.addFunds(refund);

            // 該当空港マーカーを特定して3Dタワーを1段階降格
            const marker = this.selectedHitMesh && this.selectedHitMesh.userData.airportData.id === airportData.id
                ? this.selectedHitMesh
                : this.airportManager.markers.find(m => m.userData.airportData.id === airportData.id);

            const nextLevel = currentDevLevel - 1;
            if (marker) {
                this.airportManager.setAirportDevLevel(marker, nextLevel);
            }

            // ボタン表示と価格・文言の即時更新
            this.uiManager.updateAirportDevelopButton(nextLevel, this.economyManager.funds);
            const refundStr = this.uiManager._formatMoneyShort(refund);
            this.uiManager.showToast(`${airportData.name} の施設を解体し、+${refundStr} が返金されました！`, 'info');

            // ★Phase 3: 施設解体に伴うムー大陸の浮上段階引き下げ同期（電信モーダルは非表示・ディレイなし）
            this.syncMuContinentStage(false, 0);
        };

        // ★QRセーブ・ロード: セーブデータ発行ハンドラ（Phase 5 Step 1: v8 極小1文字ビットフラグ保存対応）
        this.uiManager.onIssueSaveRequested = async () => {
            try {
                const playerPlanes = this.planeManager.planes.filter(p => p.companyId === 'player');
                const planeCounts = this.planeManager.getPlaneCounts('player');
                const upgradeData = this.upgradeManager.getProgressData();
                
                // 空港データ配列（Base62圧縮インデックス用）
                const airportsData = this.airportManager.markers.map(m => m.userData.airportData);
                const routesStr = this.networkManager.exportRoutes('player', airportsData);

                // ★Step 4追加: ライバルAI4社のデータ（路線Base62・機体数）を抽出
                const rivalsData = {};
                CONFIG.COMPANIES.forEach(comp => {
                    if (comp.id !== 'player') {
                        rivalsData[comp.id] = {
                            planes: this.planeManager.getPlaneCounts(comp.id),
                            routes: this.networkManager.exportRoutes(comp.id, airportsData)
                        };
                    }
                });

                // ★Phase 5追加: 主要空港全80箇所のLv0〜3をわずか20数文字（約20バイト）でパック
                const devLevelsStr = this.airportManager.exportDevLevels ? this.airportManager.exportDevLevels() : '';

                // ★Phase 5 Step 1新設: ムー進行フラグ（3ビット整数: 0〜7）をわずか1文字でパック
                let muMask = 0;
                if (this.hasReachedStage21) muMask |= 1;
                if (this.isMuUnlocked) muMask |= 2;
                if (this.isMuCelebrated) muMask |= 4;
                const muStateStr = muMask.toString();

                // ★QR極限軽量化仕様: rivalState（タイマー・カウンター）と history（推移ログ）を完全除外
                const saveData = {
                    v: 8, // ★極限軽量・主要空港開発＆ムー大陸完全対応版 (v: 8)
                    type: 'save',
                    funds: Math.floor(this.economyManager.funds),
                    year: this.economyManager.year,
                    month: this.economyManager.month,
                    passengers: {
                        total: Math.floor(this.economyManager.totalPassengers || 0),
                        yearly: Math.floor(this.economyManager.yearlyPassengers || 0),
                        best: Math.floor(this.economyManager.bestYearlyPassengers || 0)
                    },
                    planes: planeCounts,
                    upgrades: upgradeData,
                    routes: routesStr,
                    rivals: rivalsData,
                    aiEconomy: this.economyManager.getAiEconomyData(),
                    dev: devLevelsStr, // ★主要空港全80箇所の2ビットデータ
                    mu: muStateStr     // ★Phase 5新設: わずか1文字のビットフラグ (例: "7")
                };

                // 発行実時刻（YYYY/MM/DD HH:mm:ss）とゲーム進行度（X年目-Y月）
                const d = new Date();
                const yyyy = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const da = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const ss = String(d.getSeconds()).padStart(2, '0');
                const timeStr = `${hh}:${mm}:${ss}`;
                const fullTimeStr = `${yyyy}/${mo}/${da} ${hh}:${mm}:${ss}`;
                const gameInfoStr = `${this.economyManager.year}年目-${this.economyManager.month}月`;

                // 保有機体数と資金短縮表示
                const fundsDisplay = this.uiManager._formatMoneyShort(this.economyManager.funds);

                // 画像合成用メタ情報
                const metaInfo = {
                    yearTitle: `【 ${gameInfoStr} 】`,
                    statusText: `💰 資金: ${fundsDisplay}   ✈️ 機体: ${playerPlanes.length}機`,
                    timeText: `🕒 発行: ${fullTimeStr}`
                };

                const dataUrl = await this.saveManager.generateQR(saveData, metaInfo);

                this.uiManager.showSaveQR(dataUrl, timeStr, gameInfoStr);
                this.uiManager.showToast('セーブデータ(QR)を発行しました！', 'success');
            } catch (err) {
                console.error('[GameManager] Save Issue Error:', err);
                const msg = err.message ? err.message : '不明なエラー';
                this.uiManager.showToast(`発行失敗: ${msg}`, 'error');
            }
        };

        // ★QRセーブ・ロード: セーブデータ読込ハンドラ（Phase 5 Step 1 & 2: v8 ムー完全復元対応）
        this.uiManager.onLoadSaveRequested = async (file) => {
            try {
                const data = await this.saveManager.readQRFromFile(file);
                if (data && data.funds !== undefined) {
                    // 1. 資金・年月の復元
                    this.economyManager.funds = data.funds;
                    if (data.year !== undefined) this.economyManager.year = data.year;
                    if (data.month !== undefined) this.economyManager.month = data.month;

                    // 2. 客数データの復元（Step 2）
                    if (data.passengers) {
                        if (data.passengers.total !== undefined) this.economyManager.totalPassengers = data.passengers.total;
                        if (data.passengers.yearly !== undefined) this.economyManager.yearlyPassengers = data.passengers.yearly;
                        if (data.passengers.best !== undefined) this.economyManager.bestYearlyPassengers = data.passengers.best;
                    }

                    // 3. AI資金・客数の復元（★Step 4）
                    if (data.aiEconomy && this.economyManager.restoreAiEconomyData) {
                        this.economyManager.restoreAiEconomyData(data.aiEconomy);
                    }

                    // 4. アップグレード進捗の復元（Step 2）
                    if (data.upgrades && this.upgradeManager.restoreProgressData) {
                        this.upgradeManager.restoreProgressData(data.upgrades);
                    }
                    const currentBonuses = this.upgradeManager.getBonuses();
                    this.economyManager.maxPlanes = currentBonuses.maxPlanes;

                    // 5. 空港データ配列の取得
                    const airportsData = this.airportManager.markers.map(m => m.userData.airportData);

                    // 6. 全5社の空路ネットワーク復元（★順序制御: 機体配置の前に必ず全社路線を再構築！）
                    if (data.routes !== undefined && this.networkManager.restoreRoutes) {
                        this.networkManager.restoreRoutes(data.routes, 'player', airportsData);
                    }
                    if (data.rivals && this.networkManager.restoreRoutes) {
                        CONFIG.COMPANIES.forEach(comp => {
                            if (comp.id !== 'player' && data.rivals[comp.id] && data.rivals[comp.id].routes !== undefined) {
                                this.networkManager.restoreRoutes(data.rivals[comp.id].routes, comp.id, airportsData);
                            }
                        });
                    }

                    // 7. 全5社の機体再配属（★路線構築完了後に実行）
                    if (data.planes && this.planeManager.restorePlanes) {
                        this.planeManager.restorePlanes(data.planes, 'player');
                    }
                    if (data.rivals && this.planeManager.restorePlanes) {
                        CONFIG.COMPANIES.forEach(comp => {
                            if (comp.id !== 'player' && data.rivals[comp.id] && data.rivals[comp.id].planes) {
                                this.planeManager.restorePlanes(data.rivals[comp.id].planes, comp.id);
                            }
                        });
                    }

                    // ★Phase 5追加: 主要空港開発（全80箇所）の3Dタワー・自社エメラルドマテリアルを一括完全復元
                    if (this.airportManager.restoreDevLevels) {
                        this.airportManager.restoreDevLevels(data.dev);
                    }

                    // ★Phase 5 Step 1新設: ムー大陸の進行フラグ（v8）を解凍し完全復元
                    const muVal = data.mu !== undefined ? parseInt(data.mu, 10) : 0;
                    this.hasReachedStage21 = (muVal & 1) !== 0;
                    this.isMuUnlocked = (muVal & 2) !== 0;
                    this.isMuCelebrated = (muVal & 4) !== 0;

                    // ★Phase 5 Step 2新設: PlaneManager の初着陸フラグ同期（セレモニー二重発火防止）
                    if (this.planeManager) {
                        this.planeManager.hasLandedMu = this.isMuCelebrated;
                    }

                    // ★Phase 5 Step 1新設: 空路開通済みならば MU 空港ノードを即座に有効化
                    if (this.isMuUnlocked && this.airportManager.unlockMuAirport) {
                        this.airportManager.unlockMuAirport();
                    }

                    // ★Phase 3: ロードした主要空港の開発レベル合計に合わせてムー大陸の浮上段階を即座に復元
                    this.syncMuContinentStage(false, 0);

                    // ★QR極限軽量化仕様: AIタイマー/撤退カウンターおよび過去推移履歴は復元せず、読込時点から通常動作・蓄積を開始

                    // 8. 各種UI・パネル・ランキングの即時更新
                    const calendarStr = `${this.economyManager.year}年目-${this.economyManager.month}月`;
                    const fundsStr = this.economyManager._formatMoney(this.economyManager.funds);
                    const incomeStr = (this.economyManager.displayIncome >= 0 ? "+$" : "-$") + this.economyManager._formatMoneyNumber(Math.abs(this.economyManager.displayIncome));
                    const yearlyPassengersStr = this.economyManager._formatNumber(this.economyManager.yearlyPassengers);
                    
                    let passengersStr = '';
                    if (this.economyManager.totalPassengers >= 1000000000) {
                        passengersStr = (this.economyManager.totalPassengers / 1000000000).toFixed(2) + 'B';
                    } else if (this.economyManager.totalPassengers >= 1000000) {
                        passengersStr = (this.economyManager.totalPassengers / 1000000).toFixed(2) + 'M';
                    } else {
                        passengersStr = this.economyManager._formatNumber(this.economyManager.totalPassengers);
                    }
                    const rawWorldShare = this.competitionManager ? this.competitionManager.getWorldShare('player') : 0;
                    const shareStr = (rawWorldShare * 100).toFixed(1);
                    const playerPlanes = this.planeManager.planes.filter(p => p.companyId === 'player');

                    this.uiManager.updateTopHUD(
                        calendarStr,
                        fundsStr,
                        playerPlanes.length,
                        this.economyManager.maxPlanes,
                        incomeStr,
                        yearlyPassengersStr,
                        passengersStr,
                        shareStr
                    );

                    // パネル表示の即時同期
                    const counts = this.planeManager.getPlaneCounts('player');
                    this.uiManager.updateFleetPanel(counts);
                    if (this.uiManager.isUpgradePanelOpen && this.uiManager.isUpgradePanelOpen()) {
                        this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
                    }
                    if (this.uiManager.isRivalsPanelOpen && this.uiManager.isRivalsPanelOpen()) {
                        this.updateRivalsPanelData();
                    }
                    if (this.uiManager.isOverviewPanelOpen && this.uiManager.isOverviewPanelOpen()) {
                        this.updateOverviewPanelData();
                    }

                    this.uiManager.hideAll();
                    this.uiManager.showToast('セーブデータを復元しました！', 'success');
                } else {
                    this.uiManager.showToast('QRコードが読み取れませんでした', 'error');
                }
            } catch (err) {
                console.error('[GameManager] Save Issue Error:', err);
                const msg = err.message ? err.message : '不明なエラー';
                this.uiManager.showToast(`読込失敗: ${msg}`, 'error');
            }
        };

        this.uiManager.onConnectRequested = () => {
            this.state = STATE_CONNECTING;
            this.selectedOrigin = this.selectedHitMesh; 
            
            this.airportManager.clearHighlight('all');
            this.airportManager.setHighlight(this.selectedOrigin, 'origin');
            
            this.uiManager.setConnectingMode();
        };

        this.uiManager.onRouteCanceled = () => {
            this.resetState();
        };

        this.uiManager.onRouteActionConfirmed = (actionType) => {
            if (this.selectedOrigin && this.selectedDestination) {
                const originData = this.selectedOrigin.userData.airportData;
                const destData = this.selectedDestination.userData.airportData;

                if (actionType === 'add') {
                    const routeCost = this.economyManager.calculateRouteCost(originData, destData);
                    
                    if (!this.economyManager.canAfford(routeCost)) {
                        this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                        return;
                    }
                    
                    const success = this.networkManager.addRoute(originData, destData);
                    if (success) {
                        this.economyManager.deductFunds(routeCost);
                        this.planeManager.wakeUpPlanes();
                        this.uiManager.showRouteConfirm(originData, destData, true, routeCost, this.economyManager.funds);
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                    }
                } else if (actionType === 'remove') {
                    const routeCost = this.economyManager.calculateRouteCost(originData, destData);
                    const refund = Math.floor(routeCost * 0.5);
                    this.economyManager.addFunds(refund);

                    this.networkManager.removeRoute(originData, destData);
                    this.planeManager.checkAndReassignPlanes();
                    
                    if (this.networkManager.canConnect(originData, destData)) {
                        this.uiManager.showRouteConfirm(originData, destData, false, routeCost, this.economyManager.funds);
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
                    }
                }
            }
        };

        this.uiManager.onFleetMenuOpen = () => {
            const counts = this.planeManager.getPlaneCounts('player');
            this.uiManager.updateFleetPanel(counts);
        };

        this.uiManager.onBuyPlane = (type) => {
            const planeConf = CONFIG.ECONOMY.PLANES[type];
            const cost = planeConf ? planeConf.cost : 10000000;
            
            if (!this.economyManager.canAfford(cost)) {
                this.uiManager.showToast(window.APP_LANG.toastNoFunds);
                return;
            }
            
            const counts = this.planeManager.getPlaneCounts('player');
            const totalPlanes = Object.values(counts).reduce((a, b) => a + b, 0);
            
            if (totalPlanes >= this.economyManager.maxPlanes) {
                this.uiManager.showToast(window.APP_LANG.toastLimitPlanes);
                return;
            }

            const success = this.planeManager.addPlane(type);
            if (!success) {
                this.uiManager.showToast(window.APP_LANG.toastNoRoute);
            } else {
                this.economyManager.deductFunds(cost);
                const newCounts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(newCounts);
            }
        };

        this.uiManager.onSellPlane = (type) => {
            const success = this.planeManager.sellPlane(type);
            if (success) {
                const planeConf = CONFIG.ECONOMY.PLANES[type];
                const refund = planeConf ? (planeConf.cost * planeConf.sellRate) : 5000000;
                this.economyManager.addFunds(refund);

                const counts = this.planeManager.getPlaneCounts('player');
                this.uiManager.updateFleetPanel(counts);
            }
        };

        this.uiManager.onZoomIn = () => this.zoomCamera(-4.0);
        this.uiManager.onZoomOut = () => this.zoomCamera(4.0);
        
        this.uiManager.onUpgradeRequested = (upgradeId) => {
            const success = this.upgradeManager.upgrade(upgradeId, this.economyManager);
            if (success) {
                this.uiManager.soundManager.playSuccessSound();
                this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
            } else {
                this.uiManager.soundManager.playErrorSound();
                this.uiManager.showToast(window.APP_LANG.toastNoFunds, "error");
            }
        };

        this.uiManager.onPanelOpened = (panelId) => {
            if (panelId === 'panel-upgrades') {
                this.uiManager.updateUpgradePanel(this.upgradeManager, this.economyManager.funds);
            } else if (panelId === 'panel-rivals') {
                this.updateRivalsPanelData();
            } else if (panelId === 'panel-overview') {
                this.updateOverviewPanelData();
            }
        };

        this.uiManager.onGraphTabChanged = () => {
            this.updateOverviewPanelData();
        };

        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.selectedHitMesh = null;
        this.selectedDestination = null;

        this.clock = new THREE.Clock();
        this.rivalUiTimer = 0; 

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * ★Phase 3: 全主要空港の累計開発レベルに応じてムー大陸の浮上段階を同期（ディレイ着信対応）
     * @param {boolean} triggerModal - 新しい段階に達した際に観測ニュース電信モーダルを表示するか
     * @param {number} delayMs - 電信モーダル着信までの遅延ミリ秒（トースト完全消滅＋余韻）
     */
    syncMuContinentStage(triggerModal = true, delayMs = 0) {
        if (!this.muManager || !this.airportManager) return;

        const totalDev = this.airportManager.getTotalDevLevel ? this.airportManager.getTotalDevLevel() : 0;
        const targetStage = Math.max(0, Math.min(21, totalDev));

        this.muManager.setStage(targetStage);

        // ★Phase 4: 第21段階に到達した実績をフラグとして記録
        if (targetStage >= 21) {
            this.hasReachedStage21 = true;
        }

        // デバッグボタンの表示文字列も更新
        const btnDebug = document.getElementById('btn-mu-debug-step');
        if (btnDebug) {
            btnDebug.innerHTML = `<span>🏝️ ムー段階 [${targetStage}/21]</span>`;
        }

        // 新しい段階に前進した場合のみ観測ニュース電信モーダルを着信表示
        if (triggerModal && targetStage > this.lastMuStage) {
            this.lastMuStage = targetStage;
            const stageData = getMuEventByStage(targetStage);
            if (stageData && this.uiManager) {
                if (delayMs > 0) {
                    // 既存の待機タイマーがあればクリア
                    if (this.pendingMuTimeout) {
                        clearTimeout(this.pendingMuTimeout);
                        this.pendingMuTimeout = null;
                    }
                    this.pendingMuStageData = stageData;
                    this.pendingMuTimeout = setTimeout(() => {
                        this.pendingMuTimeout = null;
                        // もし決算モーダル等が開いている場合は保留を維持
                        if (this.uiManager.isSettlementModalOpen && this.uiManager.isSettlementModalOpen()) {
                            return;
                        }
                        this.triggerMuModal(stageData);
                    }, delayMs);
                } else {
                    this.triggerMuModal(stageData);
                }
            }
        } else if (!triggerModal) {
            this.lastMuStage = Math.max(this.lastMuStage, targetStage);
        }
    }

    /**
     * ★Phase 3: 観測電信モーダルを安全に時間停止状態で発火
     * @param {object} stageData - Data_MuEvents.js のイベントデータ
     */
    triggerMuModal(stageData) {
        if (!stageData || !this.uiManager) return;
        this.pendingMuStageData = null;
        this.isPaused = true; // ★電信読込中はゲーム内時間を一時停止（決算・イベントの裏重複を100%防止）

        this.uiManager.showMuEventModal(stageData, () => {
            this.isPaused = false; // ★OK受信でゲーム内時間を安全に再開
        });
    }

    /**
     * ★ムー大陸 Phase 1〜3: 0〜21段階手動検証ボタン（電信表示も同時にテスト可能）
     */
    _initMuDebugButton() {
        if (document.getElementById('btn-mu-debug-step')) return;

        const btn = document.createElement('button');
        btn.id = 'btn-mu-debug-step';
        btn.className = 'interactive-ui absolute top-24 right-4 z-40 bg-slate-900/90 text-emerald-400 border border-emerald-500/60 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-950/50 active:scale-95 transition-all flex items-center gap-1.5';
        const initStage = this.muManager ? this.muManager.getStage() : 0;
        btn.innerHTML = `<span>🏝️ ムー段階 [${initStage}/21]</span>`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager && this.uiManager.soundManager) {
                this.uiManager.soundManager.playTapSound();
            }
            if (this.muManager) {
                const newStage = this.muManager.stepStageDebug();
                btn.innerHTML = `<span>🏝️ ムー段階 [${newStage}/21]</span>`;

                if (newStage > 0) {
                    const stageData = getMuEventByStage(newStage);
                    if (stageData && this.uiManager) {
                        this.triggerMuModal(stageData);
                    }
                } else if (this.uiManager) {
                    this.uiManager.showToast('ムー大陸が水没しました', 'info');
                }
            }
        });

        document.body.appendChild(btn);
    }

    executeGameExit() {
        this.uiManager.soundManager.playSuccessSound();
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    updateOverviewPanelData() {
        this.uiManager.updateOverviewPanel(this.economyManager.historyData, CONFIG.COMPANIES);
    }

    updateRivalsPanelData() {
        const stats = CONFIG.COMPANIES.map(comp => {
            let routeCount = 0;
            const net = this.networkManager.network[comp.id];
            if (net) {
                for (const origin in net) {
                    routeCount += net[origin].length;
                }
                routeCount = Math.floor(routeCount / 2); 
            }

            let planeCount = 0;
            let assetValue = 0;
            const planes = this.planeManager.planes.filter(p => p.companyId === comp.id);
            planeCount = planes.length;
            
            planes.forEach(p => {
                const conf = CONFIG.ECONOMY.PLANES[p.sizeType];
                if (conf) assetValue += conf.cost;
            });
            assetValue += routeCount * CONFIG.ECONOMY.ROUTE_BASE_COST * 2; 
            
            if (comp.id === 'player') {
                assetValue += this.economyManager.funds;
            } else {
                assetValue += this.economyManager.getAiFunds(comp.id);
            }

            let satisfaction = 0;
            if (comp.id === 'player') {
                const baseSat = this.upgradeManager.getBonuses().satisfaction || 0;
                const eventSat = this.upgradeManager.eventSatisfactionBonus || 0;
                satisfaction = Math.round(baseSat + eventSat);
            } else {
                satisfaction = Math.round(this.competitionManager.getAiSatisfaction ? this.competitionManager.getAiSatisfaction(comp.id) : 150);
            }

            const globalShare = this.competitionManager.getGlobalShare(comp.id);

            return {
                id: comp.id,
                name: comp.name,
                isPlayer: comp.id === 'player',
                routeCount,
                planeCount,
                assetValue,
                satisfaction,
                globalShare
            };
        });

        stats.sort((a, b) => b.globalShare - a.globalShare);
        this.uiManager.updateRivalsPanel(stats);
    }

    resetState() {
        this.state = STATE_IDLE;
        this.selectedOrigin = null;
        this.selectedDestination = null;
        this.selectedHitMesh = null;
        this.airportManager.clearHighlight('all'); 
        this.uiManager.hideAll();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const jpLat = 35.6; 
        const jpLon = 139.7; 
        const distance = 22.0; 
        const phi = (90 - jpLat) * (Math.PI / 180);
        const theta = (jpLon + 180) * (Math.PI / 180);
        
        this.camera.position.set(
            -(distance * Math.sin(phi) * Math.cos(theta)),
            distance * Math.cos(phi),
            distance * Math.sin(phi) * Math.sin(theta)
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = 7.5; 
        this.controls.maxDistance = 25.0;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI - 0.1;

        this.controls.addEventListener('change', () => this.checkZoomLimit());

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(CONFIG.COLORS.COASTLINE, 0.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
    }

    zoomCamera(deltaAmount) {
        if (!this.controls || !this.camera) return;
        const currentDist = this.camera.position.distanceTo(this.controls.target);
        if (this.targetDistance === null) this.targetDistance = currentDist;
        
        this.targetDistance += deltaAmount;
        this.targetDistance = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, this.targetDistance));
        
        this.checkZoomLimit(); 
    }

    checkZoomLimit() {
        if (!this.uiManager || !this.controls || !this.camera) return;

        const currentDist = this.camera.position.distanceTo(this.controls.target);
        const target = this.targetDistance !== null ? this.targetDistance : currentDist;
        const canZoomIn = target > this.controls.minDistance + 0.01;
        const canZoomOut = target < this.controls.maxDistance - 0.01;
        this.uiManager.updateZoomButtonsState(canZoomIn, canZoomOut);
    }

    async start() {
        this.globe.buildBase();

        const success = await this.mapData.loadData();
        if (success) {
            this.globe.buildCoastlines(this.mapData.coastlinePoints);
            this.airportManager.buildAirportMarkers();
            
            this.initStarterPack();
            this.rivalManager.init();
            
            // ★ムー大陸 Phase 1: デバッグ伸縮ボタンを設置
            this._initMuDebugButton();

            this.hideLoader();
            this.checkZoomLimit(); 
        } else {
            this.showError("Error", window.APP_LANG.errMapLoad);
        }

        this.animate();
    }

    initStarterPack() {
        const hnd = this.airportManager.getAirportById('HND'); 
        const cts = this.airportManager.getAirportById('CTS'); 
        const fuk = this.airportManager.getAirportById('FUK'); 

        if (hnd && cts) {
            this.networkManager.addRoute(hnd, cts);
            // ★創業時の羽田-千歳線を両方向就航済みに設定し初期シェアを安定化
            this.networkManager.setRouteOperational('HND', 'CTS', 'player');
        }
        if (hnd && fuk) {
            this.networkManager.addRoute(hnd, fuk);
            // ★創業時の羽田-福岡線を両方向就航済みに設定し初期シェアを安定化
            this.networkManager.setRouteOperational('HND', 'FUK', 'player');
        }

        this.planeManager.addPlane('small');
        this.planeManager.addPlane('small');
    }

    onPointerDown(event) {
        this.isDragging = false;
        this.dragStartPos = { x: event.clientX, y: event.clientY };
    }

    onPointerUp(event) {
        const dx = event.clientX - this.dragStartPos.x;
        const dy = event.clientY - this.dragStartPos.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            this.handleTap(event);
        }
    }

    handleTap(event) {
        if (event.target !== this.renderer.domElement) return;
        // ★排他制御: 電信モーダル表示中（isMuEventModalOpen）もタップを確実に破棄
        if (this.isPaused || (this.eventManager && this.eventManager.isEventActive) || 
            (this.uiManager && (this.uiManager.isSettlementModalOpen() || this.uiManager.isMuEventModalOpen()))) return;

        const tapX = event.clientX;
        const tapY = event.clientY;
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        const maxDist = 45; 
        
        let bestHit = null;
        let minDistance = maxDist;

        this.airportManager.markers.forEach(hitMesh => {
            const pos = new THREE.Vector3();
            hitMesh.getWorldPosition(pos);

            const cameraToMarker = this.camera.position.clone().sub(pos);
            const normal = pos.clone().normalize();
            if (cameraToMarker.dot(normal) < 0) return; 

            const proj = pos.clone().project(this.camera);
            const screenX = (proj.x * widthHalf) + widthHalf;
            const screenY = -(proj.y * heightHalf) + heightHalf;

            const dx = tapX - screenX;
            const dy = tapY - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDistance) {
                minDistance = dist;
                bestHit = hitMesh;
            }
        });

        if (this.state === STATE_IDLE) {
            if (bestHit) {
                this.selectedHitMesh = bestHit;
                const data = bestHit.userData.airportData;
                
                this.airportManager.clearHighlight('all');
                this.airportManager.setHighlight(bestHit, 'dest');
                
                const currConns = this.networkManager.getConnectionCount(data.id);
                // ★Phase 4: ムー中央古代空港（MU）は主要空港（major: 8路線）と同等扱い
                const effectiveType = (data.id === 'MU') ? 'major' : data.type;
                const maxConns = this.networkManager.MAX_CONNECTIONS[effectiveType] || 8;
                const devLevel = bestHit.userData.devLevel || 0;
                
                // ★Phase 4: 開発レベルと所持金をUIに渡して開発ボタンを表示
                this.uiManager.showAirportInfo(data, currConns, maxConns, devLevel, this.economyManager.funds);
            } else {
                this.resetState();
            }
        } else if (this.state === STATE_CONNECTING) {
            if (bestHit) {
                if (bestHit === this.selectedOrigin) return;

                if (!this.selectedOrigin) {
                    this.selectedOrigin = this.selectedHitMesh;
                }
                this.selectedDestination = bestHit;
                
                this.airportManager.clearHighlight('dest');
                this.airportManager.setHighlight(this.selectedDestination, 'dest');
                
                const originData = this.selectedOrigin.userData.airportData;
                const destData = this.selectedDestination.userData.airportData;

                const isConnected = this.networkManager.isConnected(originData.id, destData.id);
                const routeCost = this.economyManager.calculateRouteCost(originData, destData);

                if (isConnected) {
                    this.uiManager.showRouteConfirm(originData, destData, true, routeCost, this.economyManager.funds); 
                } else {
                    const posA = Utils.latLonToVector3(originData.lat, originData.lon, CONFIG.GLOBE_RADIUS);
                    const posB = Utils.latLonToVector3(destData.lat, destData.lon, CONFIG.GLOBE_RADIUS);
                    const distance = posA.distanceTo(posB);
                    // ★Phase 4: ムー大陸関与路線は日本（羽田・成田）から直行可能な 1.72R（通常は 1.25R）を自動適用
                    const maxDistance = this.networkManager.getMaxAllowedDistance(originData, destData);

                    if (distance > maxDistance) {
                        this.uiManager.showToast(window.APP_LANG.toastOverDistance);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
                    } else if (this.networkManager.canConnect(originData, destData)) {
                        this.uiManager.showRouteConfirm(originData, destData, false, routeCost, this.economyManager.funds); 
                    } else {
                        this.uiManager.showToast(window.APP_LANG.toastLimit);
                        this.selectedDestination = null;
                        this.airportManager.clearHighlight('dest'); 
                        this.uiManager.setConnectingMode();
                    }
                }
            } else {
                this.resetState();
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const rawDelta = this.clock.getDelta();
        const delta = this.isPaused ? 0 : rawDelta;

        if (this.targetDistance !== null) {
            const currentDist = this.camera.position.distanceTo(this.controls.target);
            const diff = this.targetDistance - currentDist;
            
            if (Math.abs(diff) < 0.01) {
                this.targetDistance = null;
            } else {
                const step = diff * 10.0 * rawDelta; 
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
                this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(currentDist + step));
                this.controls.update(); 
            }
        }

        if (this.controls && this.controls.target && this.camera) {
            const currentDistForRotate = this.camera.position.distanceTo(this.controls.target);
            let minDesc = this.controls.minDistance;
            let maxDesc = this.controls.maxDistance;
            if (minDesc === undefined || isNaN(minDesc)) minDesc = 7.5;
            if (maxDesc === undefined || isNaN(maxDesc)) maxDesc = 25.0;

            const denom = maxDesc - minDesc;
            if (denom > 0) {
                const distanceRatio = Math.max(0, Math.min(1, (currentDistForRotate - minDesc) / denom));
                const dynamicRotateSpeed = 0.15 + (distanceRatio * 0.35);
                if (!isNaN(dynamicRotateSpeed)) {
                    this.controls.rotateSpeed = dynamicRotateSpeed;
                }
            }
        }

        const currentBonuses = this.upgradeManager.getBonuses();
        this.economyManager.maxPlanes = currentBonuses.maxPlanes;

        this.airportManager.updateMarkerScale(this.camera);
        this.planeManager.updateScale(this.camera);
        this.planeManager.update(delta, currentBonuses.speedMultiplier);

        // ★Phase 4新設: 3Dサイバー粒子花火パーティクルの毎フレーム物理更新
        if (this.muManager && this.muManager.updateFireworks) {
            this.muManager.updateFireworks(delta);
        }

        this.competitionManager.update(delta, this.economyManager ? this.economyManager.year : 1);
        
        this.economyManager.update(
            delta,
            this.planeManager.planes,
            this.networkManager,
            this.upgradeManager,
            this.competitionManager,
            this.eventManager
        );
        this.rivalManager.update(delta, this.competitionManager);
        
        if (this.eventManager) {
            this.eventManager.update(delta);
        }

        this.uiManager.checkRouteConfirmButton(this.economyManager.funds);
        // ★Phase 4: 毎秒の資金変動に合わせて空港開発ボタンの点灯・消灯をリアルタイム同期
        this.uiManager.checkAirportDevelopButton(this.economyManager.funds);

        this.rivalUiTimer += delta;
        if (this.rivalUiTimer > 1.0) {
            this.rivalUiTimer = 0;
            if (this.uiManager.isRivalsPanelOpen()) {
                this.updateRivalsPanelData();
            }
            if (this.uiManager.isOverviewPanelOpen()) {
                this.updateOverviewPanelData();
            }
        }

        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    hideLoader() {
        this.loaderUI.classList.add('opacity-0');
        setTimeout(() => this.loaderUI.remove(), 500);
    }

    showError(title, msg) {
        const h2 = this.loaderUI.querySelector('h2');
        const p = this.loaderUI.querySelector('p');
        if (h2) h2.innerText = title;
        if (p) p.innerText = msg;
    }
}