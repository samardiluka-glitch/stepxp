/**
 * useHealthSync
 *
 * • Requests read permissions for Apple HealthKit (iOS) or
 *   Android Health Connect (Android) once on mount.
 * • Listens to AppState changes and re-fetches steps every time
 *   the app comes to the foreground.
 * • Applies a 1.5× XP multiplier for Premium users.
 * • Syncs the updated totalXP to the current user's Firestore document.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';

// ── Health APIs ───────────────────────────────────────────────────────────────
// iOS
import AppleHealthKit, {
    type HealthKitPermissions,
} from 'react-native-health';

// Android
import {
    initialize as hcInitialize,
    requestPermission as hcRequestPermission,
    readRecords,
} from 'react-native-health-connect';

// ── Firebase ──────────────────────────────────────────────────────────────────
import { auth, db, doc, setDoc, serverTimestamp } from '../services/firebase';

// ── Store ─────────────────────────────────────────────────────────────────────
import { useStepStore } from '../store/useStepStore';

// ─────────────────────────────────────────────────────────────────────────────

const PREMIUM_MULTIPLIER = 1.5;
const NORMAL_MULTIPLIER = 1.0;

// ── iOS permission descriptor ─────────────────────────────────────────────────
const IOS_PERMISSIONS: HealthKitPermissions = {
    permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
        write: [],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform-specific helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Request HealthKit read permission on iOS. Resolves true if granted. */
async function requestIOSPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(IOS_PERMISSIONS, (error) => {
            resolve(!error);
        });
    });
}

/** Request Health Connect read permission on Android. Resolves true if granted. */
async function requestAndroidPermissions(): Promise<boolean> {
    try {
        const available = await hcInitialize();
        if (!available) return false;

        const granted = await hcRequestPermission([
            { accessType: 'read', recordType: 'Steps' },
        ]);
        // granted is an array of granted permissions
        return granted.length > 0;
    } catch {
        return false;
    }
}

/** Fetch total steps for today from Apple HealthKit (iOS). */
function fetchIOSStepsToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return new Promise((resolve) => {
        AppleHealthKit.getStepCount(
            { date: startOfDay.toISOString() },
            (error, result) => {
                resolve(error ? 0 : Math.round(result.value));
            },
        );
    });
}

/** Fetch total steps for today from Health Connect (Android). */
async function fetchAndroidStepsToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    try {
        const { records } = await readRecords('Steps', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startOfDay.toISOString(),
                endTime: now.toISOString(),
            },
        });

        return records.reduce((sum: number, r: { count: number }) => sum + r.count, 0);
    } catch {
        return 0;
    }
}

/** Sync the user's totalXP and stepsToday to Firestore. */
async function syncToFirestore(totalXP: number, stepsToday: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
        doc(db, 'users', user.uid),
        {
            totalXP,
            stepsToday,
            lastSync: serverTimestamp(),
        },
        { merge: true },
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useHealthSync() {
    const { isPremium, syncFromHealth } = useStepStore();
    const permissionsGranted = useRef(false);
    const isSyncing = useRef(false);

    // ── Permission request (once per mount) ─────────────────────────────────────
    const ensurePermissions = useCallback(async (): Promise<boolean> => {
        if (permissionsGranted.current) return true;

        const granted =
            Platform.OS === 'ios'
                ? await requestIOSPermissions()
                : await requestAndroidPermissions();

        permissionsGranted.current = granted;
        return granted;
    }, []);

    // ── Main sync function ──────────────────────────────────────────────────────
    const runSync = useCallback(async () => {
        // Guard against concurrent syncs
        if (isSyncing.current) return;
        isSyncing.current = true;

        try {
            const hasPermission = await ensurePermissions();
            if (!hasPermission) return;

            // Fetch platform steps
            const rawSteps =
                Platform.OS === 'ios'
                    ? await fetchIOSStepsToday()
                    : await fetchAndroidStepsToday();

            // XP multiplier: 1.5× for premium users
            const multiplier = isPremium ? PREMIUM_MULTIPLIER : NORMAL_MULTIPLIER;

            // Update Zustand store and get back the new totalXP
            const newTotalXP = syncFromHealth(rawSteps, multiplier);

            // Push to Firestore (fire-and-forget, errors are non-fatal)
            syncToFirestore(newTotalXP, rawSteps).catch(console.warn);
        } finally {
            isSyncing.current = false;
        }
    }, [isPremium, ensurePermissions, syncFromHealth]);

    // ── Foreground listener + initial fetch ─────────────────────────────────────
    useEffect(() => {
        // Run immediately on mount
        runSync();

        // Re-run whenever app returns to foreground
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                runSync();
            }
        });

        return () => subscription.remove();
    }, [runSync]);
}
