
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function* getChatResponseStream(prompt: string, documentContext: string, manualContext: string) {
    const fullPrompt = `
        POLICY MANUAL CONTEXT:
        ---
        ${manualContext || 'No policy manual is currently selected.'}
        ---
        DOCUMENT CONTEXT:
        ---
        ${documentContext || 'No document is currently open.'}
        ---
        USER'S REQUEST:
        ${prompt}
    `;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: "You are an expert writing assistant integrated into a document editor. Be concise and helpful. When providing code or formatted text, use markdown. Prioritize information from the POLICY MANUAL CONTEXT if it is relevant to the user's request."
            }
        });
        
        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Gemini API stream error:", error);
        yield "An error occurred while fetching the response. Please check the console for details.";
    }
}
