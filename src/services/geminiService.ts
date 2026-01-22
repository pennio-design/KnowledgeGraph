// services/geminiService.ts
import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

// Initialize the client with your existing key
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // UPGRADE: Switching to 'gemini-1.5-pro' for smarter, deeper curriculum design.
  const modelId = "gemini-1.5-pro"; 

  const prompt = `You are an expert curriculum architect. Design a high-level, detailed learning roadmap.
    
    Goal: ${goal}
    User Background: ${background}
    Constraints: ${constraints}
    
    CRITICAL INSTRUCTION: Return ONLY valid, raw JSON. Do NOT use Markdown code blocks (no \`\`\`json).
    
    Structure the response to match this exact interface:
    {
      "title": "String (Catchy Course Title)",
      "domain": "String (Field of Study)",
      "nodes": [
        {
          "id": "1",
          "title": "String",
          "description": "Detailed explanation of this concept",
          "nodeType": "concept",
          "category": "Foundation|Core|Specialization",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedHours": Number,
          "prerequisites": [], // IDs of nodes that must be done first
          "learningObjectives": ["List 3 specific skills"],
          "keyTopics": ["List 3-5 sub-topics"],
          "position": { "x": 0, "y": 0 },
          "resources": [
            {
              "id": "res-1",
              "url": "https://example.com", 
              "title": "Resource Title",
              "author": "Author Name",
              "platform": "YouTube|Documentation|Course",
              "format": "video|article",
              "description": "Why this resource is good",
              "duration": 10,
              "difficulty": "intermediate",
              "isFree": true
            }
          ]
        }
      ],
      "edges": [
        { "id": "e1-2", "source": "1", "target": "2" }
      ]
    }
    
    LOGIC: 
    1. Ensure a logical dependency flow (Foundations -> Advanced).
    2. Provide 5-8 nodes minimum.
    3. Resources MUST be real, high-quality links (or realistic placeholders if strictly necessary).`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json", // Forces JSON output
      },
    });

    // CORRECT for @google/genai SDK: Access text as a property
    const responseText = response.text || ""; 
    
    // Safety: Remove markdown blocks just in case
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();

    const data = JSON.parse(cleanedJson);

    // FORCE LAYOUT: Overwrite AI coordinates to guarantee visibility
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`,
      // Zig-zag pattern: Center -> Left -> Center -> Right
      position: { 
        x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -250 : 250), // Widened gap for Pro content
        y: index * 280 
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
    throw new Error("The AI is thinking too hard. Please try again.");
  }
};
