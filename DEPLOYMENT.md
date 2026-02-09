# Deploying TailTalk AI

This guide provides instructions on how to deploy the TailTalk AI web application.

## Prerequisites

1.  **Git Repository**: Ensure your code is in a Git repository (e.g., on GitHub).
    -   If not already initialized:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        ```
    -   Create a new repository on [GitHub](https://github.com/new) and follow the instructions to push your code.

## Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Vite applications and handles environment variables securely.

1.  **Sign up/Login**: Go to [vercel.com](https://vercel.com).
2.  **Import Project**: Click "Add New" -> "Project".
3.  **Connect GitHub**: Select your `tailtalk-ai` repository.
4.  **Configure Project**:
    -   **Framework Preset**: Vite (should be auto-detected).
    -   **Root Directory**: `./`
    -   **Environment Variables**: Add `GEMINI_API_KEY` with your API key value.
5.  **Deploy**: Click "Deploy". Your app will be live in a few minutes!

## Option 2: GitHub Pages

1.  **Install gh-pages**:
    ```bash
    npm install --save-dev gh-pages
    ```
2.  **Update `package.json`**:
    -   Add `"homepage": "https://<your-username>.github.io/tailtalk-ai/"`
    -   Add to `scripts`:
        ```json
        "predeploy": "npm run build",
        "deploy": "gh-pages -d dist"
        ```
3.  **Update `vite.config.ts`**:
    -   Add `base: '/tailtalk-ai/'` to the configuration object.
4.  **Deploy**:
    ```bash
    npm run deploy
    ```
5.  **Environment Variables**: GitHub Pages is for static sites. Since your `API_KEY` is handled via `process.env` in Vite, it will be bundled into the client-side code during `npm run build`. 
    > [!WARNING]
    > Using GitHub Pages will expose your API key in the client-side bundle. For production apps, use Vercel or a backend proxy.

## Setting Up CI/CD

We've included a GitHub Action in `.github/workflows/ci.yml` that automatically runs a build check on every push to the `main` branch to ensure your code is always deployable.
