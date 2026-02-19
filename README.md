# StepXP (Vibe Coding Edition)

StepXP is an XP-based fitness tracker that turns your daily steps into game progress.

## 🚀 Replit / Vibe Coding Setup

This version of the project is **fully mocked** for local development and "vibe coding". It has **zero external cloud dependencies** required to run.

- **Authentication**: Uses a local mock (any email works).
- **Database**: Uses local device storage (`AsyncStorage`). No Firebase config needed.
- **Payments**: Uses a local mock (RevenueCat logic without real purchases).
- **AI**: Uses a local mock (Gemini logic returns static quotes).

### How to Run

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the app**:
    ```bash
    npx expo start
    ```
    - Press `w` to run in web browser (limited functionality for Health/Sensors).
    - Scan QR code with Expo Go on your phone for full experience.

### Mock Services

All cloud logic is contained in `src/services/mock.ts`, `src/services/revenuecat.ts`, and `src/services/gemini.ts`.
To restore real cloud functionality, revert these files to their original SDK implementations and add your API keys.

---

**Features**:
- 🏃‍♂️ **Step Tracking**: Syncs with Health Connect (Android) / HealthKit (iOS).
- 🏆 **Leaderboard**: Compete with (mock) users globally or locally.
- ⚡ **Level Up system**: Earn XP for steps and unlock levels.
- 🎨 **Profile**: Customize your avatar and bio.
- 💎 **Premium**: Subscribe (mock) to get 1.5x XP multiplier.

Happy Coding! 🧘‍♂️✨
