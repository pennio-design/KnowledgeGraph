import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- CORE: Roadmap Generation ---
export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // Using the Experimental "Wolf" Model (Smarter/Faster)
  // If you get "429/Resource Exhausted", switch this string to "gemini-1.5-flash"
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
      config: { responseMimeType: "application/json" },
    });

    // ROBUSTNESS: Handle both function (new SDK) and property (old SDK) access
    let responseText = "";
    if (typeof response.text === 'function') {
        responseText = response.text();
    } else if (response.text) {
        responseText = response.text as string;
    } else {
        responseText = "";
    }
    
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    // AUTO-LAYOUT: Vertical Zig-Zag
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
      progress: { completedNodes: 0, totalNodes: nodesWithLayout.length, percentage: 0 },
      createdAt: Date.now()
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Unknown error occurred");
  }
};

// --- FEATURE: Daily Creative Briefs (The "Wolf" Grind) ---
export const generateDailyBrief = async (currentTopic: string, roleGoal: string): Promise<string> => {
  const modelId = "gemini-2.0-flash-exp"; 
  const prompt = `You are "The Wolf" - a no-nonsense career coach.
  The user is learning: "${currentTopic}".
  Role Goal: ${roleGoal}.

  Generate a ONE-SHOT, 15-minute practical task.
  Rules:
  1. No research. Pure action.
  2. Use the tools they likely have installed.
  3. Output format: 
     "MISSION: [Task Name]
      BRIEF: [2 sentences]
      WIN CONDITION: [How they know they finished]."
  
  Make it sound urgent and exciting.`;

  try {
    const response = await ai.models.generateContent({ model: modelId, contents: prompt });
    return typeof response.text === 'function' ? response.text() : (response.text as string);
  } catch (e) {
    return "MISSION: Speed Run \n\n BRIEF: Explain this concept to a 5-year-old in 60 seconds. \n\n WIN CONDITION: You recorded yourself doing it.";
  }
};

// --- FEATURE: CV/Resume Generator ---
export const generateResumePoints = async (completedNodes: string[], targetRole: string): Promise<string[]> => {
  const modelId = "gemini-2.0-flash-exp";
  const prompt = `The user has mastered these concepts: ${completedNodes.join(', ')}.
  They are applying for a ${targetRole} position.
  
  Generate 3 high-impact, Senior-level resume bullet points (STAR method).
  Return ONLY a JSON array of strings: ["Bullet 1", "Bullet 2", "Bullet 3"]`;

  try {
    const response = await ai.models.generateContent({ 
        model: modelId, 
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    let text = typeof response.text === 'function' ? response.text() : (response.text as string);
    text = text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return ["Demonstrated continuous learning by mastering modern tech stack foundations."];
  }
};