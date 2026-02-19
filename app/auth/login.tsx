import { View, Text, StyleSheet } from 'react-native';

/** Placeholder — replace with real Login screen */
export default function LoginScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>🔐 Login (coming soon)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4fa' },
    text: { fontSize: 18, color: '#64748b' },
});
