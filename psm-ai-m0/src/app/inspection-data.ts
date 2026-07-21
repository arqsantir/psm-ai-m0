export type TerritoryScore = {
  label: string;
  value: number;
  max: number;
};

export type TerritoryInspection = {
  property: string;
  area: string;
  narrativeHeadline: string;
  mainFindings: string[];
  narrative: string[];
  scores: TerritoryScore[];
  opportunityScore: number;
  recommendedDevelopment: string;
  explanation: string;
  confidence: number;
};

export type TerritoryMetric = {
  label: string;
  value: string;
};

export type OpportunityOption = {
  label: string;
  score: number;
  recommended?: boolean;
};

export type InspectionLoadingScene = {
  message: string;
  scene: import("./bob-assets").TerritoryScene;
  scenarioId: string;
  backgroundLabel: string;
  bobAction: string;
};

export const loadingScenes: InspectionLoadingScene[] = [
  {
    message: "Reading topographic survey...",
    scene: "survey",
    scenarioId: "loading-survey",
    backgroundLabel: "Topographic survey",
    bobAction: "Sit · Observe",
  },
  {
    message: "Walking terrain...",
    scene: "terrain",
    scenarioId: "loading-terrain",
    backgroundLabel: "3D terrain model",
    bobAction: "Walk",
  },
  {
    message: "Understanding drainage...",
    scene: "drainage",
    scenarioId: "loading-drainage",
    backgroundLabel: "DEM · Drainage flow",
    bobAction: "Sniff",
  },
  {
    message: "Studying vegetation...",
    scene: "vegetation",
    scenarioId: "loading-vegetation",
    backgroundLabel: "Aerial · Vegetation",
    bobAction: "Look around",
  },
  {
    message: "Reviewing access...",
    scene: "access",
    scenarioId: "loading-access",
    backgroundLabel: "Masterplan · Access",
    bobAction: "Walk",
  },
  {
    message: "Finding opportunities...",
    scene: "opportunity",
    scenarioId: "loading-opportunity",
    backgroundLabel: "Opportunity suitability",
    bobAction: "Thinking",
  },
  {
    message: "Inspection complete",
    scene: "synthesis",
    scenarioId: "loading-complete",
    backgroundLabel: "Territory synthesis",
    bobAction: "Tail wag",
  },
];

export const loadingMessages = loadingScenes.map((scene) => scene.message);

export const colinaCondesaInspection: TerritoryInspection = {
  property: "Colina Condesa",
  area: "Mazatlán · 3 hectares",
  narrativeHeadline: "This territory wants to be shaped by water, vegetation and contour.",
  mainFindings: [
    "Three natural drainage systems organize the territory",
    "The northern plateau offers the clearest development opportunity",
    "Existing vegetation can define a conservation corridor",
    "Gradual slopes support low-impact access and construction",
    "Development should follow the contours instead of flattening them",
    "Low-density use provides the strongest fit",
  ],
  narrative: [
    "I walked this territory carefully.",
    "The land slopes gradually through three natural drainage systems. Water should not be treated as a problem to remove, but as a structure that can organize the project.",
    "The strongest opportunity is on the northern plateau, where access is clearer, terrain disturbance can remain low, and the existing vegetation can help define the character of the place.",
    "This territory does not want to become a conventional subdivision.",
    "It wants to become a low-density community shaped by water, vegetation and the natural contours of the land.",
  ],
  scores: [
    { label: "Drainage", value: 5, max: 5 },
    { label: "Vegetation", value: 5, max: 5 },
    { label: "Topography", value: 5, max: 5 },
    { label: "Accessibility", value: 3, max: 5 },
    { label: "Development Potential", value: 5, max: 5 },
  ],
  opportunityScore: 94,
  recommendedDevelopment: "Eco-residential community",
  explanation:
    "The northern plateau provides the best balance between access, buildability and ecological preservation. A low-density eco-residential community can use the three drainage systems as organizing infrastructure while retaining the territory’s strongest vegetation corridors.",
  confidence: 94,
};

export const colinaTerritoryMetrics: TerritoryMetric[] = [
  { label: "Land Health Score", value: "87 / 100" },
  { label: "Terrain Stability", value: "High" },
  { label: "Water Intelligence", value: "High" },
  { label: "Ecological Value", value: "High" },
  { label: "Accessibility", value: "Medium" },
  { label: "Development Risk", value: "Low" },
];

export const colinaInspectorDetails: TerritoryMetric[] = [
  { label: "Terrain", value: "Gradual slope" },
  { label: "Watersheds", value: "3" },
  { label: "Main opportunity", value: "Northern plateau" },
  { label: "Recommended density", value: "Low" },
  { label: "Best use", value: "Eco-residential community" },
  { label: "Key principle", value: "Build with the contours" },
];

export const colinaOpportunities: OpportunityOption[] = [
  { label: "Eco-residential community", score: 94, recommended: true },
  { label: "Wellness retreat", score: 88 },
  { label: "Regenerative agriculture", score: 82 },
  { label: "Conventional subdivision", score: 61 },
  { label: "Industrial development", score: 34 },
];
