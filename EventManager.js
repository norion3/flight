/**
 * AI可読性・先祖返り防止コメント:
 * 【Phase 6: 期末決算モーダルとの完全排他制御の実装】
 * 1. `update` 内で、決算モーダル表示中（`this.uiManager.isSettlementModalOpen()`）はイベント抽選タイマーを完全にスキップ。
 * 2. 決算直後・新年度開始時の30秒クールダウン（`this.cooldownTimer`）との連携を保証。
 * 3. イベントモーダル表示時のフリーズ防止安全フォールバック（`try...catch / finally`）は100%完全保持。
 */

import { EVENT_DATA } from './Data_Events.js';
import { CONFIG } from './Config.js';

export class EventManager {
    constructor(gameManager, uiManager, economyManager, upgradeManager, competitionManager, planeManager, rivalManager) {
        this.gameManager = gameManager;
        this.uiManager = uiManager;
        this.economyManager = economyManager;
        this.upgradeManager = upgradeManager;
        this.competitionManager = competitionManager;
        this.planeManager = planeManager;
        this.rivalManager = rivalManager;

        this.isEventActive = false;
        this.checkTimer = 0;
        this.cooldownTimer = 45.0; // 開始後45秒は発生しない
        this.recentWithdrawalFlag = false;

        if (this.rivalManager) {
            const originalOnWithdraw = this.rivalManager.onWithdraw;
            this.rivalManager.onWithdraw = (companyId, airportId) => {
                if (originalOnWithdraw) originalOnWithdraw(companyId, airportId);
                this.recentWithdrawalFlag = true;
                setTimeout(() => { this.recentWithdrawalFlag = false; }, 60000); 
            };
        }

        this.activeBuffs = {
            incomeRate: 0,
            passengersRate: 0,
            timer: 0
        };
    }

    update(delta) {
        if (this.activeBuffs.timer > 0) {
            this.activeBuffs.timer -= delta;
            if (this.activeBuffs.timer <= 0) {
                this.activeBuffs.incomeRate = 0;
                this.activeBuffs.passengersRate = 0;
            }
        }

        // ★Phase 6: 突発イベント中、または期末決算モーダル表示中はイベント抽選をスキップ（排他制御）
        if (this.isEventActive || (this.uiManager && this.uiManager.isSettlementModalOpen && this.uiManager.isSettlementModalOpen())) {
            return;
        }

        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= delta;
            return;
        }

        this.checkTimer += delta;
        if (this.checkTimer >= 10.0) {
            this.checkTimer = 0;
            this._checkAndTriggerEvent();
        }
    }

    _getStage(year) {
        if (year <= 1) return 1;
        if (year <= 2) return 2;
        if (year <= 4) return 3;
        if (year <= 6) return 4;
        if (year <= 8) return 5;
        return 6;
    }

    _checkAndTriggerEvent() {
        if (Math.random() > 0.35) return; 

        const currentYear = this.economyManager.year;
        const currentStage = this._getStage(currentYear);

        const playerPlanes = this.planeManager.planes.filter(p => p.companyId === 'player');
        let playerRoutes = 0;
        const net = this.networkManager.network['player'];
        if (net) {
            for (const origin in net) {
                playerRoutes += net[origin].length;
            }
            playerRoutes = Math.floor(playerRoutes / 2);
        }

        const context = {
            stage: currentStage,
            year: currentYear,
            funds: this.economyManager.funds,
            planeCount: playerPlanes.length,
            routeCount: playerRoutes,
            globalShare: this.competitionManager.getGlobalShare('player'),
            recentWithdrawal: this.recentWithdrawalFlag
        };

        const candidates = EVENT_DATA.filter(evt => {
            if (currentStage < evt.stageMin || currentStage > evt.stageMax) return false;
            return evt.condition(context);
        });

        if (candidates.length === 0) return;

        const selectedEvent = candidates[Math.floor(Math.random() * candidates.length)];
        this._triggerEvent(selectedEvent, context);
    }

    _triggerEvent(eventData, context) {
        this.isEventActive = true;
        this.gameManager.isPaused = true; 

        try {
            this.uiManager.showEventModal(eventData, context, (chosenOptionIdx) => {
                try {
                    const chosenOption = eventData.options[chosenOptionIdx];
                    if (chosenOption) {
                        const cost = chosenOption.getCost(context);
                        const result = chosenOption.apply(context, cost);

                        if (result.fundsDelta) {
                            this.economyManager.addFunds(result.fundsDelta);
                        }

                        if (result.satisfactionDelta && this.upgradeManager) {
                            this.upgradeManager.eventSatisfactionBonus = (this.upgradeManager.eventSatisfactionBonus || 0) + result.satisfactionDelta;
                        }

                        if (result.durationMonths) {
                            this.activeBuffs.timer = result.durationMonths * 20.0;
                            if (result.incomeRateDelta) this.activeBuffs.incomeRate = result.incomeRateDelta;
                            if (result.passengersRateDelta) this.activeBuffs.passengersRate = result.passengersRateDelta;
                        }

                        this.uiManager.showToast(result.message, result.fundsDelta < 0 ? 'info' : 'success');
                    }
                } catch (err) {
                    console.error("[EventManager] Option apply error:", err);
                } finally {
                    this.isEventActive = false;
                    this.gameManager.isPaused = false;
                    this.cooldownTimer = 90.0;
                    this.recentWithdrawalFlag = false;
                }
            });
        } catch (err) {
            console.error("[EventManager] Show event modal error:", err);
            this.isEventActive = false;
            this.gameManager.isPaused = false;
            this.cooldownTimer = 30.0;
        }
    }

    getBuffs() {
        return this.activeBuffs;
    }
}