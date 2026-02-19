import { useState, useEffect, useCallback } from 'react';
import { getLocales } from 'expo-localization';
import { auth } from '../services/firebase';
import { useStepStore } from '../store/useStepStore';
import {
    fetchGlobalTop50,
    fetchLocalTop50,
    fetchMyGlobalRank,
    fetchMyLocalRank,
    type LeaderboardUser,
    type TimeFilter,
} from '../services/leaderboard';

export type LeaderboardTab = 'local' | 'global';

interface UseLeaderboardReturn {
    users: LeaderboardUser[];
    myRank: number | null;
    myUser: LeaderboardUser | null;
    loading: boolean;
    error: string | null;
    activeTab: LeaderboardTab;
    timeFilter: TimeFilter;
    setActiveTab: (tab: LeaderboardTab) => void;
    setTimeFilter: (f: TimeFilter) => void;
    refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeaderboard(): UseLeaderboardReturn {
    const { stepsToday, stepsWeek, stepsMonth, totalXP } = useStepStore() as any;
    const currentUser = auth.currentUser;

    // Get the device country once (ISO 3166-1 alpha-2, e.g. "HR")
    const country = getLocales()[0]?.regionCode ?? 'US';

    const [activeTab, setActiveTab] = useState<LeaderboardTab>('local');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // My current value for the active filter
    const myValue = (() => {
        switch (timeFilter) {
            case 'daily': return stepsToday ?? 0;
            case 'weekly': return stepsWeek ?? 0;
            case 'monthly': return stepsMonth ?? 0;
            case 'allTime': return totalXP ?? 0;
        }
    })();

    const load = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        try {
            const [boardUsers, rank] = await Promise.all([
                activeTab === 'global'
                    ? fetchGlobalTop50(timeFilter)
                    : fetchLocalTop50(country, timeFilter),
                activeTab === 'global'
                    ? fetchMyGlobalRank(currentUser.uid, timeFilter, myValue)
                    : fetchMyLocalRank(currentUser.uid, country, timeFilter, myValue),
            ]);

            setUsers(boardUsers);
            setMyRank(rank);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    }, [activeTab, timeFilter, currentUser, myValue, country]);

    useEffect(() => {
        load();
    }, [load]);

    // Build a synthetic "me" entry for the sticky bar
    const myUser: LeaderboardUser | null = currentUser
        ? {
            uid: currentUser.uid,
            displayName: currentUser.displayName ?? 'You',
            photoURL: currentUser.photoURL ?? undefined,
            totalXP: totalXP ?? 0,
            stepsToday: stepsToday ?? 0,
            rank: myRank ?? 0,
        }
        : null;

    return {
        users,
        myRank,
        myUser,
        loading,
        error,
        activeTab,
        timeFilter,
        setActiveTab,
        setTimeFilter,
        refresh: load,
    };
}
