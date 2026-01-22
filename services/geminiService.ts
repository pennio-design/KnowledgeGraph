// services/geminiService.ts
import { GoogleGenAI } from "@google/genai"; //
import { Roadmap } from "../types";

// Initialize the new client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); //

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // Use 'gemini-2.0-flash' or 'gemini-1.5-flash'. '3' is not valid yet.
  const modelId = "gemini-1.5-flash"; 

  const prompt = `You are an expert curriculum designer. Generate a structured learning roadmap for:
    Goal: ${goal}
    Background: ${background}
    Constraints: ${constraints}
    
    Return ONLY raw JSON matching this structure:
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
    // Correct method for @google/genai SDK
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json", // Forces JSON output
      },
    });

    // Handle response text (Property, not method in new SDK)
    const responseText = response.text || ""; //
    
    // Clean markdown if strictly necessary (JSON mode usually handles this)
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();

    const data = JSON.parse(cleanedJson);

    // FORCE LAYOUT: Overwrite AI coordinates to guarantee visibility
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`,
      // Zig-zag pattern: Center -> Left -> Center -> Right
      position: { 
        x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -200 : 200), 
        y: index * 250 
      },
      status: index === 0 ? 'available' : (node.prerequisites.length === 0 ? 'available' : 'locked'),
      resources: node.resources || []
    }));

    return {
      id: `roadmap-${Date.now()}`,
      title: data.title || goal,
      domain: data.domain || "Custom Learning Path",
      nodes: nodesWithLayout,
      edges: data.edges || [],
      progress: {
        completedNodes: 0,
        totalNodes: nodesWithLayout.length,
        percentage: 0
      },
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate roadmap. Please try again.");
  }
};
