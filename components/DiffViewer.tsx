import { View, Text, ScrollView } from 'react-native';

export function DiffViewer({ diffText }: { diffText: string }) {
    if (!diffText) return null;
    
    const lines = diffText.split('\n');

    return (
        <ScrollView horizontal className="bg-slate-900 dark:bg-black rounded-xl p-4 mt-4 border border-slate-800 dark:border-white/10 shadow-lg" showsHorizontalScrollIndicator={false}>
            <View>
                {lines.map((line, idx) => {
                    let bgColor = 'bg-transparent';
                    let textColor = 'text-slate-300';
                    let prefixColor = 'text-slate-500';

                    if (line.startsWith('+') && !line.startsWith('+++')) {
                        bgColor = 'bg-green-900/40';
                        textColor = 'text-green-400';
                        prefixColor = 'text-green-500';
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                        bgColor = 'bg-red-900/40';
                        textColor = 'text-red-400';
                        prefixColor = 'text-red-500';
                    } else if (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++')) {
                        textColor = 'text-blue-400';
                        prefixColor = 'text-blue-400';
                    }

                    return (
                        <View key={idx} className={`flex-row ${bgColor} px-2 py-0.5 rounded-sm`}>
                            <Text className={`font-mono text-[10px] w-6 text-right mr-3 ${prefixColor}`}>
                                {idx + 1}
                            </Text>
                            <Text className={`font-mono text-[11px] ${textColor}`}>
                                {line}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}
