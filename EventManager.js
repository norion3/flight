/**
 * AI可読性・先祖返り防止コメント:
 * 【安全な再開フォールバックの実装】
 * 1. `_triggerEvent` 内でモーダル表示時にエラーが起きた場合でも、即座に一時停止を解除して
 * ゲームがフリーズするのを防ぐ `try...catch / finally` ガードを追加。
 * 2. 選択肢を選んだ後の結果反映と一時停止解除が100%確実に完了するよう保証しています。
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
        if (this.isEventActive) return;

        if (this.activeBuffs.timer > 0) {
            this.activeBuffs.timer -= delta;
            if (this.activeBuffs.timer <= 0) {
                this.activeBuffs.incomeRate = 0;
                this.activeBuffs.passengersRate = 0;
            }
        }

        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= delta;
            return;
        }

        this.checkTimer += delta;
        if (this.checkTimer >= 20.0) {
            this.checkTimer = 0;
            this._tryTriggerRandomEvent();
        }
    }

    _determinePlayerStage(passengers, planeCount, share) {
        if (passengers >= 1000000 || share >= 0.75) return 6;
        if (passengers >= 400000 || share >= 0.60) return 5;
        if (passengers >= 150000 || share >= 0.45) return 4;
        if (passengers >= 50000 || share >= 0.30) return 3;
        if (passengers >= 15000 || share >= 0.15) return 2;
        return 1;
    }

    _tryTriggerRandomEvent() {
        if (Math.random() > 0.12) return;

        const currentFunds = this.economyManager.funds;
        const totalPassengers = this.economyManager.totalPassengers;
        const counts = this.planeManager.getPlaneCounts('player');
        const planeCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
        const playerShare = this.competitionManager.getGlobalShare('player');

        const stage = this._determinePlayerStage(totalPassengers, planeCount, playerShare);

        let topRivalShare = 0;
        CONFIG.COMPANIES.forEach(comp => {
            if (comp.id !== 'player') {
                const s = this.competitionManager.getGlobalShare(comp.id);
                if (s > topRivalShare) topRivalShare = s;
            }
        });

        const isDeadHeat = Math.abs(playerShare - topRivalShare) <= 0.05 && playerShare > 0.15;
        const isRivalDominant = (topRivalShare - playerShare) >= 0.10;
        const isSoloLeader = playerShare >= 0.65 && (playerShare - topRivalShare) >= 0.20;

        const context = {
            funds: currentFunds,
            passengers: totalPassengers,
            planeCount: planeCount,
            share: playerShare,
            stage: stage,
            isDeadHeat: isDeadHeat,
            isRivalDominant: isRivalDominant,
            isSoloLeader: isSoloLeader,
            recentWithdrawal: this.recentWithdrawalFlag
        };

        const candidates = EVENT_DATA.filter(ev => {
            if (stage < ev.stageMin || stage > ev.stageMax) return false;
            return ev.condition(context);
        });

        if (candidates.length === 0) return;

        const selectedEvent = candidates[Math.floor(Math.random() * candidates.length)];
        this._triggerEvent(selectedEvent, context);
    }

    _triggerEvent(eventData, context) {
        try {
            this.isEventActive = true;
            this.gameManager.isPaused = true;

            this.uiManager.showEventModal(eventData, context, (optionIndex) => {
                try {
                    const selectedOption = eventData.options[optionIndex];
                    if (selectedOption) {
                        const cost = selectedOption.getCost(context);
                        const result = selectedOption.apply(context, cost);

                        if (result.fundsDelta !== undefined && result.fundsDelta !== 0) {
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