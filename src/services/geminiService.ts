import { GoogleGenAI } from "@google/genai";
import { Roadmap, UnifiedRoadmap } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ... (Keep existing generateRoadmap, generateDailyBrief, generateResumePoints, generateTutorLesson) ...

// --- FEATURE: Meta-Learning Synthesis (God Mode) ---
export const synthesizeRoadmaps = async (roadmaps: Roadmap[]): Promise<UnifiedRoadmap> => {
  const modelId = "gemini-2.5-flash";

  // Optimization: Send only essential data to save tokens
  const simplifiedInput = roadmaps.map(r => ({
    id: r.id,
    title: r.title,
    nodes: r.nodes.map(n => ({ 
      title: n.title, 
      category: n.category 
    }))
  }));

  const prompt = `You are the "Meta-Learning Architect."
  Analyze these ${roadmaps.length} distinct learning roadmaps:
  ${JSON.stringify(simplifiedInput)}

  Task: Merge them into ONE Unified Knowledge Graph.
  
  RULES:
  1. DEDUPLICATE: Combine similar concepts (e.g. "React Basics" + "Intro to React" -> "React Fundamentals").
  2. CROSS-REFERENCE: You MUST track which 'id' from the input contained the node.
  3. SCORING: Calculate "Global Priority" (0-100). High score = appears in multiple maps OR is a critical foundation.

  Return ONLY raw JSON matching this structure:
  {
    "title": "Unified Mastery Path",
    "goals": ["Goal 1", "Goal 2"],
    "nodes": [
      {
        "id": "u1",
        "title": "String (Standardized Name)",
        "description": "Synthesized definition",
        "originRoadmapIds": ["roadmap_id_1", "roadmap_id_2"],
        "globalPriorityScore": 85,
        "isBottleneck": true, 
        "category": "Foundation|Specialized|Mastery",
        "position": { "x": 0, "y": 0 }
      }
    ],
    "edges": [
       { "id": "e1", "source": "u1", "target": "u2" }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    const cleanedJson = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    // Layout Logic: Distribute nodes based on Priority (High priority = Central/Top)
    const nodesWithLayout = data.nodes.map((node: any, index: number) => ({
      ...node,
      id: node.id || `unified-${index}`,
      // Visual: High priority nodes are centered, specialized ones drift out
      position: { 
        x: (index % 2 === 0 ? -1 : 1) * (100 - node.globalPriorityScore) * 5, 
        y: index * 180 
      },
      status: 'available', // Unified view is for planning, mostly open
      resources: [], // Unified view focuses on structure, not individual links yet
      synergyCount: node.originRoadmapIds.length
    }));

    return {
      id: `unified-${Date.now()}`,
      nodes: nodesWithLayout,
      edges: data.edges || [],
      totalMastery: 0,
      goals: roadmaps.map(r => r.title),
      generatedAt: Date.now()
    };
  } catch (error: any) {
    console.error("Synthesis Error:", error);
    throw new Error("Failed to synthesize roadmaps.");
  }
};
