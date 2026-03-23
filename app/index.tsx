import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useGithubAuth } from '../hooks/useGithubAuth';

export default function LoginScreen() {
    const router = useRouter();
    const { request, promptAsync } = useGithubAuth();

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark items-center justify-between relative">
            {/* Decorative Background Elements */}
            <View className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <View className="absolute bottom-[-5%] left-[-10%] w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />

            <View className="flex-1 w-full max-w-md p-8 flex flex-col items-center justify-center space-y-12 z-10">
                <View className="relative group">
                    {/* Glowing Circle Backdrop */}
                    <View className="absolute inset-0 bg-primary/20 rounded-full blur-2xl transition-all duration-500" />
                    {/* GitHub Icon Container */}
                    <View className="relative bg-white/80 dark:bg-zinc-900/50 p-10 rounded-full border border-primary/20 backdrop-blur-sm shadow-[0_0_40px_10px_rgba(19,236,19,0.15)]">
                        <Image
                            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6ba27xTvhMduBs6BBw1JFgvy3ikBF0O13J7zi3IY3HFIVsd_dKSxm93j5b-fGTmppUMfAB5uO8Qvzs9PlnMXoZvpQMFgt6feWA02f9TQw_hY1lVQBx6tzGEzdq0ICz8cDBMSN6TCFr5Iwvju2GDQiBYBvxp75bwWO6zX2VbCR7nrrmPTnQS01hsWHWZTkv9Zf6CraYxqRbGYbzWya7efB2Niw5c0Ro24tMpJGML-Y0LQ7_Ky4Sk_oZxYg4-B9d7Jr4SjFvP4GN0k" }}
                            className="w-24 h-24 object-contain"
                            resizeMode="contain"
                        />
                    </View>
                    {/* Streak Indicator Decor */}
                    <View className="absolute -top-2 -right-2 bg-primary px-2.5 py-1 rounded-full shadow-lg shadow-primary/40">
                        <Text className="text-black text-[10px] font-black uppercase tracking-tighter">Active</Text>
                    </View>
                </View>

                <View className="items-center space-y-4 max-w-sm">
                    <Text className="text-4xl font-black tracking-tight text-center text-slate-900 dark:text-white">
                        Keep the <Text className="text-primary italic">Streak</Text> Alive
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-base font-medium text-center px-4 leading-relaxed">
                        Monitor pull requests, track commits, and never let your contribution graph go grey again.
                    </Text>
                </View>
            </View>

            <View className="w-full max-w-md p-8 space-y-4 z-10 mb-4">
                <TouchableOpacity
                    className={`w-full bg-primary py-4 px-6 rounded-full flex-row items-center justify-center space-x-3 shadow-xl shadow-primary/20 active:opacity-90 ${!request ? 'opacity-50' : ''}`}
                    onPress={() => promptAsync()}
                    disabled={!request}
                >
                    <FontAwesome name="github" size={24} color="black" />
                    <Text className="text-black font-bold text-base ml-2">{request ? 'Sign in with GitHub' : 'Loading...'}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-full bg-slate-200/50 dark:bg-zinc-800/50 py-4 px-6 rounded-full items-center justify-center">
                    <Text className="text-slate-800 dark:text-zinc-200 font-semibold text-base">Learn how it works</Text>
                </TouchableOpacity>

                <View className="items-center space-y-1 mt-4">
                    <Text className="text-xs text-slate-500 dark:text-zinc-500 font-medium text-center">
                        By continuing, you agree to our
                    </Text>
                    <View className="flex-row items-center justify-center space-x-2">
                        <Text className="text-xs font-bold text-slate-400 dark:text-zinc-500 underline">Terms of Service</Text>
                        <Text className="text-xs font-bold text-slate-400 dark:text-zinc-500">•</Text>
                        <Text className="text-xs font-bold text-slate-400 dark:text-zinc-500 underline">Privacy Policy</Text>
                    </View>
                </View>

                {/* Decorative Bottom Accent */}
                <View className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary/20 rounded-full blur-[1px] mb-2" />
            </View>
        </SafeAreaView>
    );
}