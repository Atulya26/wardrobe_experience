# Companion — Spatial Wardrobe Experience

Four independent, laptop-browser portfolio demos. This repository stores the applications together for version control; each deploys to a separate Vercel project and URL.

| Demo | App / Vercel Root Directory | Local dev port |
| --- | --- | --- |
| Onboarding in a living room | `Onboarding-Reworked` | 5178 |
| Flow 1: wardrobe styling and outfit customization | `Flow-1-Reworked` | 5179 |
| Flow 2: mirror fit check and simulated sharing | `Flow-2-Reworked` | 5180 |
| Flow 3: store browsing, shortlist and try-on comparison | `Flow-3-Reworked` | 5182 |

See [DEPLOYMENT.md](DEPLOYMENT.md) for the four-project Vercel setup.

## Development

Use Node.js 22.12+ within the 22.x release line. Enter an app folder, run `npm ci`, then `npm run dev`. Build with `npm run build`; production preview is available with `npm run preview`. Flow 1/2/3 also have `npm test`; onboarding currently has no automated test script. GitHub Actions installs, tests where available, and builds each app independently.

## Experience

These are first-person laptop-browser simulations of spatial styling interactions. Mouse movement simulates looking; click/Enter simulates pinch; optional voice interactions do not require microphone access. Generated photographic scenes and wearer images are illustrative. Recognition, pairing, fit estimates and sharing are simulated; no real body scanning, messaging or purchasing occurs. Save behavior uses local browser storage where supported.

The four apps do not share state across deployed URLs. They do not require backend services or API keys. Portfolio links should open full browser tabs for comfortable space and keyboard focus.

## Source and assets

This is a curated deployment copy of the completed reworked projects. Required runtime assets are included; the author's original research, case-study exports, historical attempts, local dependencies, generated builds, screenshots and backups are excluded. Known old photographic alternatives were omitted from this copy; the original folders remain unchanged.

Apple SF Symbols PNG masks are existing prototype assets, not original artwork or a newly granted cross-platform license; see [asset notes](ASSETS.md). No blanket open-source license is granted by this repository.
