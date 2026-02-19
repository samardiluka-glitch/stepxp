// Placeholder hook – replace with real Health Connect / HealthKit integration
import { useState, useEffect } from 'react';

export function useStepCount() {
    const [steps, setSteps] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // TODO: Integrate expo-health-connect (Android) or react-native-health (iOS) here
        setLoading(false);
    }, []);

    return { steps, loading };
}
