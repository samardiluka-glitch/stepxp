import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
}

export interface DocumentReference {
    path: string;
    id: string;
}

export interface DocumentSnapshot {
    exists: () => boolean;
    data: () => any;
    id: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

let _currentUser: User | null = null;
const _listeners: ((user: User | null) => void)[] = [];

// Load user from storage on init
AsyncStorage.getItem('mock_user_session').then((json) => {
    if (json) {
        _currentUser = JSON.parse(json);
        notifyListeners();
    } else {
        // If no user, maybe create one? No, wait for login.
        notifyListeners();
    }
});

function notifyListeners() {
    _listeners.forEach((cb) => cb(_currentUser));
}

export const auth = {
    get currentUser() {
        return _currentUser;
    },
};

export const onAuthStateChanged = (
    _auth: any,
    callback: (user: User | null) => void
) => {
    _listeners.push(callback);
    // Initial callback
    setTimeout(() => callback(_currentUser), 0);
    return () => {
        const idx = _listeners.indexOf(callback);
        if (idx >= 0) _listeners.splice(idx, 1);
    };
};

export const signInAnonymously = async (_auth: any) => {
    const user: User = {
        uid: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        email: null,
        displayName: 'Guest User',
        photoURL: null,
        isAnonymous: true,
    };
    _currentUser = user;
    await AsyncStorage.setItem('mock_user_session', JSON.stringify(user));
    notifyListeners();
    return { user };
};

export const signInWithEmail = async (email: string) => {
    // Mock login: create user based on email hash or just random if new
    const uid = 'mock-' + email.replace(/[^a-z0-9]/gi, '_');
    const existing = await AsyncStorage.getItem(`mock_user_data_${uid}`);

    let user: User = {
        uid,
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        isAnonymous: false,
    };

    // If found in storage, use that data
    if (existing) {
        const data = JSON.parse(existing);
        if (data.displayName) user.displayName = data.displayName;
        if (data.photoURL) user.photoURL = data.photoURL;
    }

    _currentUser = user;
    await AsyncStorage.setItem('mock_user_session', JSON.stringify(user));
    notifyListeners();
    return { user };
};

export const signOut = async (_auth: any) => {
    _currentUser = null;
    await AsyncStorage.removeItem('mock_user_session');
    notifyListeners();
};

export const updateProfile = async (user: User, updates: { displayName?: string | null; photoURL?: string | null }) => {
    if (!_currentUser || _currentUser.uid !== user.uid) return;

    _currentUser = { ..._currentUser, ...updates };
    // Persist session
    await AsyncStorage.setItem('mock_user_session', JSON.stringify(_currentUser));

    // Persist user data record too
    const key = `mock_user_data_${user.uid}`;
    const existing = await AsyncStorage.getItem(key);
    const data = existing ? JSON.parse(existing) : {};
    await AsyncStorage.setItem(key, JSON.stringify({ ...data, ...updates }));

    notifyListeners();
};

export const sendPasswordResetEmail = async (_auth: any, email: string) => {
    // Mock: do nothing but succeed
    console.log(`[Mock] Password reset email sent to ${email}`);
};

export const deleteUser = async (user: User) => {
    if (!_currentUser || _currentUser.uid !== user.uid) return;

    const uid = user.uid;
    await signOut(auth);
    // Clear data
    await AsyncStorage.removeItem(`mock_user_data_${uid}`);
};

// ── Firestore ─────────────────────────────────────────────────────────────────

// ── Firestore ─────────────────────────────────────────────────────────────────

export const db = {}; // Placeholder

export const collection = (_db: any, path: string) => ({ path });
export const query = (ref: any, ...constraints: any[]) => ({ ref, constraints });
export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, dir: string) => ({ type: 'orderBy', field, dir });
export const limit = (n: number) => ({ type: 'limit', n });

// Mock data generator for leaderboard
const MOCK_USERS = Array.from({ length: 15 }).map((_, i) => ({
    id: `mock_user_${i}`,
    data: () => ({
        displayName: `Runner ${i + 1}`,
        totalXP: 10000 - i * 500,
        stepsToday: 5000 - i * 100,
        photoURL: null,
        country: 'US',
        lastSync: Timestamp.now(), // Use class instance
    }),
}));

export const getDocs = async (_query: any) => {
    // Return fake users
    return {
        docs: MOCK_USERS,
        size: MOCK_USERS.length,
        empty: false,
    };
};

export const getCountFromServer = async (_query: any) => {
    return {
        data: () => ({ count: Math.floor(Math.random() * 100) }),
    };
};

export const doc = (_db: any, collection: string, id: string): DocumentReference => {
    return { path: `${collection}/${id}`, id };
};

export const getDoc = async (ref: DocumentReference): Promise<DocumentSnapshot> => {
    const key = `mock_doc_${ref.path.replace(/\//g, '_')}`;
    const json = await AsyncStorage.getItem(key);
    const data = json ? JSON.parse(json) : undefined;

    return {
        exists: () => !!data,
        data: () => data,
        id: ref.id,
    };
};

export const setDoc = async (
    ref: DocumentReference,
    data: any,
    options?: { merge?: boolean }
) => {
    const key = `mock_doc_${ref.path.replace(/\//g, '_')}`;

    if (options?.merge) {
        const existingJson = await AsyncStorage.getItem(key);
        const existing = existingJson ? JSON.parse(existingJson) : {};
        // Deep merge not implemented, shallow merge usually enough for this app
        const merged = { ...existing, ...data };
        await AsyncStorage.setItem(key, JSON.stringify(merged));
    } else {
        await AsyncStorage.setItem(key, JSON.stringify(data));
    }
};

export const serverTimestamp = () => new Date().toISOString();

export class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
    toMillis() { return this.seconds * 1000 + this.nanoseconds / 1000000; }
    toDate() { return new Date(this.toMillis()); }
    static now() { return Timestamp.fromDate(new Date()); }
    static fromDate(d: Date) {
        // Correctly return a new Timestamp instance
        return new Timestamp(Math.floor(d.getTime() / 1000), 0);
    }
}
// Fix implementation:
// static fromDate(d: Date) { return new Timestamp(d.getTime() / 1000, 0); }
// Except JS uses ms.
