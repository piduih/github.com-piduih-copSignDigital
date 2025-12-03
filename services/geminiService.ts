
import { GoogleGenAI, Type } from "@google/genai";
import type { CompanySettings } from "../types";

// Helper for OpenAI-compatible API calls (OpenAI, DeepSeek, Ollama, etc.)
const callOpenAICompatible = async (settings: CompanySettings, systemPrompt: string, userPrompt: string, jsonMode: boolean = false) => {
    const apiKey = settings.apiKey || '';
    // Default base URLs
    let baseUrl = settings.aiBaseUrl;
    if (!baseUrl) {
        if (settings.aiProvider === 'openai') {
            baseUrl = 'https://api.openai.com/v1';
        } else {
             // Fallback for custom if empty, though user should provide it
             baseUrl = 'http://localhost:11434/v1';
        }
    }
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');

    const body: any = {
        model: settings.aiModel,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
    };

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (e) {
        console.error("OpenAI Compatible API call failed:", e);
        throw e;
    }
};


export const getStampSuggestion = async (settings: CompanySettings, name: string, regNo: string, address: string) => {
    
    // --- GEMINI PROVIDER ---
    if (settings.aiProvider === 'gemini') {
        const key = settings.apiKey;
        if (!key) throw new Error("Google Gemini API Key is missing.");
        
        const ai = new GoogleGenAI({ apiKey: key });
        const prompt = `Based on the following company details, suggest concise and professional values for a company stamp.
        Company Name: "${name}"
        Registration No: "${regNo}"
        Address: "${address}"
        
        Provide suggestions for name, registration number, address, and phone number.
        For the address, format it into 2 or 3 short lines using the newline character (\\n) for separation.
        Generate a plausible phone number if none is provided.
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: settings.aiModel || "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            regNo: { type: Type.STRING },
                            address: { type: Type.STRING },
                            phone: { type: Type.STRING },
                        }
                    }
                }
            });
            return JSON.parse(response.text.trim());
        } catch (error) {
            console.error("Gemini API call failed:", error);
            throw new Error("Gemini Error: " + (error instanceof Error ? error.message : String(error)));
        }
    } 
    
    // --- OPENAI / CUSTOM PROVIDER ---
    else {
        const systemPrompt = `You are an assistant that helps format company details for official rubber stamps. 
        Return ONLY valid JSON with keys: "name", "regNo", "address", "phone". 
        Keep address concise (2-3 lines max, separated by \\n).`;
        
        const userPrompt = `Details: Name: ${name}, Reg: ${regNo}, Address: ${address}. Suggest professional format.`;
        
        try {
            const resultText = await callOpenAICompatible(settings, systemPrompt, userPrompt, true);
            
            // Try to parse JSON. Some local models might wrap it in markdown.
            let jsonStr = resultText.trim();
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            return JSON.parse(jsonStr);

        } catch (error) {
             throw new Error("AI Provider Error: " + (error instanceof Error ? error.message : String(error)));
        }
    }
};

export const getPDFSummary = async (settings: CompanySettings, pdfText: string) => {
    
    // --- GEMINI PROVIDER ---
    if (settings.aiProvider === 'gemini') {
        const key = settings.apiKey;
        if (!key) throw new Error("API Key is missing.");

        const ai = new GoogleGenAI({ apiKey: key });
        const prompt = `Provide a concise summary of the following document content.
        Document Content:
        """
        ${pdfText}
        """
        `;

        try {
             const response = await ai.models.generateContent({
                model: settings.aiModel || "gemini-2.5-flash",
                contents: prompt,
            });
            return response.text;
        } catch(error) {
            console.error("Gemini API call failed:", error);
            throw new Error("Gemini Error: " + (error instanceof Error ? error.message : String(error)));
        }
    } 
    
    // --- OPENAI / CUSTOM PROVIDER ---
    else {
        const systemPrompt = "You are a helpful assistant. Summarize the provided document text concisely.";
        const userPrompt = `Document Content:\n"""\n${pdfText}\n"""`;
        
        try {
             return await callOpenAICompatible(settings, systemPrompt, userPrompt, false);
        } catch(error) {
            console.error("AI API call failed:", error);
             throw new Error("AI Provider Error: " + (error instanceof Error ? error.message : String(error)));
        }
    }
}
