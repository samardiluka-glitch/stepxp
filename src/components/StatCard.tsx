import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    style?: ViewStyle;
}

export function StatCard({ icon, label, value, style }: StatCardProps) {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.iconWrap}>{icon}</View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 12.5,
        color: '#94a3b8',
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    value: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
});
