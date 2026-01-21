# KNOWLEDGEGRAPH - PRODUCT REQUIREMENTS DOCUMENT

## Executive Summary
KnowledgeGraph is an AI-powered learning platform that transforms a simple three-question framework into a personalized, visual learning roadmap. It curates the best free resources from across the web and organizes them into a structured curriculum tailored to the user's specific goals, background, and constraints.

## Problem Statement
Learners today are overwhelmed by "choice paralysis." With millions of free tutorials, articles, and videos available, the hardest part of learning isn't finding information—it's knowing what to learn first, what to skip, and how to verify quality.

## Solution Overview
**Core Value Proposition:** "Answer 3 questions. Get a personalized learning roadmap with the best free resources from across the web, organized visually so you know exactly what to learn next."

## Three-Question Framework
1. **Learning Goal:** "What do you want to learn or achieve?"
2. **Current Background:** "What relevant skills or experience do you already have?"
3. **Learning Constraints & Preferences:** "How do you prefer to learn, and what's your timeline?"

## AI Processing Pipeline
- **Input Analysis:** Uses Gemini to extract structured data (domain, target level, background proficiency, time availability).
- **Curriculum Generation:** Matches inputs to curriculum templates and customizes nodes.
- **Resource Ranking:** Uses multi-factor scoring (relevance, quality, recency, format match) to provide top resources for each node.

## Core Features
1. **Intake System:** Seamless 3-step conversational form.
2. **AI Roadmap Generation:** Dynamic creation of hierarchical learning paths.
3. **Knowledge Graph Visualization:** Interactive flow chart using React Flow.
4. **Resource Ranking:** Curated list of high-quality free learning materials.
5. **Progress Tracking:** Ability to mark nodes as complete and unlock prerequisites.
6. **User Dashboard:** Analytics and streak tracking for motivation.

## Technical Architecture
- **Frontend:** Next.js / React with Tailwind CSS.
- **Graph Engine:** React Flow.
- **Intelligence:** Google Gemini API (gemini-3-flash-preview).
- **Icons:** Lucide-React.
- **Charts:** Recharts.

## Quality Standards
- Responsive design for mobile and desktop.
- High accessibility (ARIA attributes).
- Performance optimized (minimal loading states).
- Aesthetic and modern UI/UX design.