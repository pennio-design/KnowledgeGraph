import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  // FIXED: 'gemini-1.5-flash' was shut down in late 2025.
  // UPGRADE: 'gemini-2.5-flash' is the new standard production model.
  const modelId = "gemini-2.5-flash"; 

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

    // BUILD SAFE: Access text as a property (fixes Red X)
    const responseText = response.text || ""; 

    // CRASH SAFE: Clean markdown (fixes "Failed to generate")
    const cleanedJson = responseText.replace(/\`\`\`json|\`\`\`/g, '').trim();

    const data = JSON.parse(cleanedJson);

    // LAYOUT SAFE: Keep Zig-Zag (fixes invisible nodes)
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
    throw new Error(error.message || "Failed to generate roadmap.");
  }
};

// --- FEATURE: Daily Creative Briefs (The "Wolf" Grind) ---
export const generateDailyBrief = async (currentTopic: string, roleGoal: string): Promise<string> => {
  const modelId = "gemini-2.5-flash"; 
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
    return response.text || "Mission failed to generate. Go build something anyway.";
  } catch (e) {
    return "MISSION: Speed Run \n\n BRIEF: Explain this concept to a 5-year-old in 60 seconds. \n\n WIN CONDITION: You recorded yourself doing it.";
  }
};

// --- FEATURE: CV/Resume Generator ---
export const generateResumePoints = async (completedNodes: string[], targetRole: string): Promise<string[]> => {
  const modelId = "gemini-2.5-flash";
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
    
    let text = response.text || "[]";
    text = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return ["Demonstrated continuous learning by mastering modern tech stack foundations."];
  }
};

// --- FEATURE: Adaptive Evolution Engine ---
// This function takes the current roadmap and "grows" it based on user performance.
export const evolveRoadmap = async (
  currentRoadmap: Roadmap, 
  completedNodeTitle: string, 
  feedback: 'too_easy' | 'too_hard' | 'just_right'
): Promise<Roadmap> => {
  const modelId = "gemini-2.5-flash"; // 2026 Production Model

  // We send the current structure to the AI and ask it to MUTATE it.
  const prompt = `ACT AS A DYNAMIC CURRICULUM ARCHITECT.
  
  CONTEXT:
  The user just completed the node: "${completedNodeTitle}".
  User Feedback: "${feedback}".
  
  CURRENT ROADMAP JSON:
  ${JSON.stringify(currentRoadmap)}
  
  INSTRUCTIONS:
  1. If feedback is "too_easy": Remove the next immediate beginner node and replace it with a more advanced "Deep Dive" node.
  2. If feedback is "too_hard": Insert a "Remedial/Bridge" node before the next step to explain the basics better.
  3. If "just_right": Add a "Practical Project" node to reinforce the skill.
  4. Keep the rest of the roadmap ID and structure intact.
  
  RETURN ONLY THE MODIFIED RAW JSON of the entire roadmap object.`;

  try {
    const response = await ai.models.generateContent({ 
        model: modelId, 
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    let text = response.text || "";
    text = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    
    // Parse and re-guarantee layout
    const data = JSON.parse(text);
    
    // Preserve completion status of existing nodes, but layout new ones
    const evolvedNodes = data.nodes.map((node: any, index: number) => {
      // Check if this node existed before to preserve its state
      const existingNode = currentRoadmap.nodes.find(n => n.title === node.title);
      return {
        ...node,
        id: existingNode ? existingNode.id : `node-${Date.now()}-${index}`, // New IDs for new nodes
        status: existingNode ? existingNode.status : 'locked', // Preserve status
        // Re-calculate layout to fit new nodes
        position: { 
            x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -220 : 220), 
            y: index * 260 
        },
        resources: node.resources || []
      };
    });

    return {
      ...data,
      nodes: evolvedNodes,
      // Recalculate progress stats
      progress: {
        completedNodes: evolvedNodes.filter((n: any) => n.status === 'completed').length,
        totalNodes: evolvedNodes.length,
        percentage: Math.round((evolvedNodes.filter((n: any) => n.status === 'completed').length / evolvedNodes.length) * 100)
      }
    };
  } catch (error) {
    console.error("Evolution failed:", error);
    return currentRoadmap; // Fail safe: return original roadmap
  }
};
