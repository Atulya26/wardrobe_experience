# Companion — Onboarding

Independent React + TypeScript + Vite prototype for a laptop browser.

## Local development

Use Node.js 22.12 or newer within the 22.x release line.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

This application currently has no automated test script.

## Vercel

Import the repository as a separate Vercel project and select `Onboarding-Reworked` as Root Directory. The included vercel.json configures Vite, npm ci, npm run build and dist. Use Node.js 22.x. Do not select the repository root as the app root.

## Interaction

Mouse simulates gaze; click or Enter simulates pinch; V provides an optional voice simulation. See the on-screen help for gesture and placement controls. Open in a full browser tab for enough space and keyboard focus.

Recognition, fit estimates, body previews and conversations are illustrative simulations. Sharing does not contact anyone. Local browser storage, where used, is scoped to this app's deployed origin.
