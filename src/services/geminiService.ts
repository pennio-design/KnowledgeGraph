import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // UPGRADE: Using Gemini 2.0 Flash Experimental. 
  // Smarter than Pro, Faster than Flash.
  const modelId = "gemini-2.0-flash-exp"; 

  const prompt = `You are "The Wolf" - an elite technical curriculum architect. 
    Design a high-level, practical learning roadmap.
    
    Goal: ${goal}
    User Background: ${background}
    Constraints: ${constraints}
    
    CRITICAL INSTRUCTION: Return ONLY valid, raw JSON. 
    Do NOT use Markdown code blocks. Do NOT include \`\`\`json.
    
    Structure the response to match this interface:
    {
      "title": "String (High-Impact Title)",
      "domain": "String (Field of Study)",
      "nodes": [
        {
          "id": "1",
          "title": "String",
          "description": "Specific, actionable explanation.",
          "nodeType": "concept",
          "category": "Foundation|Core|Specialization",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedHours": Number,
          "prerequisites": [],
          "learningObjectives": ["Skill 1", "Skill 2"],
          "keyTopics": ["Topic 1", "Topic 2"],
          "position": { "x": 0, "y": 0 },
          "resources": [
            {
              "id": "res-1",
              "url": "https://example.com", 
              "title": "Resource Title",
              "author": "Author Name",
              "platform": "YouTube|Documentation|Course",
              "format": "video|article",
              "description": "Why this resource rocks",
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
    1. Create a "Zero to Hero" arc.
    2. Minimum 6 nodes.
    3. Resources must be real and high-quality.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      // Removed responseMimeType to prevent compatibility issues
    });

    // ROBUSTNESS: Handle both function (new SDK) and property (old SDK) access
    // This fixes the crash if the SDK version is slightly different
    let responseText = "";
    if (typeof response.text === 'function') {
        responseText = response.text();
    } else if (response.text) {
        responseText = response.text as string;
    } else {
        throw new Error("Empty response from AI");
    }
    
    // Clean potential markdown
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    
    const data = JSON.parse(cleanedJson);

    // AUTO-LAYOUT: Vertical Zig-Zag for mobile readability
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
    // EXPOSE THE REAL ERROR to the user for debugging
    throw new Error(error.message || "Unknown error occurred");
  }
};
