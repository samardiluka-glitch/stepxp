/**
 * app/edit-profile.tsx
 * Lets the user pick a photo, update username/bio, and save to
 * Firebase Auth + Firestore.
 */
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, AtSign, FileText, Mail, ShieldCheck, Camera, CheckCircle } from 'lucide-react-native';
import { auth, db, doc, setDoc, getDoc, updateProfile } from '../src/services/firebase';

const GREEN = '#22c55e';

export default function EditProfileScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [photoURI, setPhotoURI] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Load current profile ───────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        setUsername(user.displayName ?? '');
        setEmail(user.email ?? '');
        setPhotoURI(user.photoURL ?? undefined);

        setLoading(true);
        getDoc(doc(db, 'users', user.uid))
            .then((snap) => {
                if (snap.exists()) setBio(snap.data()?.bio ?? '');
            })
            .catch(console.warn)
            .finally(() => setLoading(false));
    }, []);

    // ── Photo picker ───────────────────────────────────────────────────────────
    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Allow photo access to change your picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setPhotoURI(result.assets[0].uri);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user) return;
        if (!username.trim()) {
            Alert.alert('Username required', 'Please enter a username.');
            return;
        }
        setSaving(true);
        try {
            // Update Firebase Auth profile (displayName + photoURL)
            await updateProfile(user, {
                displayName: username.trim(),
                photoURL: photoURI ?? user.photoURL,
            });

            // Persist bio + displayName + photoURL in Firestore
            await setDoc(
                doc(db, 'users', user.uid),
                {
                    displayName: username.trim(),
                    bio: bio.trim(),
                    photoURL: photoURI ?? user.photoURL ?? null,
                },
                { merge: true },
            );

            Alert.alert('Saved ✓', 'Your profile has been updated.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft size={20} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Avatar */}
                <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.85}>
                    {photoURI ? (
                        <Image source={{ uri: photoURI }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]} />
                    )}
                    <View style={styles.cameraBtn}>
                        <Camera size={16} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.tapLabel}>Tap to change photo</Text>

                {/* Username */}
                <View style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>USERNAME</Text>
                    <View style={styles.inputRow}>
                        <AtSign size={16} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="your_username"
                            placeholderTextColor="#cbd5e1"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>BIO</Text>
                    <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 4 }]}>
                        <FileText size={16} color="#94a3b8" style={{ marginTop: 3 }} />
                        <TextInput
                            style={[styles.input, { minHeight: 80 }]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell the world about yourself…"
                            placeholderTextColor="#cbd5e1"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Email — display only (updating email needs re-auth, flagged) */}
                <View style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                    <View style={styles.inputRow}>
                        <Mail size={16} color="#94a3b8" />
                        <Text style={[styles.input, { color: '#94a3b8', paddingTop: 2 }]}>{email}</Text>
                    </View>
                </View>

                {/* Privacy note */}
                <View style={styles.privacyNote}>
                    <ShieldCheck size={14} color={GREEN} />
                    <Text style={styles.privacyText}>
                        Your profile information is encrypted and only visible to you unless shared.
                    </Text>
                </View>

                {/* Save */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : (
                            <>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                                <CheckCircle size={20} color="#fff" />
                            </>
                        )
                    }
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 50 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 18, backgroundColor: '#f8fafc',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

    avatarWrap: { alignSelf: 'center', marginTop: 8 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0' },
    avatarPlaceholder: { backgroundColor: '#cbd5e1' },
    cameraBtn: {
        position: 'absolute', bottom: 2, right: 2,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#f8fafc',
    },
    tapLabel: { textAlign: 'center', color: '#22c55e', fontWeight: '600', fontSize: 13, marginTop: 8, marginBottom: 24 },

    fieldCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: { flex: 1, fontSize: 15, color: '#1e293b', padding: 0 },

    privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 24, marginBottom: 24 },
    privacyText: { flex: 1, fontSize: 12, color: '#94a3b8', fontStyle: 'italic', lineHeight: 17 },

    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#22c55e', borderRadius: 999,
        marginHorizontal: 20, paddingVertical: 18,
        shadowColor: '#22c55e', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
