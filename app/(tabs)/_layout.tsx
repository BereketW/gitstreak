import { Tabs, router } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();

    return (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0a0f18' : '#f8fafc' }}>
            <Tabs
                tabBar={(props) => <CustomTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen name="dashboard" />
                <Tabs.Screen name="repos" />
                <Tabs.Screen
                    name="add-placeholder"
                    listeners={() => ({
                        tabPress: (e) => {
                            e.preventDefault();
                            router.push('/streak-assist');
                        },
                    })}
                />
                <Tabs.Screen name="timeline" />
                <Tabs.Screen name="pull-requests" />
            </Tabs>
        </View>
    );
}
