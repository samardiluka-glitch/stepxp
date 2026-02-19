import { create } from 'zustand';
import {
    stepsToXP,
    calculateLevel,
    getRank,
    levelProgress,
    xpRequiredForLevel,
    isDailyGoalReached,
    DAILY_GOAL_BONUS_XP,
    type Rank,
} from '../services/evolution';

// ─── State shape ─────────────────────────────────────────────────────────────

interface StepState {
    // Core stats
    totalXP: number;
    currentLevel: number;
    currentRank: Rank | undefined;
    progress: number;       // 0–1 toward next level
    xpToNextLevel: number;

    // Daily tracking
    stepsToday: number;
    dailyBonusGranted: boolean; // prevent double-awarding in one session

    // Premium flag
    isPremium: boolean;

    // ── Actions ────────────────────────────────────────────────────────────────

    /** Add new steps (e.g. from a health sensor poll). Handles XP + daily bonus. */
    addSteps: (newSteps: number) => void;

    /** Directly set total XP (e.g. loaded from Firestore on app start). */
    hydrate: (totalXP: number, stepsToday: number, isPremium: boolean) => void;

    /** Toggle premium manually (or call after a purchase event). */
    setPremium: (value: boolean) => void;

    /** Reset daily counters — call at midnight or on a new-day login. */
    resetDailyStats: () => void;

    /**
     * Called by useHealthSync with the absolute step total for today
     * and the XP multiplier (1 normal, 1.5 premium).
     * Only the XP delta gets multiplied — stepsToday stays raw.
     * Returns the new totalXP so the caller can write it to Firestore.
     */
    syncFromHealth: (rawStepsToday: number, xpMultiplier: number) => number;
}

// ─── Helper: recompute derived fields from XP ────────────────────────────────

function deriveFromXP(xp: number) {
    const level = calculateLevel(xp);
    return {
        currentLevel: level,
        currentRank: getRank(level),
        progress: levelProgress(xp),
        xpToNextLevel: Math.max(0, xpRequiredForLevel(level + 1) - xp),
    };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStepStore = create<StepState>((set, get) => ({
    totalXP: 0,
    currentLevel: 0,
    currentRank: undefined,
    progress: 0,
    xpToNextLevel: xpRequiredForLevel(1),

    stepsToday: 0,
    dailyBonusGranted: false,

    isPremium: false,

    // ── addSteps ───────────────────────────────────────────────────────────────
    addSteps(newSteps) {
        if (newSteps <= 0) return;

        const { totalXP, stepsToday, dailyBonusGranted } = get();

        const updatedStepsToday = stepsToday + newSteps;
        let earnedXP = stepsToXP(newSteps);

        // One-time +500 XP daily goal bonus
        let bonusGranted = dailyBonusGranted;
        if (!dailyBonusGranted && isDailyGoalReached(updatedStepsToday)) {
            earnedXP += DAILY_GOAL_BONUS_XP;
            bonusGranted = true;
        }

        const updatedXP = totalXP + earnedXP;

        set({
            totalXP: updatedXP,
            stepsToday: updatedStepsToday,
            dailyBonusGranted: bonusGranted,
            ...deriveFromXP(updatedXP),
        });
    },

    // ── hydrate ────────────────────────────────────────────────────────────────
    hydrate(totalXP, stepsToday, isPremium) {
        set({
            totalXP,
            stepsToday,
            isPremium,
            dailyBonusGranted: isDailyGoalReached(stepsToday),
            ...deriveFromXP(totalXP),
        });
    },

    // ── setPremium ─────────────────────────────────────────────────────────────
    setPremium(value) {
        set({ isPremium: value });
    },

    // ── resetDailyStats ────────────────────────────────────────────────────────
    resetDailyStats() {
        set({ stepsToday: 0, dailyBonusGranted: false });
    },

    // ── syncFromHealth ─────────────────────────────────────────────────────────
    syncFromHealth(rawStepsToday, xpMultiplier) {
        const { totalXP, stepsToday: prevSteps, dailyBonusGranted } = get();

        // Only process positive deltas
        const delta = Math.max(rawStepsToday - prevSteps, 0);

        // No new steps — nothing to do
        if (delta === 0) return totalXP;

        // XP from new steps with multiplier applied
        let earnedXP = stepsToXP(delta) * xpMultiplier;

        // One-time daily goal bonus (bonus itself is NOT multiplied)
        let bonusGranted = dailyBonusGranted;
        if (!dailyBonusGranted && isDailyGoalReached(rawStepsToday)) {
            earnedXP += DAILY_GOAL_BONUS_XP;
            bonusGranted = true;
        }

        const updatedXP = totalXP + earnedXP;

        set({
            totalXP: updatedXP,
            stepsToday: rawStepsToday,   // raw count, not multiplied
            dailyBonusGranted: bonusGranted,
            ...deriveFromXP(updatedXP),
        });

        return updatedXP;
    },
}));
