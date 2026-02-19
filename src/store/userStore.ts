import { create } from 'zustand';

interface UserState {
    userId: string | null;
    xp: number;
    steps: number;
    setUser: (userId: string) => void;
    addXP: (amount: number) => void;
    setSteps: (steps: number) => void;
    reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    userId: null,
    xp: 0,
    steps: 0,
    setUser: (userId) => set({ userId }),
    addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
    setSteps: (steps) => set({ steps }),
    reset: () => set({ userId: null, xp: 0, steps: 0 }),
}));
