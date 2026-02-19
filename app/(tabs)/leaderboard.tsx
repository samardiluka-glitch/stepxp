import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MoreHorizontal, User } from 'lucide-react-native';
import { useLeaderboard, type LeaderboardTab } from '../../src/hooks/useLeaderboard';
import type { LeaderboardUser, TimeFilter } from '../../src/services/leaderboard';
import { Timestamp } from '../../src/services/firebase';

const { width } = Dimensions.get('window');
const GREEN = '#22c55e';
const GOLD = '#F59E0B';
const SILVER = '#94a3b8';
const BRONZE = '#CD7C54';

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function timeAgo(ts?: Timestamp): string {
    if (!ts) return 'Active recently';
    const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
    if (secs < 60) return 'Active just now';
    if (secs < 3600) return `Active ${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `Active ${Math.floor(secs / 3600)}h ago`;
    return `Active ${Math.floor(secs / 86400)}d ago`;
}

function stepsForFilter(user: LeaderboardUser, filter: TimeFilter): number {
    switch (filter) {
        case 'daily': return user.stepsToday;
        case 'weekly': return user.stepsWeek ?? user.stepsToday;
        case 'monthly': return user.stepsMonth ?? user.stepsToday;
        case 'allTime': return user.totalXP;
    }
}

function valueLabel(filter: TimeFilter) {
    return filter === 'allTime' ? 'XP' : 'STEPS';
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
    uri,
    size = 44,
    borderColor,
}: {
    uri?: string;
    size?: number;
    borderColor?: string;
}) {
    return (
        <View
            style={[
                styles.avatarWrap,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: borderColor ?? 'transparent',
                    borderWidth: borderColor ? 3 : 0,
                },
            ]}
        >
            {uri ? (
                <Image
                    source={{ uri }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            ) : (
                <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
                    <User size={size * 0.45} color="#fff" />
                </View>
            )}
        </View>
    );
}

// ── Podium card (top-3) ───────────────────────────────────────────────────────
function PodiumCard({
    user,
    filter,
    isFirst,
}: {
    user: LeaderboardUser;
    filter: TimeFilter;
    isFirst: boolean;
}) {
    const badgeColor = user.rank === 1 ? GOLD : user.rank === 2 ? SILVER : BRONZE;
    const avatarSize = isFirst ? 76 : 60;

    return (
        <View style={[styles.podiumCard, isFirst && styles.podiumCardFirst]}>
            {isFirst && <Text style={styles.trophyIcon}>🏆</Text>}
            <Avatar uri={user.photoURL} size={avatarSize} borderColor={isFirst ? GREEN : undefined} />
            {/* Rank badge */}
            <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.rankBadgeText}>{user.rank}</Text>
            </View>
            <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
                {user.displayName}
            </Text>
            <Text style={[styles.podiumSteps, isFirst && { color: GREEN }]}>
                {stepsForFilter(user, filter).toLocaleString()}
            </Text>
        </View>
    );
}

// ── Row (rank 4+) ─────────────────────────────────────────────────────────────
function RankRow({
    user,
    filter,
}: {
    user: LeaderboardUser;
    filter: TimeFilter;
}) {
    return (
        <View style={styles.rankRow}>
            <Text style={styles.rankRowNumber}>{user.rank}</Text>
            <Avatar uri={user.photoURL} size={44} />
            <View style={styles.rankRowInfo}>
                <Text style={styles.rankRowName} numberOfLines={1}>{user.displayName}</Text>
                <Text style={styles.rankRowTime}>{timeAgo(user.lastSync)}</Text>
            </View>
            <View style={styles.rankRowRight}>
                <Text style={styles.rankRowSteps}>{stepsForFilter(user, filter).toLocaleString()}</Text>
                <Text style={styles.rankRowLabel}>{valueLabel(filter)}</Text>
            </View>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
    const router = useRouter();
    const {
        users,
        myUser,
        myRank,
        loading,
        error,
        activeTab,
        timeFilter,
        setActiveTab,
        setTimeFilter,
        refresh,
    } = useLeaderboard();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        refresh();
        // Give a moment for the spinner
        setTimeout(() => setRefreshing(false), 1200);
    };

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
        { key: 'daily', label: 'Daily' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'monthly', label: 'Monthly' },
        { key: 'allTime', label: 'All Time' },
    ];

    const TABS: { key: LeaderboardTab; label: string }[] = [
        { key: 'local', label: 'Local' },
        { key: 'global', label: 'Global' },
    ];

    return (
        <View style={styles.screen}>
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <MoreHorizontal size={20} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {/* ── Tab switcher ─────────────────────────────────────────────────── */}
            <View style={styles.tabBar}>
                {TABS.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
                        onPress={() => setActiveTab(t.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Time filter pills ─────────────────────────────────────────────── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {TIME_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterPill, timeFilter === f.key && styles.filterPillActive]}
                        onPress={() => setTimeFilter(f.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterText, timeFilter === f.key && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── Content ──────────────────────────────────────────────────────── */}
            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={GREEN} />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
                        <Text style={{ color: GREEN, fontWeight: '600' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />
                    }
                >
                    {/* ── Podium ─────────────────────────────────────────────────── */}
                    {top3.length >= 3 && (
                        <View style={styles.podium}>
                            {/* 2nd place */}
                            <PodiumCard user={top3[1]} filter={timeFilter} isFirst={false} />
                            {/* 1st place — elevated */}
                            <PodiumCard user={top3[0]} filter={timeFilter} isFirst />
                            {/* 3rd place */}
                            <PodiumCard user={top3[2]} filter={timeFilter} isFirst={false} />
                        </View>
                    )}

                    {/* ── Rank list ──────────────────────────────────────────────── */}
                    {rest.map((user) => (
                        <RankRow key={user.uid} user={user} filter={timeFilter} />
                    ))}

                    {/* Bottom padding so list doesn't hide behind sticky bar */}
                    <View style={{ height: 80 }} />
                </ScrollView>
            )}

            {/* ── Sticky My Rank bar ──────────────────────────────────────────── */}
            {myUser && myRank !== null && (
                <View style={styles.myRankBar}>
                    <Text style={styles.myRankNum}>{myRank}</Text>
                    <Avatar uri={myUser.photoURL} size={38} />
                    <View style={styles.myRankInfo}>
                        <Text style={styles.myRankName}>
                            You ({myUser.displayName})
                        </Text>
                        <Text style={styles.myRankSub}>Keep going!</Text>
                    </View>
                    <View style={styles.myRankRight}>
                        <Text style={styles.myRankSteps}>
                            {stepsForFilter(myUser, timeFilter).toLocaleString()}
                        </Text>
                        <Text style={styles.myRankLabel}>{valueLabel(timeFilter)}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    iconBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center', justifyContent: 'center',
    },

    // Tabs
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        margin: 16,
        padding: 4,
    },
    tabItem: {
        flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
    },
    tabItemActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
    tabLabelActive: { color: '#1e293b' },

    // Time filter
    filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    filterPill: {
        paddingHorizontal: 16, paddingVertical: 7,
        borderRadius: 999, backgroundColor: '#f1f5f9',
    },
    filterPillActive: { backgroundColor: GREEN },
    filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    filterTextActive: { color: '#fff' },

    // Content
    listContent: { paddingHorizontal: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    errorText: { color: '#ef4444', fontSize: 14 },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f0fdf4', borderRadius: 10 },

    // Podium
    podium: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        marginTop: 8,
    },
    podiumCard: {
        alignItems: 'center',
        width: (width - 64) / 3,
        gap: 6,
        paddingBottom: 8,
    },
    podiumCardFirst: { marginBottom: 16 },
    trophyIcon: { fontSize: 22, marginBottom: 2 },
    avatarWrap: { position: 'relative' },
    avatarPlaceholder: {
        backgroundColor: '#94a3b8',
        alignItems: 'center', justifyContent: 'center',
    },
    rankBadge: {
        position: 'absolute',
        bottom: -2, right: -2,
        width: 20, height: 20, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    rankBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
    podiumName: { fontSize: 12, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
    podiumNameFirst: { fontSize: 14, fontWeight: '700' },
    podiumSteps: { fontSize: 13, fontWeight: '700', color: '#1e293b', textAlign: 'center' },

    // Rank rows
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        gap: 12,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    rankRowNumber: { width: 24, fontSize: 15, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
    rankRowInfo: { flex: 1 },
    rankRowName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    rankRowTime: { fontSize: 11.5, color: '#94a3b8', marginTop: 2 },
    rankRowRight: { alignItems: 'flex-end' },
    rankRowSteps: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    rankRowLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8, color: '#94a3b8' },

    // My Rank sticky bar
    myRankBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: GREEN,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: 28,
        gap: 12,
    },
    myRankNum: { fontSize: 18, fontWeight: '800', color: '#fff', width: 28 },
    myRankInfo: { flex: 1 },
    myRankName: { fontSize: 14, fontWeight: '700', color: '#fff' },
    myRankSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
    myRankRight: { alignItems: 'flex-end' },
    myRankSteps: { fontSize: 18, fontWeight: '800', color: '#fff' },
    myRankLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8, color: 'rgba(255,255,255,0.75)' },
});
