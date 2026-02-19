import { useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Footprints, MapPin, Timer, PersonStanding } from 'lucide-react-native';
import { auth, onAuthStateChanged } from '../../src/services/firebase';
import { useStepStore } from '../../src/store/useStepStore';
import { getRankProgress, DAILY_GOAL_STEPS } from '../../src/services/evolution';
import { CircularProgress } from '../../src/components/CircularProgress';
import { StatCard } from '../../src/components/StatCard';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.62;

// ── Derived stats helpers ─────────────────────────────────────────────────────
const stepsToCalories = (s: number) => Math.round(s * 0.04);
const stepsToKm = (s: number) => (s * 0.0008).toFixed(1);
const stepsToMinutes = (s: number) => Math.round(s / 100);

// ── Electric Gold glow colours ────────────────────────────────────────────────
const GREEN = '#22c55e';
const GOLD = '#FACC15';
const GOLD_GLOW_SHADOW = {
    shadowColor: GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
};
const DEFAULT_SHADOW = {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
};

export default function HomeScreen() {
    const router = useRouter();

    // ── Auth guard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) router.replace('/auth/login');
        });
        return unsub;
    }, []);

    // ── Store ───────────────────────────────────────────────────────────────────
    const { stepsToday, totalXP, currentLevel } = useStepStore();

    // Rank progress for the evolution bar
    const rankInfo = getRankProgress(totalXP);

    // Daily ring progress (0→1 toward 10k goal)
    const ringProgress = Math.min(stepsToday / DAILY_GOAL_STEPS, 1);
    const stepsLeft = Math.max(DAILY_GOAL_STEPS - stepsToday, 0);

    // Electric Gold trigger
    const goalReached = stepsToday >= DAILY_GOAL_STEPS;
    const ringColor = goalReached ? GOLD : GREEN;
    const cardShadow = goalReached ? GOLD_GLOW_SHADOW : DEFAULT_SHADOW;

    // Gold pulse animation when goal is reached
    const glowAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (goalReached) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
                ]),
            ).start();
        } else {
            glowAnim.setValue(0);
        }
    }, [goalReached]);

    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

    // Derived stats
    const calories = stepsToCalories(stepsToday);
    const distanceKm = stepsToKm(stepsToday);
    const activeMin = stepsToMinutes(stepsToday);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {/* Avatar placeholder */}
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <PersonStanding size={22} color="#fff" />
                        </View>
                        {/* Level badge */}
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>{currentLevel}</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
                        <Text style={styles.userName}>Alex</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
                    <Settings size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* ── Step Counter Card ───────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.stepCard,
                    cardShadow,
                    goalReached && { opacity: glowOpacity },
                ]}
            >
                {/* Ring */}
                <View style={styles.ringContainer}>
                    <CircularProgress
                        progress={ringProgress}
                        size={RING_SIZE}
                        strokeWidth={18}
                        color={ringColor}
                        trackColor="#e5e7eb"
                    />

                    {/* Center content (overlaid on the ring) */}
                    <View style={styles.ringCenter}>
                        <Footprints size={26} color={ringColor} style={{ marginBottom: 4 }} />
                        <Text style={[styles.stepCount, goalReached && { color: GOLD }]}>
                            {stepsToday.toLocaleString()}
                        </Text>
                        <Text style={styles.stepLabel}>Steps Today</Text>
                        {goalReached && (
                            <Text style={styles.goalBadge}>⚡ GOAL REACHED!</Text>
                        )}
                    </View>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>GOAL</Text>
                        <Text style={styles.statValue}>
                            {DAILY_GOAL_STEPS.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>LEFT</Text>
                        <Text style={styles.statValue}>{stepsLeft.toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>CALORIES</Text>
                        <Text style={styles.statValue}>{calories} kcal</Text>
                    </View>
                </View>
            </Animated.View>

            {/* ── Evolution Card ──────────────────────────────────────────────────── */}
            <View style={styles.evolutionCard}>
                {/* Top row */}
                <View style={styles.evolutionTop}>
                    <View style={styles.hikerIconWrap}>
                        <Text style={{ fontSize: 20 }}>🥾</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.rankTitle}>
                            {rankInfo.pct}% to{' '}
                            <Text style={styles.rankHighlight}>
                                {rankInfo.toLabel.replace('PRO ', '')}
                            </Text>
                        </Text>
                        <Text style={styles.rankSub}>Keep going, Alex!</Text>
                    </View>

                    {/* Level pill */}
                    <View style={styles.levelPill}>
                        <Text style={styles.levelPillText}>Level {currentLevel}</Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.rankBarTrack}>
                    <View
                        style={[
                            styles.rankBarFill,
                            { width: `${rankInfo.pct}%` },
                        ]}
                    />
                </View>

                {/* Labels */}
                <View style={styles.rankLabels}>
                    <Text style={styles.rankLabelText}>{rankInfo.fromLabel}</Text>
                    <Text style={styles.rankLabelText}>
                        ✦ {rankInfo.toLabel}
                    </Text>
                </View>
            </View>

            {/* ── Bottom stat cards ───────────────────────────────────────────────── */}
            <View style={styles.bottomCards}>
                <StatCard
                    icon={<MapPin size={18} color="#6366f1" />}
                    label="Distance"
                    value={`${distanceKm} km`}
                    style={{ marginRight: 8 }}
                />
                <StatCard
                    icon={<Timer size={18} color="#f97316" />}
                    label="Active Time"
                    value={`${activeMin} min`}
                    style={{ marginLeft: 8 }}
                />
            </View>
        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    content: {
        padding: 20,
        paddingBottom: 32,
        gap: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -2,
        right: -4,
        backgroundColor: GREEN,
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    levelBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    welcomeLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1.5,
        color: '#94a3b8',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    settingsBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    // Step card
    stepCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        paddingBottom: 20,
        alignItems: 'center',
    },
    ringContainer: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    stepCount: {
        fontSize: 44,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -2,
        lineHeight: 50,
    },
    stepLabel: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 2,
    },
    goalBadge: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: '700',
        color: GOLD,
        letterSpacing: 1,
    },

    // Stats row inside step card
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1.2,
        color: '#94a3b8',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    divider: {
        width: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 2,
    },

    // Evolution card
    evolutionCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        gap: 12,
    },
    evolutionTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    hikerIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    rankHighlight: {
        color: GREEN,
    },
    rankSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 1,
    },
    levelPill: {
        backgroundColor: '#f0fdf4',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    levelPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: GREEN,
    },
    rankBarTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: '#e5e7eb',
        overflow: 'hidden',
    },
    rankBarFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: GREEN,
    },
    rankLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rankLabelText: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },

    // Bottom stat cards
    bottomCards: {
        flexDirection: 'row',
    },
});
