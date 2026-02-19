/**
 * RevenueCat service
 *
 * Replace REVENUECAT_IOS_KEY and REVENUECAT_ANDROID_KEY with your
 * API keys from app.revenuecat.com → Project → Apps.
 *
 * Entitlement identifier in RevenueCat dashboard must be: "pro"
 * Product identifiers:  "stepxp_pro_monthly"  /  "stepxp_pro_annual"
 */

import { Platform } from 'react-native';
import Purchases, {
    LOG_LEVEL,
    type PurchasesPackage,
} from 'react-native-purchases';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useStepStore } from '../store/useStepStore';

const REVENUECAT_IOS_KEY = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_ANDROID_KEY = 'goog_YOUR_ANDROID_KEY_HERE';
const ENTITLEMENT_ID = 'pro';

// ─── Initialise (call once from root _layout) ────────────────────────────────

export function initRevenueCat(): void {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    Purchases.configure({
        apiKey: Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY,
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Write isPremium to Firestore and sync Zustand in one call. */
async function upgradePremiumState(value: boolean): Promise<void> {
    // 1. Zustand (instant, local)
    useStepStore.getState().setPremium(value);

    // 2. Firestore (persisted)
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
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

// ─── Offerings ────────────────────────────────────────────────────────────────

export interface StepXPOffering {
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
}

export async function getStepXPOfferings(): Promise<StepXPOffering> {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) return { monthly: null, annual: null };

    return {
        monthly: current.monthly ?? null,
        annual: current.annual ?? null,
    };
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

/**
 * Initiate a purchase flow for a given package.
 * Returns true on success, throws on user cancellation / error.
 */
export async function purchaseProPlan(
    pkg: PurchasesPackage,
): Promise<boolean> {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (isPro) await upgradePremiumState(true);
    return isPro;
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<boolean> {
    const info = await Purchases.restorePurchases();
    const isPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    await upgradePremiumState(isPro);
    return isPro;
}
