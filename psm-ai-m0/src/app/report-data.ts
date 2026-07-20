import {
  colinaInspectorDetails,
  colinaOpportunities,
  colinaTerritoryMetrics,
  type OpportunityOption,
  type TerritoryInspection,
} from "./inspection-data";

export type ReportMode = "demo" | "upload";

export type ReportOpportunity = OpportunityOption & {
  rationale: string;
};

export type ReportReading = {
  label: string;
  value: string;
};

export type PsmReportData = {
  projectName: string;
  location: string;
  area: string;
  generatedDate: string;
  inspectionMode: string;
  uploadedFileName: string;
  uploadedFileType: string;
  evidenceSources: string[];
  evidenceNote: string;
  conclusion: string;
  summary: string;
  landHealthScore: number;
  opportunityScore: number;
  mainOpportunity: string;
  recommendedDensity: string;
  keyPrinciple: string;
  developmentRisk: string;
  territoryReading: ReportReading[];
  constraints: string[];
  opportunities: ReportOpportunity[];
  finalRecommendation: string;
  recommendationRationale: string;
  organizingSystems: string[];
  developmentApproach: string;
  risksToAvoid: string[];
  suggestedStudies: string[];
  visualizationCaption: string;
};

type CreateReportDataOptions = {
  inspection: TerritoryInspection;
  mode: ReportMode;
  uploadedFileName?: string;
  uploadedFileType?: string;
  generatedAt?: Date;
};

const DEMO_RATIONALES: Record<string, string> = {
  "Eco-residential community":
    "Best alignment with the northern plateau, natural drainage and vegetation corridors.",
  "Wellness retreat":
    "Strong landscape fit with limited disturbance and a territory-led guest experience.",
  "Regenerative agriculture":
    "Compatible with water stewardship and ecological restoration, with access limitations.",
  "Conventional subdivision":
    "Possible, but conventional grading would conflict with drainage and contour logic.",
  "Industrial development":
    "Poor fit with ecological value, access conditions and the low-impact land structure.",
};

const MISSING_EVIDENCE =
  "Not specified in the available structured inspection evidence.";

function cleanText(value: string | undefined, fallback = MISSING_EVIDENCE) {
  const cleaned = value
    ?.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

function parseArea(areaValue: string) {
  const parts = cleanText(areaValue, "")
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    location: parts[0] || "Location not specified",
    area: parts.slice(1).join(" - ") || "Area not specified",
  };
}

function findFinding(
  findings: string[],
  expression: RegExp,
  fallback = MISSING_EVIDENCE,
) {
  return cleanText(findings.find((finding) => expression.test(finding)), fallback);
}

function findScore(inspection: TerritoryInspection, expression: RegExp) {
  return inspection.scores.find((score) => expression.test(score.label));
}

function describeScore(
  inspection: TerritoryInspection,
  expression: RegExp,
  fallback: string,
) {
  const score = findScore(inspection, expression);
  if (!score || score.max <= 0) return fallback;

  const percentage = Math.round((score.value / score.max) * 100);
  const rating = percentage >= 80 ? "High" : percentage >= 60 ? "Moderate" : "Low";
  return `${rating} (${score.value}/${score.max})`;
}

function calculateLandHealth(inspection: TerritoryInspection) {
  const validScores = inspection.scores.filter((score) => score.max > 0);
  if (validScores.length === 0) return inspection.opportunityScore;

  const average =
    validScores.reduce((total, score) => total + score.value / score.max, 0) /
    validScores.length;
  return Math.round(average * 100);
}

function inferDensity(inspection: TerritoryInspection) {
  const source = [
    inspection.narrativeHeadline,
    inspection.explanation,
    ...inspection.mainFindings,
    ...inspection.narrative,
  ]
    .join(" ")
    .toLowerCase();

  if (/low[- ]density/.test(source)) return "Low";
  if (/medium[- ]density/.test(source)) return "Medium";
  if (/high[- ]density/.test(source)) return "High";
  return "Not specified";
}

function inferDevelopmentRisk(inspection: TerritoryInspection) {
  const health = calculateLandHealth(inspection);
  return health >= 80 ? "Low" : health >= 60 ? "Moderate" : "High";
}

function buildUploadedOpportunities(
  inspection: TerritoryInspection,
): ReportOpportunity[] {
  return [
    {
      label: cleanText(inspection.recommendedDevelopment),
      score: inspection.opportunityScore,
      recommended: true,
      rationale: cleanText(inspection.explanation),
    },
  ];
}

function buildDemoOpportunities(): ReportOpportunity[] {
  return colinaOpportunities.map((option) => ({
    ...option,
    rationale: DEMO_RATIONALES[option.label] || MISSING_EVIDENCE,
  }));
}

function displayFileType(fileType: string | undefined) {
  if (!fileType) return "Not applicable";
  if (fileType === "application/pdf") return "PDF";
  if (fileType === "image/jpeg") return "JPEG image";
  if (fileType === "image/png") return "PNG image";
  return cleanText(fileType);
}

export function createPsmReportData({
  inspection,
  mode,
  uploadedFileName,
  uploadedFileType,
  generatedAt = new Date(),
}: CreateReportDataOptions): PsmReportData {
  const parsedArea = parseArea(inspection.area);
  const findings = inspection.mainFindings.map((finding) => cleanText(finding));
  const isDemo = mode === "demo";
  const terrain = findFinding(
    findings,
    /terrain|topograph|slope|contour/i,
    describeScore(inspection, /terrain|topograph/i, MISSING_EVIDENCE),
  );
  const drainage = findFinding(
    findings,
    /water|drainage|watershed|hydro/i,
    describeScore(inspection, /water|drainage|hydro/i, MISSING_EVIDENCE),
  );
  const vegetation = findFinding(
    findings,
    /vegetation|ecolog|habitat|forest/i,
    describeScore(inspection, /vegetation|ecolog/i, MISSING_EVIDENCE),
  );
  const access = findFinding(
    findings,
    /access|road|entry|connect/i,
    describeScore(inspection, /access/i, MISSING_EVIDENCE),
  );
  const buildability = findFinding(
    findings,
    /build|construction|develop|suitable|terrace|plateau/i,
    describeScore(inspection, /development|build/i, MISSING_EVIDENCE),
  );
  const riskFindings = findings.filter((finding) =>
    /risk|constraint|avoid|flood|erosion|steep|unstable|protect/i.test(finding),
  );
  const mainOpportunity = isDemo
    ? colinaInspectorDetails.find((metric) => metric.label === "Main opportunity")
        ?.value || inspection.recommendedDevelopment
    : findFinding(
        findings,
        /opportunity|plateau|potential|best area|suitable/i,
        inspection.recommendedDevelopment,
      );
  const keyPrinciple = isDemo
    ? colinaInspectorDetails.find((metric) => metric.label === "Key principle")
        ?.value || inspection.narrativeHeadline
    : inspection.narrativeHeadline;
  const landHealthScore = isDemo
    ? Number(
        colinaTerritoryMetrics
          .find((metric) => metric.label === "Land Health Score")
          ?.value.match(/\d+/)?.[0],
      ) || calculateLandHealth(inspection)
    : calculateLandHealth(inspection);
  const developmentRisk = isDemo
    ? colinaTerritoryMetrics.find((metric) => metric.label === "Development Risk")
        ?.value || inferDevelopmentRisk(inspection)
    : inferDevelopmentRisk(inspection);

  return {
    projectName: cleanText(inspection.property, "Unnamed property"),
    location: parsedArea.location,
    area: parsedArea.area,
    generatedDate: new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(generatedAt),
    inspectionMode: isDemo ? "Cached Colina Condesa demo" : "Uploaded inspection",
    uploadedFileName: isDemo
      ? "Cached canonical evidence library"
      : cleanText(uploadedFileName, "Filename unavailable"),
    uploadedFileType: isDemo ? "Canonical cached dataset" : displayFileType(uploadedFileType),
    evidenceSources: isDemo
      ? ["Orthophoto", "Survey", "Digital elevation model", "PSM interpretation overlays"]
      : [
          cleanText(uploadedFileName, "Uploaded property evidence"),
          "Structured AI inspection result",
          "Canonical PSM reference visualization",
        ],
    evidenceNote: isDemo
      ? "This report uses the cached Colina Condesa inspection and the canonical survey, terrain, DEM and interpretation assets included with PSM AI."
      : "The written findings use the current uploaded structured inspection result. Project-specific GIS layers were not generated; the canonical Colina Condesa image is included only as a PSM visualization reference.",
    conclusion: cleanText(inspection.narrativeHeadline),
    summary: cleanText(inspection.narrative.join(" ")),
    landHealthScore,
    opportunityScore: inspection.opportunityScore,
    mainOpportunity: cleanText(mainOpportunity),
    recommendedDensity: isDemo ? "Low" : inferDensity(inspection),
    keyPrinciple: cleanText(keyPrinciple),
    developmentRisk,
    territoryReading: [
      { label: "Terrain", value: terrain },
      { label: "Drainage and watersheds", value: drainage },
      { label: "Vegetation", value: vegetation },
      { label: "Access", value: access },
      { label: "Ecological value", value: vegetation },
      { label: "Buildability", value: buildability },
    ],
    constraints:
      riskFindings.length > 0
        ? riskFindings.slice(0, 3)
        : [
            "No explicit constraint statement was included in the structured result; certified technical studies remain required.",
          ],
    opportunities: isDemo
      ? buildDemoOpportunities()
      : buildUploadedOpportunities(inspection),
    finalRecommendation: cleanText(inspection.recommendedDevelopment),
    recommendationRationale: cleanText(inspection.explanation),
    organizingSystems: inspection.scores.map((score) => cleanText(score.label)),
    developmentApproach: cleanText(
      inspection.narrative.at(-1),
      inspection.explanation,
    ),
    risksToAvoid:
      riskFindings.length > 0
        ? riskFindings.slice(0, 3)
        : [
            "Avoid committing to development before certified survey, engineering and environmental validation.",
          ],
    suggestedStudies: [
      "Certified topographic and boundary survey",
      "Hydrology and stormwater study",
      "Environmental and vegetation assessment",
      "Geotechnical and access engineering",
      "Municipal, legal and financial due diligence",
    ],
    visualizationCaption: isDemo
      ? "Canonical Colina Condesa territory synthesis"
      : "Canonical Colina Condesa PSM reference visualization - not a project-specific GIS output",
  };
}

export function createReportFileName(projectName: string) {
  const safeProjectName = cleanText(projectName, "Territory")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `PSM-Report-${safeProjectName || "Territory"}.pdf`;
}
