# KnowledgeGraph Deployment Guide

This guide explains how to deploy the KnowledgeGraph application to production environments.

## Prerequisites

1.  **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).
2.  **GitHub Account**: Required for GitHub Pages deployment.
3.  **Node.js & NPM**: Installed on your local machine for local builds.

## Deployment Options

### 1. GitHub Pages (Recommended)

This project includes a GitHub Actions workflow for automated deployment.

1.  Create a new repository on GitHub.
2.  Push your code to the `main` branch.
3.  Go to **Settings > Secrets and variables > Actions**.
4.  Add a **New repository secret**:
    *   Name: `API_KEY`
    *   Value: Your Google Gemini API Key.
5.  Go to **Settings > Pages**:
    *   Under **Build and deployment > Source**, select **GitHub Actions**.
6.  The next time you push to `main`, the `deploy.yml` workflow will trigger and deploy your site.

### 2. Vercel / Netlify

These platforms detect Vite projects automatically.

1.  Connect your repository to Vercel or Netlify.
2.  Set the **Build Command**: `npm run build`
3.  Set the **Output Directory**: `dist`
4.  Add an **Environment Variable**:
    *   Key: `API_KEY`
    *   Value: Your Google Gemini API Key.

## Local Production Build

To test the production build locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Preview the build
npm run preview
```

## Security Best Practices

*   **API Key Protection**: Never hardcode your `API_KEY` in the source code. Always use `process.env.API_KEY` and set it via secrets/environment variables.
*   **Rate Limiting**: The Gemini Free Tier has rate limits. Monitor your usage in the Google Cloud Console if your traffic grows.

## Troubleshooting

*   **Blank Screen on Deployment**: Ensure the `base` path in `vite.config.ts` matches your GitHub repository name if not using a custom domain.
*   **API 403 Errors**: Check if your API key is correctly configured in the environment variables and has access to the Gemini 2.0/3.0 models.
