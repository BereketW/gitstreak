import { Tabs, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#13ec13',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#102210' : '#ffffff',
                    borderTopColor: colorScheme === 'dark' ? '#1e3a1e' : '#e5e5e5',
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Stats",
                    tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="repos"
                options={{
                    title: "Repos",
                    tabBarIcon: ({ color }) => <MaterialIcons name="folder" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="add-placeholder"
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: '#13ec13',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 30,
                            shadowColor: '#13ec13',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}>
                            <MaterialIcons name="add" size={32} color="#000" />
                        </View>
                    ),
                }}
                listeners={() => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        router.push('/new-pr');
                    },
                })}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: "Trends",
                    tabBarIcon: ({ color }) => <MaterialIcons name="show-chart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="pull-requests"
                options={{
                    title: "PRs",
                    tabBarIcon: ({ color }) => <MaterialIcons name="call-merge" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
