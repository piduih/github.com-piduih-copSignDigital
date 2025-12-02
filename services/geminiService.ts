import { GoogleGenAI, Type } from "@google/genai";

const getGenAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getStampSuggestion = async (name: string, regNo: string, address: string) => {
    const ai = getGenAI();
    const prompt = `Based on the following company details, suggest concise and professional values for a company stamp.
    Company Name: "${name}"
    Registration No: "${regNo}"
    Address: "${address}"
    
    Provide suggestions for name, registration number, address, and phone number.
    For the address, format it into 2 or 3 short lines using the newline character (\\n) for separation. This is for a company stamp, so it must be concise.
    Generate a plausible phone number if none is provided.
    Return the result as a JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Could not generate AI suggestion. Please try again.");
    }
};

export const getPDFSummary = async (pdfText: string) => {
    const ai = getGenAI();
    const prompt = `Provide a concise summary of the following document content. The text was extracted from a PDF and may contain formatting issues. Interpret it intelligently and focus on the key points, main purpose, and any major conclusions or calls to action. Present the summary in well-structured paragraphs.

    Document Content:
    """
    ${pdfText}
    """
    `;

    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch(error) {
        console.error("Gemini API call for summary failed:", error);
        throw new Error("Could not generate AI summary. Please try again.");
    }
}