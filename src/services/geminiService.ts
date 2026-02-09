
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { EventType } from "../types";

// Note: process.env.API_KEY is pre-configured
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseVoiceInput(text: string, dogName: string): Promise<any> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this pet care log for ${dogName}: "${text}"`,
    config: {
      systemInstruction: `You are a professional pet data parser. Extract structured information from raw text.
      Return JSON representing the event.
      Types: pee, poop, food, water, walk, health_check.
      Consistency for poop is 1-5 (1=hard, 5=liquid).
      Volume is small, medium, large.
      Duration is for walks (e.g., "20 mins", "1 hour").`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          event: { type: Type.STRING, enum: Object.values(EventType) },
          metadata: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.STRING },
              volume: { type: Type.STRING },
              consistency: { type: Type.NUMBER },
              urgency_reset: { type: Type.BOOLEAN },
              health_flag: { type: Type.BOOLEAN },
              duration: { type: Type.STRING, description: "Duration of the walk if specified" }
            }
          }
        },
        required: ["event"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
}

export async function analyzeStool(base64Image: string): Promise<any> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Analyze this pet stool sample for health markers. Focus on color and consistency. Be professional but empathetic." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          consistency: { type: Type.NUMBER, description: "Scale 1-5" },
          healthFlag: { type: Type.BOOLEAN },
          analysis: { type: Type.STRING },
          advice: { type: Type.STRING }
        },
        required: ["consistency", "healthFlag", "analysis"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function getAvatarResponse(eventDescription: string, dogProfile: any): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Respond as ${dogProfile.name}, a ${dogProfile.breed}. The human just logged: ${eventDescription}`,
    config: {
      systemInstruction: `You are ${dogProfile.name}, the user's dog. Speak in the first person. 
      Be charming, loyal, and a bit goofy but observant of your health. Use emojis. 
      Keep it short (1-2 sentences).`,
    }
  });
  return response.text.trim();
}

/**
 * Generates a breed-specific portrait for the dog avatar.
 */
export async function generateDogAvatar(breed: string, lifeStage: string): Promise<string | null> {
  const ai = getAI();
  const prompt = `A cinematic, high-fashion studio portrait of a ${breed} ${lifeStage}. Professional lighting, soft bokeh background, high detail fur texture, 8k resolution, elegant and soulful expression.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Avatar generation failed", err);
    return null;
  }
}
