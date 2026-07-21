# BOB

**AI Territory Inspector**

BOB reads uploaded territorial evidence and presents a clear preliminary inspection using the underlying PSM methodology. Bob is not a chatbot: the experience is designed to feel like an inspector physically moving through the land before presenting its intelligence.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Sprint M2 — Bob Comes Alive

The complete cached inspection path remains deterministic and does not require an API key:

1. Select **Start Inspection**.
2. Watch Bob move through seven territory states: survey, terrain, drainage, vegetation, access, opportunity and synthesis.
3. Read Bob's Colina Condesa inspection narrative.
4. Open the dark Territory Dashboard.
5. Review the territory hero, Bob Inspector panel and Opportunity Score.
6. Run the inspection again.

The uploaded-survey path remains available and continues to use `POST /api/inspect` with `OPENAI_API_KEY`.

## Bob asset library

Bob is loaded exclusively from `public/assets/bob/`:

```text
public/assets/bob/
├── master/
├── expressions/
├── animations/
├── audio/
├── scenarios.json
└── README.md
```

The client fetches `scenarios.json` and selects Bob's animation, expression, optional territory background and audio reference by application state. Scenario entries may be an object map or an array and can use `src`, `path`, `file` or `url` fields. Missing scenario fields fall back through the same Bob asset-library folders; no screen hardcodes a Bob portrait.

Territory backgrounds are handled separately by `TerritoryVisual`, so survey, DEM, terrain, orthophoto, masterplan and opportunity imagery can be replaced by future project data without changing Bob's state machine.

## Architecture

- Next.js App Router, React and TypeScript.
- One client-side inspection state machine preserving the Sprint M1 flow.
- `BobRenderer` owns Bob media selection and subtle motion.
- `TerritoryVisual` owns replaceable project backgrounds and analysis overlays.
- `InspectionExperience` owns loading timing, upload behavior and screen progression.
- Cached Colina Condesa mode remains independent from OpenAI.
- No authentication or database.

## Environment

Create `.env.local` only for live uploaded-survey inspections:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6
```

## Validation

```bash
npm run lint
npm run build
```
