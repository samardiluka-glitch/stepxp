import {
    collection,
    query,
    orderBy,
    limit,
    where,
    getDocs,
    getCountFromServer,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    totalXP: number;
    stepsToday: number;
    stepsWeek?: number;
    stepsMonth?: number;
    country?: string;
    lastSync?: Timestamp;
    rank: number;
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'allTime';

/** Map the time filter to the Firestore field to sort by */
function filterField(filter: TimeFilter): string {
    switch (filter) {
        case 'daily': return 'stepsToday';
        case 'weekly': return 'stepsWeek';
        case 'monthly': return 'stepsMonth';
        case 'allTime': return 'totalXP';
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToUser(doc: any, rank: number): LeaderboardUser {
    const d = doc.data();
    return {
        uid: doc.id,
        displayName: d.displayName ?? 'Anonymous',
        photoURL: d.photoURL,
        totalXP: d.totalXP ?? 0,
        stepsToday: d.stepsToday ?? 0,
        stepsWeek: d.stepsWeek,
        stepsMonth: d.stepsMonth,
        country: d.country,
        lastSync: d.lastSync,
        rank,
    };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch the Top 50 users globally, ordered by the chosen time filter. */
export async function fetchGlobalTop50(
    filter: TimeFilter,
): Promise<LeaderboardUser[]> {
    const field = filterField(filter);
    const q = query(
        collection(db, 'users'),
        orderBy(field, 'desc'),
        limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc, i) => docToUser(doc, i + 1));
}

/** Fetch the Top 50 users in the given country code (ISO 3166-1 alpha-2). */
export async function fetchLocalTop50(
    country: string,
    filter: TimeFilter,
): Promise<LeaderboardUser[]> {
    const field = filterField(filter);
    const q = query(
        collection(db, 'users'),
        where('country', '==', country),
        orderBy(field, 'desc'),
        limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc, i) => docToUser(doc, i + 1));
}

/**
 * Get the current user's rank in the global leaderboard.
 * Uses getCountFromServer for a single-document read (no extra bandwidth).
 */
export async function fetchMyGlobalRank(
    uid: string,
    filter: TimeFilter,
    myValue: number,
): Promise<number> {
    const field = filterField(filter);
    // Count of users strictly above me
    const above = query(
        collection(db, 'users'),
        where(field, '>', myValue),
    );
    const snap = await getCountFromServer(above);
    return snap.data().count + 1;
}

/** Same rank query scoped to a country. */
export async function fetchMyLocalRank(
    uid: string,
    country: string,
    filter: TimeFilter,
    myValue: number,
): Promise<number> {
    const field = filterField(filter);
    const above = query(
        collection(db, 'users'),
        where('country', '==', country),
        where(field, '>', myValue),
    );
    const snap = await getCountFromServer(above);
    return snap.data().count + 1;
}
