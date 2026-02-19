/**
 * app/settings.tsx
 * Full Settings screen (previously app/(tabs)/profile.tsx content).
 * Navigated to from the gear icon on the Profile tab.
 */
import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    UserCog,
    CreditCard,
    Ruler,
    Bell,
    Moon,
    Lock,
    HelpCircle,
    ChevronRight,
} from 'lucide-react-native';
import { signOut, auth } from '../src/services/firebase';
import { useStepStore } from '../src/store/useStepStore';

const GREEN = '#22c55e';

function SettingRow({
    icon,
    iconBg,
    label,
    badge,
    hasChevron = true,
    right,
    onPress,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    badge?: string;
    hasChevron?: boolean;
    right?: React.ReactNode;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                {right}
                {hasChevron && !right && !badge && <ChevronRight size={16} color="#cbd5e1" />}
                {badge && <ChevronRight size={16} color="#cbd5e1" />}
            </View>
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const { isPremium } = useStepStore();
    const [metricUnits, setMetricUnits] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleSignOut = async () => {
        await signOut(auth);
        router.replace('/auth/login');
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={20} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.section}>ACCOUNT</Text>
                <View style={styles.card}>
                    <SettingRow
                        icon={<UserCog size={17} color="#6366f1" />}
                        iconBg="#ede9fe"
                        label="Edit Profile"
                        onPress={() => router.push('/edit-profile')}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<CreditCard size={17} color="#6366f1" />}
                        iconBg="#ede9fe"
                        label="Subscription"
                        badge={isPremium ? 'Pro' : undefined}
                        onPress={() => router.push('/subscription')}
                    />
                </View>

                <Text style={styles.section}>PREFERENCES</Text>
                <View style={styles.card}>
                    <SettingRow
                        icon={<Ruler size={17} color={GREEN} />}
                        iconBg="#dcfce7"
                        label="Units"
                        hasChevron={false}
                        right={
                            <Switch
                                value={metricUnits}
                                onValueChange={setMetricUnits}
                                trackColor={{ false: '#e2e8f0', true: GREEN }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Bell size={17} color="#f97316" />}
                        iconBg="#fff7ed"
                        label="Notifications"
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Moon size={17} color="#7c3aed" />}
                        iconBg="#f5f3ff"
                        label="Dark Mode"
                        hasChevron={false}
                        right={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#e2e8f0', true: GREEN }}
                                thumbColor="#fff"
                            />
                        }
                    />
                </View>

                <Text style={styles.section}>SUPPORT</Text>
                <View style={styles.card}>
                    <SettingRow
                        icon={<Lock size={17} color={GREEN} />}
                        iconBg="#dcfce7"
                        label="Privacy & Security"
                        onPress={() => router.push('/privacy-security')}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<HelpCircle size={17} color="#0ea5e9" />}
                        iconBg="#e0f2fe"
                        label="Help & FAQ"
                    />
                </View>

                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
                <Text style={styles.version}>StepXP v2.0 · {isPremium ? '⚡ Pro' : 'Free'}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    content: { padding: 16, paddingBottom: 40 },
    section: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginTop: 16, marginBottom: 6, marginLeft: 4 },
    card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    badge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontWeight: '700', color: GREEN },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 64 },
    signOutBtn: { marginTop: 24, backgroundColor: '#fff', borderRadius: 14, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
    signOutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
    version: { textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 14 },
});
