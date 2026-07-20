export type TerritoryScore = {
  label: string;
  value: number;
  max: number;
};

type CachedInspection = {
  property: string;
  area: string;
  mainFindings: string[];
  narrative: string[];
  scores: TerritoryScore[];
  opportunityScore: number;
  recommendedDevelopment: string;
  explanation: string;
  confidence: number;
};

export const loadingMessages = [
  "Reading topographic survey...",
  "Analyzing terrain...",
  "Understanding drainage...",
  "Studying vegetation...",
  "Finding opportunities...",
  "Bob is inspecting the territory...",
] as const;

export const colinaCondesaInspection: CachedInspection = {
  property: "Colina Condesa",
  area: "3 hectares",
  mainFindings: [
    "Three natural drainage basins",
    "Good infiltration",
    "Existing vegetation worth preserving",
    "Gentle slopes",
    "High development potential",
    "No major flooding risk",
  ],
  narrative: [
    "I walked this territory.",
    "Water naturally converges into three basins.",
    "The existing slopes already suggest where infrastructure should follow the land instead of fighting it.",
    "This site is asking for low-impact development.",
  ],
  scores: [
    { label: "Drainage", value: 5, max: 5 },
    { label: "Vegetation", value: 4, max: 5 },
    { label: "Topography", value: 5, max: 5 },
    { label: "Accessibility", value: 4, max: 5 },
    { label: "Development Potential", value: 5, max: 5 },
  ],
  opportunityScore: 92,
  recommendedDevelopment: "Eco Residential Community",
  explanation:
    "The terrain naturally supports low-density residential development with preserved vegetation, passive drainage systems, and minimal earth movement.",
  confidence: 92,
};
