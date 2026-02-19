/**
 * app/(tabs)/profile.tsx
 * The main Profile tab — shows avatar, level, XP milestone progress,
 * account & privacy quick toggles, and a gear that opens Settings.
 */
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Switch,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, CheckCircle2, Globe, ChevronRight, Bell, Clock, User } from 'lucide-react-native';
import { auth, db, doc, getDoc, setDoc } from '../../src/services/firebase';
import { useStepStore } from '../../src/store/useStepStore';
import { getRankProgress } from '../../src/services/evolution';

const GREEN = '#22c55e';

export default function ProfileScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const { currentLevel, xpToNextLevel, progress, totalXP } = useStepStore();
    const rankInfo = getRankProgress(totalXP);

    const [bio, setBio] = useState('');
    const [publicProfile, setPublicProfile] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [workoutReminders, setWorkoutReminders] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Load from Firestore ────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        getDoc(doc(db, 'users', user.uid))
            .then((snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    setBio(d.bio ?? '');
                    setPublicProfile(d.privacy?.publicProfile ?? true);
                    setPushNotif(d.prefs?.pushNotifications ?? true);
                    setWorkoutReminders(d.prefs?.workoutReminders ?? false);
                }
            })
            .catch(console.warn)
            .finally(() => setLoading(false));
    }, []);

    const saveField = async (path: object) => {
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid), path, { merge: true });
    };

    const nextLevel = currentLevel + 1;
    const pct = Math.round(progress * 100);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 36 }} />
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
                    <Settings size={18} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* ── Avatar + name + level badge ───────────────────────── */}
                <View style={styles.hero}>
                    <View style={styles.avatarWrap}>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <User size={40} color="#fff" />
                            </View>
                        )}
                        <View style={styles.checkBadge}>
                            <CheckCircle2 size={16} color="#fff" fill={GREEN} />
                        </View>
                    </View>

                    <Text style={styles.name}>{user?.displayName ?? 'Athlete'}</Text>
                    {bio ? <Text style={styles.bio}>{bio}</Text> : null}

                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>
                            ⚡ Level {currentLevel} {rankInfo.currentRank}
                        </Text>
                    </View>
                </View>

                {/* ── Next Milestone card ───────────────────────────────── */}
                <View style={styles.milestoneCard}>
                    <View style={styles.milestoneTop}>
                        <View>
                            <Text style={styles.milestoneLabel}>NEXT MILESTONE</Text>
                            <Text style={styles.milestoneLevel}>Level {nextLevel}</Text>
                        </View>
                        <Text style={styles.milestonePct}>{pct}%</Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>

                    <Text style={styles.milestoneXP}>
                        {xpToNextLevel.toLocaleString()} XP to reach Level {nextLevel}
                    </Text>
                </View>

                {/* ── Account & Privacy ──────────────────────────────────── */}
                <Text style={styles.section}>ACCOUNT & PRIVACY</Text>
                <View style={styles.card}>
                    <View style={styles.prefRow}>
                        <Globe size={18} color="#64748b" />
                        <Text style={styles.prefLabel}>Public Profile</Text>
                        <Switch
                            value={publicProfile}
                            onValueChange={(v) => {
                                setPublicProfile(v);
                                saveField({ privacy: { publicProfile: v } });
                            }}
                            trackColor={{ false: '#e2e8f0', true: GREEN }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.prefRow}
                        onPress={() => router.push('/edit-profile')}
                        activeOpacity={0.75}
                    >
                        <User size={18} color="#64748b" />
                        <Text style={[styles.prefLabel, { flex: 1 }]}>Edit Username</Text>
                        <ChevronRight size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* ── Preferences ────────────────────────────────────────── */}
                <Text style={styles.section}>PREFERENCES</Text>
                <View style={styles.card}>
                    <View style={styles.prefRow}>
                        <Bell size={18} color="#64748b" />
                        <Text style={styles.prefLabel}>Push Notifications</Text>
                        <Switch
                            value={pushNotif}
                            onValueChange={(v) => {
                                setPushNotif(v);
                                saveField({ prefs: { pushNotifications: v } });
                            }}
                            trackColor={{ false: '#e2e8f0', true: GREEN }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.prefRow}>
                        <Clock size={18} color="#64748b" />
                        <Text style={styles.prefLabel}>Workout Reminders</Text>
                        <Switch
                            value={workoutReminders}
                            onValueChange={(v) => {
                                setWorkoutReminders(v);
                                saveField({ prefs: { workoutReminders: v } });
                            }}
                            trackColor={{ false: '#e2e8f0', true: GREEN }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: '#f8fafc',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

    content: { padding: 20, gap: 12, paddingBottom: 40 },

    // Hero
    hero: { alignItems: 'center', gap: 6, marginBottom: 4 },
    avatarWrap: { position: 'relative', marginBottom: 4 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e2e8f0' },
    avatarPlaceholder: { backgroundColor: '#94a3b8', alignItems: 'center', justifyContent: 'center' },
    checkBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#f8fafc',
    },
    name: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
    bio: { fontSize: 13.5, color: '#64748b', textAlign: 'center', lineHeight: 19 },
    levelBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 },
    levelBadgeText: { color: GREEN, fontWeight: '700', fontSize: 13.5 },

    // Milestone
    milestoneCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 10,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    milestoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    milestoneLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2 },
    milestoneLevel: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
    milestonePct: { fontSize: 20, fontWeight: '800', color: GREEN },
    progressTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 999, overflow: 'hidden' },
    progressFill: { height: 10, backgroundColor: GREEN, borderRadius: 999 },
    milestoneXP: { fontSize: 12, color: '#94a3b8' },

    // Sections
    section: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginTop: 4, marginLeft: 2 },
    card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    prefRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    prefLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 52 },
});
