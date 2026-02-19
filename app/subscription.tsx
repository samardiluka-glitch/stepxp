import { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Zap, BarChart2, Medal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import type { PurchasesPackage } from 'react-native-purchases';
// Define minimal type for mock
interface PurchasesPackage {
    product: {
        priceString: string;
        description: string;
        identifier: string;
    };
}
import {
    getStepXPOfferings,
    purchaseProPlan,
    restorePurchases,
} from '../src/services/revenuecat';
import { useStepStore } from '../src/store/useStepStore';

const GREEN = '#22c55e';

// ── Feature list (no Ad row — removed) ───────────────────────────────────────
const FEATURES = [
    {
        icon: <Zap size={20} color="#22c55e" />,
        bg: '#dcfce7',
        title: '1.5× XP Boost',
        desc: 'Earn 50% more XP on every step you take.',
    },
    {
        icon: <BarChart2 size={20} color="#22c55e" />,
        bg: '#dcfce7',
        title: 'Advanced Stats',
        desc: 'Detailed insights into your recovery and performance trends.',
    },
    {
        icon: <Medal size={20} color="#22c55e" />,
        bg: '#dcfce7',
        title: 'Custom Badges',
        desc: 'Stand out in the community with exclusive profile flair.',
    },
];

export default function SubscriptionScreen() {
    const router = useRouter();
    const { isPremium } = useStepStore();

    const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
    const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
    const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        getStepXPOfferings()
            .then(({ monthly: m, annual: a }) => {
                setMonthly(m);
                setAnnual(a);
            })
            .catch(console.warn)
            .finally(() => setFetching(false));
    }, []);

    // Monthly price string
    const monthlyPrice = monthly?.product.priceString ?? '$4.99';
    const annualPrice = annual?.product.priceString ?? '$39.99';

    const handleUpgrade = async () => {
        const pkg = selected === 'monthly' ? monthly : annual;
        if (!pkg) {
            Alert.alert('Unavailable', 'This plan is not available right now. Please try again.');
            return;
        }
        setLoading(true);
        try {
            const success = await purchaseProPlan(pkg);
            if (success) {
                Alert.alert('🎉 Welcome to Pro!', 'Your 1.5× XP Boost is now active.', [
                    { text: "Let\u2019s go!", onPress: () => router.back() },
                ]);
            }
        } catch (e: any) {
            // PurchasesErrorCode.purchaseCancelledError — user tapped back
            if (e?.userCancelled) return;
            Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const isPro = await restorePurchases();
            if (isPro) {
                Alert.alert('Purchases Restored ✓', 'Pro access has been re-activated.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Nothing to restore', 'No previous Pro purchase found on this account.');
            }
        } catch (e: any) {
            Alert.alert('Restore failed', e?.message ?? 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Current status card ─────────────────────────────────── */}
                <LinearGradient
                    colors={['#f0fdf4', '#dcfce7']}
                    style={styles.statusCard}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusLabel}>Your Status</Text>
                        <Text style={styles.statusPlan}>
                            {isPremium ? 'StepXP Pro ⚡' : 'StepXP Free'}
                        </Text>
                        <Text style={styles.statusDesc}>
                            {isPremium ? '1.5× XP Boost active' : 'Basic tracking enabled'}
                        </Text>
                    </View>
                    <View style={[styles.activePill, isPremium && { backgroundColor: GREEN }]}>
                        <Text style={[styles.activePillText, isPremium && { color: '#fff' }]}>
                            {isPremium ? 'PRO' : 'ACTIVE'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* ── Feature list ────────────────────────────────────────── */}
                <Text style={styles.unlockTitle}>Unlock Your Full Potential</Text>

                {FEATURES.map((f) => (
                    <View key={f.title} style={styles.featureRow}>
                        <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>{f.icon}</View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureDesc}>{f.desc}</Text>
                        </View>
                    </View>
                ))}

                {/* ── Price cards ────────────────────────────────────────── */}
                {fetching ? (
                    <ActivityIndicator color={GREEN} style={{ marginVertical: 24 }} />
                ) : (
                    <View style={styles.priceRow}>
                        {/* Monthly */}
                        <TouchableOpacity
                            style={[styles.priceCard, selected === 'monthly' && styles.priceCardSelected]}
                            onPress={() => setSelected('monthly')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.pricePeriod}>Monthly</Text>
                            <Text style={styles.priceAmount}>{monthlyPrice}</Text>
                            <Text style={styles.priceSub}>per month</Text>
                        </TouchableOpacity>

                        {/* Annual — BEST VALUE */}
                        <TouchableOpacity
                            style={[styles.priceCard, styles.priceCardAnnual, selected === 'annual' && styles.priceCardSelected]}
                            onPress={() => setSelected('annual')}
                            activeOpacity={0.85}
                        >
                            <View style={styles.bestValueBadge}>
                                <Text style={styles.bestValueText}>BEST VALUE</Text>
                            </View>
                            <Text style={styles.pricePeriod}>Annual</Text>
                            <Text style={[styles.priceAmount, { color: GREEN }]}>{annualPrice}</Text>
                            <Text style={styles.priceSub}>Save 33% per year</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Upgrade button ─────────────────────────────────────── */}
                {isPremium ? (
                    <View style={styles.alreadyProBanner}>
                        <CheckCircle2 size={18} color={GREEN} />
                        <Text style={styles.alreadyProText}>You're already on Pro!</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={handleUpgrade}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
                        }
                    </TouchableOpacity>
                )}

                {/* ── Restore & legal ────────────────────────────────────── */}
                <TouchableOpacity onPress={handleRestore} disabled={loading}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                <View style={styles.legalRow}>
                    <Text style={styles.legalLink}>Terms of Service</Text>
                    <Text style={styles.legalDot}>·</Text>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                </View>

                {/* ── Motivational banner ─────────────────────────────────── */}
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.motivationCard}>
                    <Text style={styles.motivationQuote}>
                        "The only limit is the one you set yourself."
                    </Text>
                </LinearGradient>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 12, paddingHorizontal: 18,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

    content: { padding: 20, gap: 14, paddingBottom: 50 },

    // Status
    statusCard: {
        borderRadius: 18, padding: 18,
        flexDirection: 'row', alignItems: 'center',
    },
    statusLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', letterSpacing: 0.8 },
    statusPlan: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
    statusDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
    activePill: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 999, backgroundColor: '#e2e8f0',
    },
    activePillText: { fontSize: 11, fontWeight: '700', color: '#64748b' },

    // Features
    unlockTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 4 },
    featureRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    featureTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    featureDesc: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },

    // Price
    priceRow: { flexDirection: 'row', gap: 12 },
    priceCard: {
        flex: 1, borderRadius: 18, backgroundColor: '#fff', padding: 16,
        borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'flex-start', gap: 4,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    priceCardAnnual: { borderColor: '#e2e8f0', position: 'relative', overflow: 'visible' },
    priceCardSelected: { borderColor: GREEN },
    bestValueBadge: {
        position: 'absolute', top: -10, right: 10,
        backgroundColor: GREEN, borderRadius: 999,
        paddingHorizontal: 10, paddingVertical: 3,
    },
    bestValueText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    pricePeriod: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 8 },
    priceAmount: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
    priceSub: { fontSize: 11, color: '#94a3b8' },

    // Upgrade
    upgradeBtn: {
        backgroundColor: GREEN, borderRadius: 18,
        paddingVertical: 18, alignItems: 'center',
        shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    },
    upgradeBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
    alreadyProBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: 16,
        backgroundColor: '#f0fdf4', borderRadius: 14,
    },
    alreadyProText: { fontSize: 15, fontWeight: '600', color: GREEN },

    restoreText: { textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    legalLink: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    legalDot: { color: '#cbd5e1' },

    motivationCard: {
        borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 4,
    },
    motivationQuote: {
        fontSize: 15, color: '#475569', fontStyle: 'italic', textAlign: 'center', lineHeight: 22,
    },
});
