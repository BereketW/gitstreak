import { GITHUB_CONFIG } from '../constants/Config';

export async function getAIProposal(fileContent: string) {
    const apiKey = GITHUB_CONFIG.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error("Missing Gemini API Key. Please add it to constants/Config.ts");
    }

    const systemPrompt = `You are a code refactoring assistant. Suggest ONE minimal, safe change to this codebase. Rules: no behavior changes, no dependency changes, no file deletions, no logic changes. Only: simplifications, dead code removal, comment improvements, variable renames for clarity. 
    
    Return a strictly valid JSON object with EXACTLY two keys:
    1. "diff": A unified diff showing the exact changes.
    2. "full_content": The complete, final replaced file content.
    
    Respond with ONLY the JSON object. Do not wrap in markdown blocks.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `File content:\n\n${fileContent}` }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });
    console.log(response)

    if (!response.ok) throw new Error("Failed to connect to Gemini API");

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid response from AI");

    return JSON.parse(text); // { diff, full_content }
}
