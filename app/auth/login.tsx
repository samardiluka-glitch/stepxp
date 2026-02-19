import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmail } from '../../src/services/firebase'; // mock service

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }
        setLoading(true);
        try {
            // Fake login delay
            await new Promise(r => setTimeout(r, 800));
            await signInWithEmail(email.trim());
            // Auth state listener in index.tsx or _layout will handle redirect?
            // Actually, onAuthStateChanged in index.tsx handles the splash redirect, 
            // but once inside the app, we might need manual redirect here or listener in _layout.
            // _layout doesn't have a listener usually. 
            // Let's manually redirect to home.
            router.replace('/(tabs)/home');
        } catch (e: any) {
            Alert.alert('Login Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to StepXP</Text>
            <Text style={styles.subtitle}>Enter any email to simulate login</Text>

            <TextInput
                style={styles.input}
                placeholder="user@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continue</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
    input: {
        height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        paddingHorizontal: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#f9f9f9',
    },
    btn: {
        height: 50, backgroundColor: '#22c55e', borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
