
import { GoogleGenAI, Type } from "@google/genai";
import { WrappedData } from "../types";

export async function generateManagerAnalysis(data: WrappedData) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this Fantasy Premier League (FPL) season data for a manager named ${data.managerName}:
    - Team Name: ${data.teamName}
    - Total Points: ${data.totalPoints}
    - Overall Rank: ${data.overallRank}
    - Best Week: GW${data.bestGameweek.gw} with ${data.bestGameweek.points} points.
    - Bench Regret: Total of ${data.totalBenchPoints} points left on the bench. Worst was GW${data.worstBenchRegret.gw} with ${data.worstBenchRegret.points} bench points.
    
    Give them a "Manager Persona" (e.g., The Diamond Hands, The Panic Merchant, The Tinkerman, The Bench King) and a 2-sentence witty, slightly roast-y summary of their season in the style of a football pundit.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            persona: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["persona", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text received from Gemini");
    
    const result = JSON.parse(text);
    return result as { persona: string; summary: string };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Return a solid fallback to ensure the app doesn't break for the user
    return {
      persona: "The Strategic Maverick",
      summary: "Your season has been a masterclass in defiance of the template. Whether by genius or pure chaos, you've carved your own path through the rankings."
    };
  }
}
