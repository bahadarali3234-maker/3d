import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SceneConfig {
  gameType: string;
  environment: {
    skyColor: string;
    groundColor: string;
  };
  objects: Array<{
    type: "car" | string;
    color: string;
    position: [number, number, number];
  }>;
  camera: {
    position: [number, number, number];
  };
}

export async function generateSceneFromPrompt(prompt: string): Promise<SceneConfig> {
  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: `Translate the following description into a 3D scene JSON object: "${prompt}"`,
    config: {
      systemInstruction: "You are a 3D scene generator. You translate descriptions into structured JSON. 'car' objects should be represented as cubes in our renderer. 'road' objects should be represented as planes. All colors should be valid CSS/Three.js color strings. Positions are [x, y, z] coordinates.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          gameType: { type: Type.STRING },
          environment: {
            type: Type.OBJECT,
            properties: {
              skyColor: { type: Type.STRING },
              groundColor: { type: Type.STRING },
            },
            required: ["skyColor", "groundColor"],
          },
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                color: { type: Type.STRING },
                position: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ["type", "color", "position"],
            },
          },
          camera: {
            type: Type.OBJECT,
            properties: {
              position: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
              },
            },
            required: ["position"],
          },
        },
        required: ["gameType", "environment", "objects", "camera"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as SceneConfig;
}
