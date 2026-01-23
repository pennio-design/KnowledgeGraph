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

## Phase 2: Career & Mastery (The "Wolf" Expansion)
**Goal:** Transform "Learners" into "Hired Professionals" by generating proof of work, daily habits, and career assets.

### 2.1 Smart Certificate Engine ("Proof of Work")
- **Trigger:** Unlocks only when Roadmap Progress = 100%.
- **Output:** Generates a downloadable PDF Certificate.
- **Key Data:** User Name, Roadmap Title, Date, Unique Verification ID (Hash), and "KnowledgeGraph Verified" Seal.
- **Vibe:** sleek, dark-mode aesthetic (Black/Gold).

### 2.2 The "Resu-Maker" (CV Section)
- **Concept:** Translates "Completed Nodes" into "Hired Bullet Points."
- **AI Logic:** "Analyze the nodes {React, TypeScript, Tailwind} the user completed. Generate 3 punchy, Senior-level resume bullet points tailored for a Frontend Developer role."
- **UI:** A "Career" tab in the Dashboard where users can copy/paste these directly into their CV.

### 2.3 Daily "Grind" Briefs (Hands-On Mode)
- **Problem:** "Tutorial Hell" (watching videos but not doing).
- **Solution:** A daily, AI-generated 15-minute challenge based on the *current* active node.
- **Example:** "Don't just watch a video on Flexbox. Build a layout with 3 divs that looks like a Mondrian painting. You have 15 mins. Go."

### 2.4 The "Oral Exam" (Mastery Verification)
- **Concept:** Prevents users from fake-clicking "Complete."
- **Mechanism:** To mark a Milestone node as done, the user must enter a "Boss Fight" chat.
- **Flow:** The AI asks 3 hard questions. The user must answer correctly to unlock the next stage.

### 2.5 "Squad Races" (Social Accountability)
- **Concept:** Create a lobby with a friend. Both generate the same roadmap.
- **UI:** A visual progress bar showing who is winning (User vs. Friend).
- **Stakes:** Loser owes the winner lunch (honor system).

## 3. Career Acceleration Features (Phase 2)

### 3.1 Daily "Wolf" Briefs
- **Goal:** Break "tutorial hell" with bias-for-action.
- **Mechanism:** A dedicated dashboard card that generates a 15-minute timer-based challenge for the user's *current active node*.
- **Vibe:** High pressure, high reward. "Don't think, build."

### 3.2 The Resu-Maker (CV Engine)
- **Goal:** Monetize learning immediately.
- **Data Source:** Takes the `completedNodes` array.
- **Output:** AI-generated "Corporate-Ready" bullet points that translate "I watched a video on React" into "Architected scalable frontend components using React and TypeScript."

### 3.3 Proof of Work (Certificates)
- **Goal:** Social signaling.
- **Trigger:** 100% Roadmap Completion.
- **Output:** A dynamically generated PDF with a unique hash (for verification).