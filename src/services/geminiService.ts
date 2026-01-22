import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // 1. REVERT: Use the model you confirmed works best
  const model = 'gemini-2.0-flash-exp'; 
  
  const response = await ai.models.generateContent({
    model,
    contents: `You are an expert curriculum designer. Based on the following user input, generate a structured, comprehensive learning roadmap.
    
    Learning Goal: ${goal}
    Current Background: ${background}
    Constraints & Preferences: ${constraints}
    
    CRITICAL: Return ONLY valid, raw JSON. Do NOT use markdown code blocks (no \`\`\`json).
    
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
    
    Ensure the nodes are positioned logically in a top-down or left-right flow. Provide at least 3-5 nodes per stage.`,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  });

  try {
    // 2. BUILD FIX: Access .text as a property (String), NOT a function.
    // This matches your original file and fixes the GitHub Action failure.
    const rawText = response.text || "";

    // 3. CRASH FIX: Strip markdown so users don't see "Failed to generate"
    const cleanedJson = rawText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedJson);
    
    // 4. LAYOUT FIX: Apply Zig-Zag to ensure nodes are visible
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`,
      position: { 
        x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -220 : 220), 
        y: index * 260 
      },
      status: index === 0 ? 'available' : (node.prerequisites.length === 0 ? 'available' : 'locked'),
      resources: node.resources || []
    }));

    return {
      id: `roadmap-${Date.now()}`,
      title: data.title || goal,
      domain: data.domain || "Custom Learning Path",
      nodes: nodesWithLayout, // Use the layout-fixed nodes
      edges: data.edges || [],
      progress: {
        completedNodes: 0,
        totalNodes: nodesWithLayout.length,
        percentage: 0
      },
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not generate your roadmap. Please try again.");
  }
};
