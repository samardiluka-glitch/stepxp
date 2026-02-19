// ─── XP & Leveling Engine ────────────────────────────────────────────────────

/** 1 step = 0.1 XP */
export const STEPS_TO_XP = 0.1;

/** One-time daily bonus awarded when steps reach this target */
export const DAILY_GOAL_STEPS = 10_000;
export const DAILY_GOAL_BONUS_XP = 500;

// ─── Rank table ──────────────────────────────────────────────────────────────

export type Rank =
    | 'Static'
    | 'Crawler'
    | 'Stroller'
    | 'Walker'
    | 'Hiker'
    | 'Scout'
    | 'Ranger'
    | 'Athlete'
    | 'Machine'
    | 'Titan';

interface RankBand {
    min: number; // inclusive level
    max: number; // inclusive level
    rank: Rank;
}

const RANK_BANDS: RankBand[] = [
    { min: 1, max: 10, rank: 'Static' },
    { min: 11, max: 20, rank: 'Crawler' },
    { min: 21, max: 30, rank: 'Stroller' },
    { min: 31, max: 40, rank: 'Walker' },
    { min: 41, max: 50, rank: 'Hiker' },
    { min: 51, max: 60, rank: 'Scout' },
    { min: 61, max: 70, rank: 'Ranger' },
    { min: 71, max: 80, rank: 'Athlete' },
    { min: 81, max: 90, rank: 'Machine' },
    { min: 91, max: 100, rank: 'Titan' },
];

// ─── Pure calculation functions ───────────────────────────────────────────────

/**
 * Convert raw step count to XP earned from walking.
 * 1 step → 0.1 XP.
 */
export function stepsToXP(steps: number): number {
    return steps * STEPS_TO_XP;
}

/**
 * Returns true if the daily goal bonus should be granted.
 * Callers should ensure the bonus is only applied once per day.
 */
export function isDailyGoalReached(stepsToday: number): boolean {
    return stepsToday >= DAILY_GOAL_STEPS;
}

/**
 * Calculate level from total XP.
 * Level = floor(sqrt(totalXP / 100))
 * Minimum returned level is 1 if XP > 0, otherwise 0.
 */
export function calculateLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Determine the rank title for a given level.
 * Returns undefined for levels outside the defined bands (e.g. level 0).
 */
export function getRank(level: number): Rank | undefined {
    for (const band of RANK_BANDS) {
        if (level >= band.min && level <= band.max) {
            return band.rank;
        }
    }
    return undefined;
}

/**
 * How much total XP is required to reach the START of a given level.
 * Inverse of calculateLevel: XP = level² × 100.
 */
export function xpRequiredForLevel(level: number): number {
    return level * level * 100;
}

/**
 * Progress (0–1) toward the NEXT level.
 */
export function levelProgress(totalXP: number): number {
    const level = calculateLevel(totalXP);
    const currentFloor = xpRequiredForLevel(level);
    const nextFloor = xpRequiredForLevel(level + 1);
    const range = nextFloor - currentFloor;
    if (range <= 0) return 1;
    return (totalXP - currentFloor) / range;
}

/**
 * All-in-one result object for UI consumption.
 */
export interface EvolutionState {
    totalXP: number;
    level: number;
    rank: Rank | undefined;
    progress: number; // 0–1 toward next level
    xpToNextLevel: number;
}

export function computeEvolution(totalXP: number): EvolutionState {
    const level = calculateLevel(totalXP);
    const rank = getRank(level);
    const progress = levelProgress(totalXP);
    const xpToNextLevel = Math.max(0, xpRequiredForLevel(level + 1) - totalXP);

    return { totalXP, level, rank, progress, xpToNextLevel };
}

// ─── Rank-band progress (for dashboard "X% to NEXT_RANK" bar) ────────────────

export interface RankProgressInfo {
    /** 0–1 progress through the current rank band's XP range */
    progress: number;
    currentRank: Rank | undefined;
    /** Label shown at the LEFT of the bar */
    fromLabel: string;
    /** Label shown at the RIGHT of the bar */
    toLabel: string;
    /** Integer percentage e.g. 72 */
    pct: number;
}

/**
 * Progress within the current RANK band (not just next level).
 * Used for the "72% to HIKER" dashboard display.
 */
export function getRankProgress(totalXP: number): RankProgressInfo {
    const level = calculateLevel(totalXP);
    const bandIndex = RANK_BANDS.findIndex(
        (b) => level >= b.min && level <= b.max,
    );

    if (bandIndex === -1) {
        return { progress: 0, currentRank: undefined, fromLabel: '—', toLabel: '—', pct: 0 };
    }

    const band = RANK_BANDS[bandIndex];
    const nextBand = RANK_BANDS[bandIndex + 1];

    const startXP = xpRequiredForLevel(band.min);
    const endXP = xpRequiredForLevel(band.max + 1);
    const range = endXP - startXP;

    const progress = range > 0
        ? Math.min(Math.max((totalXP - startXP) / range, 0), 1)
        : 1;

    return {
        progress,
        currentRank: band.rank,
        fromLabel: band.rank.toUpperCase(),
        toLabel: nextBand ? `PRO ${nextBand.rank.toUpperCase()}` : 'MAX',
        pct: Math.round(progress * 100),
    };
}
