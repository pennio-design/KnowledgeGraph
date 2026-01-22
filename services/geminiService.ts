
import { GoogleGenAI, Type } from "@google/genai";
import { Roadmap } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: `You are an expert curriculum designer. Based on the following user input, generate a structured, comprehensive learning roadmap.
    
    Learning Goal: ${goal}
    Current Background: ${background}
    Constraints & Preferences: ${constraints}
    
    The output must be a valid JSON object matching this structure exactly:
    {
      "title": "String",
      "domain": "String",
      "nodes": [
        {
          "id": "node-1",
          "title": "String",
          "description": "2-3 sentences",
          "nodeType": "concept|milestone|optional",
          "category": "String",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedHours": Number,
          "prerequisites": ["node-id"],
          "learningObjectives": ["string"],
          "keyTopics": ["string"],
          "position": { "x": Number, "y": Number },
          "resources": [
            {
              "id": "res-1",
              "url": "String",
              "title": "String",
              "author": "String",
              "platform": "YouTube|MDN|GitHub|etc",
              "format": "video|article|interactive|documentation",
              "description": "String",
              "duration": Number,
              "difficulty": "beginner|intermediate|advanced",
              "isFree": true
            }
          ]
        }
      ],
      "edges": [
        { "id": "edge-1", "source": "node-1", "target": "node-2" }
      ]
    }
    
    Ensure the nodes are positioned logically in a top-down or left-right flow. Provide at least 3-5 nodes per stage (Foundation, Intermediate, Advanced, Specialization). Provide 3-5 high-quality resources for EACH node. Use real URLs where possible or placeholders for high-quality expected content.`,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  });

  try {
    const rawJson = response.text.trim();
    const data = JSON.parse(rawJson);
    
    // Fix: Include 'createdAt' property to match Roadmap interface
    return {
      id: `roadmap-${Date.now()}`,
      title: data.title,
      domain: data.domain,
      nodes: data.nodes.map((n: any) => ({
        ...n,
        status: n.prerequisites.length === 0 ? 'available' : 'locked'
      })),
      edges: data.edges,
      progress: {
        completedNodes: 0,
        totalNodes: data.nodes.length,
        percentage: 0
      },
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not generate your roadmap. Please try again.");
  }
};
