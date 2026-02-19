/**
 * RevenueCat mock service (local storage based)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStepStore } from '../store/useStepStore';
// Import the mock auth to get the current user ID
import { auth, doc, setDoc } from './mock';
import { db } from './mock';

const ENTITLEMENT_ID = 'pro';

// ─── Initialise ──────────────────────────────────────────────────────────────

export function initRevenueCat(): void {
    console.log('[Mock RevenueCat] Initialized');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Write isPremium to Firestore (Mock) and sync Zustand in one call. */
async function upgradePremiumState(value: boolean): Promise<void> {
    // 1. Zustand (instant, local)
    useStepStore.getState().setPremium(value);

    // 2. Storage (persisted via mock Firestore)
    const user = auth.currentUser;
    if (user) {
        await setDoc(
            doc(db, 'users', user.uid),
            { isPremium: value },
            { merge: true },
        );
    }
}

/** Returns true if the user has an active Pro entitlement. */
export async function checkPremiumStatus(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    // Check our mock store
    // We can read from the store directly or check the 'users/{uid}' doc
    // Easier: check Zustand first (it hydrates from storage?)
    // Actually, let's read the mock doc to be sure
    const key = `mock_doc_users_${user.uid}`;
    const json = await AsyncStorage.getItem(key);
    if (json) {
        const data = JSON.parse(json);
        return !!data.isPremium;
    }
    return false;
}

// ─── Offerings ────────────────────────────────────────────────────────────────

export interface StepXPOffering {
    monthly: any;
    annual: any;
}

// Mock packages
const MOCK_MONTHLY = {
    identifier: 'stepxp_pro_monthly',
    packageType: 'MONTHLY',
    product: {
        identifier: 'stepxp_pro_monthly',
        priceString: '$4.99',
        price: 4.99,
        title: 'StepXP Pro Monthly',
        description: 'Unlock 1.5x XP Boost',
    },
};

const MOCK_ANNUAL = {
    identifier: 'stepxp_pro_annual',
    packageType: 'ANNUAL',
    product: {
        identifier: 'stepxp_pro_annual',
        priceString: '$39.99',
        price: 39.99,
        title: 'StepXP Pro Annual',
        description: 'Unlock 1.5x XP Boost (Save 33%)',
    },
};

export async function getStepXPOfferings(): Promise<StepXPOffering> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    return {
        monthly: MOCK_MONTHLY,
        annual: MOCK_ANNUAL,
    };
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export async function purchaseProPlan(
    pkg: any,
): Promise<boolean> {
    console.log(`[Mock RevenueCat] Purchasing ${pkg.identifier}...`);
    await new Promise(r => setTimeout(r, 1500)); // Simulate processing

    // Always succeed in mock
    await upgradePremiumState(true);
    return true;
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<boolean> {
    console.log('[Mock RevenueCat] Restoring...');
    await new Promise(r => setTimeout(r, 1000));

    const isPro = await checkPremiumStatus();
    // If we want to simulate a restore success for demo:
    // await upgradePremiumState(true); return true;

    // Just return actual state
    await upgradePremiumState(isPro);
    return isPro;
}
