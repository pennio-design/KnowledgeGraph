import { GoogleGenAI } from "@google/genai";
import { Roadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- CORE: Roadmap Generation ---
export const generateRoadmap = async (
  goal: string,
  background: string,
  constraints: string
): Promise<Roadmap> => {
  const modelId = "gemini-2.5-flash"; 

  // CHANGED: We now ask for 'searchQuery' instead of specific URLs to prevent 404s.
  const prompt = `You are an expert curriculum designer. Generate a structured learning roadmap.
    
    Goal: ${goal}
    Background: ${background}
    Constraints: ${constraints}
    
    Return ONLY raw JSON (no markdown) matching this structure:
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
              "title": "Resource Title",
              "searchQuery": "Exact search term to find the best content",
              "platform": "YouTube|Google|Documentation",
              "format": "video|article",
              "description": "Why this search is valuable",
              "duration": 10,
              "difficulty": "beginner",
              "isFree": true,
              "author": "Best guess author"
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

    const responseText = response.text || ""; 
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    // LOGIC: Transform AI 'searchQuery' into real, working Search URLs
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `node-${index}`,
      position: { 
        x: (index % 2 === 0 ? 0 : index % 4 === 1 ? -200 : 200), 
        y: index * 250 
      },
      status: index === 0 ? 'available' : (node.prerequisites.length === 0 ? 'available' : 'locked'),
      resources: (node.resources || []).map((res: any) => {
        // BUILDER: Construct guaranteed URLs
        let finalUrl = "";
        const query = encodeURIComponent(res.searchQuery || res.title);
        
        if (res.platform?.toLowerCase().includes('youtube')) {
            finalUrl = `https://www.youtube.com/results?search_query=${query}`;
        } else {
            finalUrl = `https://www.google.com/search?q=${query}`;
        }

        return {
            ...res,
            url: finalUrl // Inject the working URL
        };
      })
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

// --- FEATURE: Daily Creative Briefs ---
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
    text = text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return ["Demonstrated continuous learning by mastering modern tech stack foundations."];
  }
};

// --- FEATURE: Tutor Mode (Synthesis Engine) ---
export const generateTutorLesson = async (topic: string): Promise<any> => {
  const modelId = "gemini-2.5-flash"; 
  const prompt = `You are an AI Tutor synthesizing information from multiple sources about: "${topic}".
  
  Generate a lesson with exactly these 3 distinct sections. 
  Return ONLY raw JSON.

  Structure:
  {
    "academic": {
      "source": "Documentation / Standard Def",
      "content": "Formal, precise definition. Mention complexity or standard syntax."
    },
    "practical": {
      "source": "Senior Engineer's Perspective",
      "content": "How this is actually used in prod. Common pitfalls. When to AVOID it."
    },
    "analogy": {
      "source": "Mental Model",
      "content": "Explain it like I'm 10 years old using a real-world analogy (e.g., cooking, traffic, building)."
    },
    "quiz": [
      {
        "question": "A tricky question about ${topic}",
        "options": ["Wrong 1", "Correct Answer", "Wrong 2"],
        "answer": 1,
        "explanation": "Why it is correct."
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({ 
        model: modelId, 
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error(e);
    return null;
  }
};
