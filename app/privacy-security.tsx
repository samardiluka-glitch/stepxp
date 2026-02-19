/**
 * app/privacy-security.tsx
 * Privacy & Security settings backed by Firestore.
 */
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, Lock, KeyRound, ExternalLink, Trash2 } from 'lucide-react-native';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/services/firebase';

const GREEN = '#22c55e';

interface PrivacyData {
    privateAccount: boolean;
    showActivity: boolean;
    twoFA: boolean;
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <View style={styles.sectionHead}>
            {icon}
            <Text style={styles.sectionLabel}>{title}</Text>
        </View>
    );
}

function ToggleRow({
    title,
    desc,
    value,
    onChange,
}: {
    title: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>{title}</Text>
                <Text style={styles.toggleDesc}>{desc}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#e2e8f0', true: GREEN }}
                thumbColor="#fff"
            />
        </View>
    );
}

function ActionRow({
    icon,
    title,
    sub,
    onPress,
    danger = false,
    right,
}: {
    icon: React.ReactNode;
    title: string;
    sub?: string;
    onPress?: () => void;
    danger?: boolean;
    right?: React.ReactNode;
}) {
    return (
        <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.75}>
            <View style={[styles.actionIcon, danger && { backgroundColor: '#fee2e2' }]}>{icon}</View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, danger && { color: '#ef4444' }]}>{title}</Text>
                {sub && <Text style={styles.actionSub}>{sub}</Text>}
            </View>
            {right ?? null}
        </TouchableOpacity>
    );
}

export default function PrivacySecurityScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const [privacy, setPrivacy] = useState<PrivacyData>({
        privateAccount: true,
        showActivity: false,
        twoFA: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        getDoc(doc(db, 'users', user.uid))
            .then((snap) => {
                if (snap.exists()) {
                    const p = snap.data()?.privacy ?? {};
                    setPrivacy({
                        privateAccount: p.privateAccount ?? true,
                        showActivity: p.showActivity ?? false,
                        twoFA: p.twoFA ?? false,
                    });
                }
            })
            .catch(console.warn)
            .finally(() => setLoading(false));
    }, []);

    // ── Persist a single key ──────────────────────────────────────────────────
    const update = async (key: keyof PrivacyData, value: boolean) => {
        const next = { ...privacy, [key]: value };
        setPrivacy(next);
        if (!user) return;
        setSaving(true);
        try {
            await setDoc(
                doc(db, 'users', user.uid),
                { privacy: { [key]: value } },
                { merge: true },
            );
        } catch {
            // Revert optimistic update
            setPrivacy(privacy);
            Alert.alert('Error', 'Could not save setting. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Change Password ───────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            Alert.alert('Email sent ✓', `A reset link was sent to ${user.email}`);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not send reset email.');
        }
    };

    // ── Deactivate Account ────────────────────────────────────────────────────
    const handleDeactivate = () => {
        Alert.alert(
            'Deactivate Account',
            'This will permanently delete your account and all data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user) return;
                        try {
                            await deleteUser(user);
                            router.replace('/auth/login');
                        } catch (e: any) {
                            // Requires recent login — prompt re-auth
                            Alert.alert(
                                'Re-authentication required',
                                'Please sign out and sign back in before deactivating your account.',
                            );
                        }
                    },
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Security</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* ── PRIVACY SETTINGS ─────────────────────────────────────── */}
                <SectionHead icon={<ShieldCheck size={14} color={GREEN} />} title="PRIVACY SETTINGS" />
                <View style={styles.card}>
                    <ToggleRow
                        title="Private Account"
                        desc="Only approved followers can see your steps and activity"
                        value={privacy.privateAccount}
                        onChange={(v) => update('privateAccount', v)}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        title="Show Activity to Friends"
                        desc="Share your achievements in the community feed"
                        value={privacy.showActivity}
                        onChange={(v) => update('showActivity', v)}
                    />
                </View>

                {/* ── SECURITY ─────────────────────────────────────────────── */}
                <SectionHead icon={<Lock size={14} color={GREEN} />} title="SECURITY" />
                <View style={styles.card}>
                    <ToggleRow
                        title="Two-Factor Authentication"
                        desc="Add an extra layer of security to your account"
                        value={privacy.twoFA}
                        onChange={(v) => update('twoFA', v)}
                    />
                    <View style={styles.divider} />
                    <ActionRow
                        icon={<KeyRound size={16} color={GREEN} />}
                        title="Change Password"
                        sub="Last changed 3 months ago"
                        onPress={handleChangePassword}
                        right={<Text style={styles.chevron}>›</Text>}
                    />
                </View>

                {/* ── ACCOUNT ACTIONS ──────────────────────────────────────── */}
                {saving && (
                    <ActivityIndicator color={GREEN} size="small" style={{ alignSelf: 'flex-end', marginBottom: 4 }} />
                )}
                <View style={styles.card}>
                    <ActionRow
                        icon={<ExternalLink size={16} color="#64748b" />}
                        title="Login Activity"
                        right={<ExternalLink size={14} color="#cbd5e1" />}
                    />
                    <View style={styles.divider} />
                    <ActionRow
                        icon={<Trash2 size={16} color="#ef4444" />}
                        title="Deactivate Account"
                        danger
                        onPress={handleDeactivate}
                        right={<Trash2 size={16} color="#ef4444" />}
                    />
                </View>
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
    content: { padding: 16, gap: 10, paddingBottom: 50 },

    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4, marginLeft: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2 },

    card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    divider: { height: 1, backgroundColor: '#f1f5f9' },

    toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
    toggleTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
    toggleDesc: { fontSize: 12.5, color: '#94a3b8', lineHeight: 17 },

    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
    actionTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    actionSub: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
    chevron: { fontSize: 22, color: '#cbd5e1', marginRight: -4 },
});
