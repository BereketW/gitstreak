import { View, Text, ScrollView } from 'react-native';

export function DiffViewer({ diffText }: { diffText: string }) {
    if (!diffText) return null;
    
    // Auto-trim trailing empty lines from LLM response
    const lines = diffText.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l.trim() === ''));

    return (
        <ScrollView 
            horizontal 
            className="bg-[#0a0f18] dark:bg-black rounded-b-2xl p-4 shadow-inner" 
            showsHorizontalScrollIndicator={false}
        >
            <View className="pb-2">
                {lines.map((line, idx) => {
                    const isAddition = line.startsWith('+') && !line.startsWith('+++');
                    const isDeletion = line.startsWith('-') && !line.startsWith('---');
                    const isMetadata = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

                    return (
                        <View 
                            key={idx} 
                            className={`flex-row items-center px-3 py-[3px] my-[1px] rounded-lg ${
                                isAddition ? 'bg-[#122d1b] border border-[#1e4a2c]' : 
                                isDeletion ? 'bg-[#311116] border border-[#521c25]' : 
                                'bg-transparent border border-transparent'
                            }`}
                        >
                            <Text 
                                className={`font-mono text-[10px] w-6 text-right mr-4 select-none ${
                                    isMetadata ? 'text-blue-500/70' : 'text-slate-600 dark:text-slate-500'
                                }`}
                            >
                                {idx + 1}
                            </Text>
                            
                            <Text 
                                className={`font-mono text-[12px] tracking-tight ${
                                    isAddition ? 'text-[#4bd964]' : 
                                    isDeletion ? 'text-[#ff3b30]' : 
                                    isMetadata ? 'text-blue-400 font-bold opacity-80' : 
                                    'text-slate-300 dark:text-slate-400'
                                }`}
                            >
                                {line}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}
