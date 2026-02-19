import { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    Easing,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/services/firebase';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width * 0.72;

export default function SplashScreen() {
    const router = useRouter();

    // ── Animations ─────────────────────────────────────────────────────────────
    const barProgress = useRef(new Animated.Value(0)).current;        // 0 → 1
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoTranslate = useRef(new Animated.Value(24)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo fade-in + lift
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(logoTranslate, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Short delay then start bar fill + text fade
        setTimeout(() => {
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

            Animated.timing(barProgress, {
                toValue: 0.72,          // fills to ~72% during check
                duration: 2200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: false, // width is a layout prop
            }).start();
        }, 300);

        // ── Firebase auth check ────────────────────────────────────────────────
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Complete the bar before navigating
            Animated.timing(barProgress, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start(() => {
                unsubscribe();
                if (user) {
                    router.replace('/(tabs)/home');
                } else {
                    router.replace('/auth/login');
                }
            });
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const barWidth = barProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, BAR_WIDTH],
    });

    return (
        <LinearGradient
            colors={['#d4f5d4', '#eaf0f8', '#f0f4fa']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.container}
        >
            {/* ── Logo block ──────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.logoBlock,
                    { opacity: logoOpacity, transform: [{ translateY: logoTranslate }] },
                ]}
            >
                {/* "StepXP" word-mark */}
                <View style={styles.wordmark}>
                    <Text style={styles.logoText}>Step</Text>
                    <Text style={styles.logoText}>X</Text>
                    {/* Upward-arrow superscript */}
                    <Text style={styles.logoArrow}>↗</Text>
                    <Text style={styles.logoText}>P</Text>
                </View>

                <Text style={styles.tagline}>LEVEL UP YOUR LIFE</Text>
            </Animated.View>

            {/* ── Progress bar ────────────────────────────────────────────────── */}
            <Animated.View style={[styles.barSection, { opacity: textOpacity }]}>
                <View style={styles.barTrack}>
                    <Animated.View style={[styles.barFill, { width: barWidth }]} />
                </View>
                <Text style={styles.syncText}>Syncing steps...</Text>
            </Animated.View>

            {/* ── Version tag ─────────────────────────────────────────────────── */}
            <Text style={styles.version}>VERSION 2.0.4</Text>
        </LinearGradient>
    );
}

const GREEN = '#22c55e';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Logo
    logoBlock: {
        alignItems: 'center',
        marginBottom: 52,
    },
    wordmark: {
        flexDirection: 'row',
        alignItems: 'flex-start', // lets superscript arrow sit higher
    },
    logoText: {
        fontSize: 56,
        fontWeight: '800',
        color: GREEN,
        letterSpacing: -1,
        lineHeight: 62,
    },
    logoArrow: {
        fontSize: 28,
        fontWeight: '700',
        color: GREEN,
        marginTop: 4,          // pulls arrow to match design
        marginHorizontal: -2,
    },
    tagline: {
        marginTop: 6,
        fontSize: 11.5,
        fontWeight: '500',
        letterSpacing: 3.5,
        color: '#94a3b8',
    },

    // Progress bar
    barSection: {
        alignItems: 'center',
        gap: 10,
    },
    barTrack: {
        width: BAR_WIDTH,
        height: 6,
        borderRadius: 999,
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: GREEN,
    },
    syncText: {
        fontSize: 12.5,
        color: '#94a3b8',
        fontWeight: '400',
        letterSpacing: 0.3,
    },

    // Footer
    version: {
        position: 'absolute',
        bottom: 38,
        fontSize: 10,
        letterSpacing: 2,
        color: '#cbd5e1',
        fontWeight: '500',
    },
});
