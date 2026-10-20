# Deploy four independent demos to Vercel

## Import each folder separately

1. Connect your GitHub account in Vercel and import `Atulya26/wardrobe_experience`.
2. Create the onboarding project with Root Directory `Onboarding-Reworked`.
3. Repeat the import of the same repository for `Flow-1-Reworked`, `Flow-2-Reworked` and `Flow-3-Reworked`, creating one Vercel project per folder.
4. Use the settings below for every project; select `main` as the production branch.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root Directory | The selected app folder |
| Node.js | 22.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None needed for current demos |

Each app contains vercel.json with these build settings and package.json declaring Node 22.x. No shared root install or workspaces are required. Importing the same repo four times does not combine the sites. Do not deploy the repository root.

## After deployment

- Copy each project's production URL into its matching portfolio launch button.
- Open the URLs in a logged-out/private browser and confirm portfolio visitors do not see a Vercel authentication gate. Set Deployment Protection appropriately for public production demos.
- Reload each production URL. Confirm its room photo, hand textures, controls and model images load with no missing assets.
- Complete the onboarding and each flow on the actual hosted URL; test scan/confirmation, outfit changes, No branches, shortlist, compare, local save and simulated sharing as relevant. Local builds and automated state tests are not a substitute for hosted walkthroughs.
- Test the actual laptop sizes used in your portfolio. These demos are designed for laptop browsers; phone/headset use is not promised.
- Keep demos in full tabs rather than small embedded frames so gaze, keyboard and pointer interactions have room and focus.

## Updates

Commit updated source/assets to GitHub and push to main. Vercel deploys connected projects automatically; verify all four deployment statuses. Because this is a simple multi-folder repo without npm workspaces, do not assume unchanged projects are automatically skipped. GitHub Actions independently builds all four folders. Changes in the author's original working folders are not automatically synchronized into this deployment copy.

## Plan and data

Vercel Hobby permits personal, non-commercial use. Choose an appropriate plan for commercial use: https://vercel.com/docs/plans/hobby . GitHub source visibility and public demo visibility are separate choices. Simulated sharing never sends real messages, and no API keys are needed. Local saves do not move between the four deployed origins.
