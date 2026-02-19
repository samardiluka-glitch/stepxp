import { Tabs } from 'expo-router';
import { Home, Trophy, User } from 'lucide-react-native';
import { useHealthSync } from '../../src/hooks/useHealthSync';

const GREEN = '#22c55e';
const GRAY = '#94a3b8';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: GREEN,
                tabBarInactiveTintColor: GRAY,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: -3 },
                    height: 62,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'LEADERBOARD',
                    tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
