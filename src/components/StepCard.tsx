import { View, Text } from 'react-native';

interface StepCardProps {
    steps: number;
    xp: number;
}

export function StepCard({ steps, xp }: StepCardProps) {
    return (
        <View className="rounded-2xl bg-indigo-600 p-6 m-4 shadow-lg">
            <Text className="text-white text-lg font-semibold">Today's Steps</Text>
            <Text className="text-white text-5xl font-bold mt-1">{steps.toLocaleString()}</Text>
            <Text className="text-indigo-200 text-sm mt-2">⚡ {xp} XP earned</Text>
        </View>
    );
}
