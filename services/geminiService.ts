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
    
        // ... inside generateRoadmap function ...
    const data = JSON.parse(cleanedJson);
    
    // FORCE LAYOUT: Overwrite AI coordinates to guarantee visibility
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`, // Ensure ID exists
      // Create a vertical zig-zag pattern (Center, Left, Right, Center...)
      position: { 
        x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -200 : 200), 
        y: index * 250 
      },
      // Ensure the first node is always clickable/available
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
