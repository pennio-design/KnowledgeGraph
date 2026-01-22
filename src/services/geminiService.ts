import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // SWITCH: 'gemini-1.5-flash' is the stable production model.
  // It has high rate limits so your users won't get "Quota Exceeded" errors.
  const modelId = "gemini-1.5-flash"; 

  const prompt = `You are an expert curriculum designer. Generate a structured learning roadmap.
    
    Goal: ${goal}
    Background: ${background}
    Constraints: ${constraints}
    
    Return ONLY raw JSON (no markdown, no code blocks) matching this structure:
    {
      "title": "String",
      "domain": "String",
      "nodes": [
        {
          "id": "1",
          "title": "String",
          "description": "Brief description",
          "nodeType": "concept",
          "category": "Foundation",
          "difficulty": "beginner",
          "estimatedHours": 2,
          "prerequisites": [],
          "learningObjectives": ["Objective 1"],
          "keyTopics": ["Topic 1"],
          "position": { "x": 0, "y": 0 },
          "resources": [
             {
              "id": "r1",
              "title": "Resource Name",
              "url": "https://example.com",
              "platform": "YouTube|Web",
              "format": "video|article",
              "description": "Brief info",
              "duration": 10,
              "difficulty": "beginner",
              "isFree": true,
              "author": "Author Name"
             }
          ]
        }
      ],
      "edges": []
    }
    
    Provide 5-8 nodes. Ensure logical flow.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json", 
      },
    });

    // ROBUSTNESS: This handles both SDK versions (Function vs Property)
    // This prevents the "Red X" build errors you saw earlier.
    let responseText = "";
    if (typeof response.text === 'function') {
        responseText = response.text();
    } else {
        responseText = (response.text as string) || "";
    }
    
    // CLEANER: Strip markdown just in case
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    
    const data = JSON.parse(cleanedJson);

    // LAYOUT: Keep the Zig-Zag so nodes are visible
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`,
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
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Show the actual error message if something goes wrong
    throw new Error(error.message || "Failed to generate roadmap.");
  }
};
