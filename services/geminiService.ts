import { GoogleGenerativeAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
  
  const prompt = `You are an expert curriculum designer. Generate a structured learning roadmap for:
    Goal: ${goal}
    Background: ${background}
    Constraints: ${constraints}
    
    Return ONLY raw JSON (no markdown formatting, no code blocks) matching this structure:
    {
      "title": "String",
      "domain": "String",
      "nodes": [
        {
          "id": "1",
          "title": "Node Title",
          "description": "Brief description",
          "nodeType": "concept",
          "category": "Foundation",
          "difficulty": "beginner",
          "estimatedHours": 2,
          "prerequisites": [],
          "learningObjectives": ["Objective 1"],
          "keyTopics": ["Topic 1"],
          "position": { "x": 0, "y": 0 },
          "resources": []
        }
      ],
      "edges": []
    }`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // CLEANER: Strip markdown code blocks if they exist
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    
    const data = JSON.parse(cleanedJson);
    
    return {
      id: `roadmap-${Date.now()}`,
      ...data,
      nodes: data.nodes.map((n: any) => ({
        ...n,
        status: n.prerequisites.length === 0 ? 'available' : 'locked'
      })),
      progress: { completedNodes: 0, totalNodes: data.nodes.length, percentage: 0 },
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate roadmap. Please try again.");
  }
};
