import { NextResponse } from "next/server";
import type { TerritoryInspection } from "../../inspection-data";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

const inspectionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "property",
    "area",
    "narrativeHeadline",
    "mainFindings",
    "narrative",
    "scores",
    "opportunityScore",
    "recommendedDevelopment",
    "explanation",
    "confidence",
  ],
  properties: {
    property: { type: "string" },
    area: { type: "string" },
    narrativeHeadline: { type: "string" },
    mainFindings: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: { type: "string" },
    },
    narrative: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    scores: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value", "max"],
        properties: {
          label: {
            type: "string",
            enum: [
              "Drainage",
              "Vegetation",
              "Topography",
              "Accessibility",
              "Development Potential",
            ],
          },
          value: { type: "integer", minimum: 1, maximum: 5 },
          max: { type: "integer", enum: [5] },
        },
      },
    },
    opportunityScore: { type: "integer", minimum: 0, maximum: 100 },
    recommendedDevelopment: { type: "string" },
    explanation: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
  },
} as const;

function getOutputText(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;

  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.length > 0) return text;
    }
  }

  return null;
}

function isTerritoryInspection(value: unknown): value is TerritoryInspection {
  if (!value || typeof value !== "object") return false;
  const inspection = value as Partial<TerritoryInspection>;

  return (
    typeof inspection.property === "string" &&
    typeof inspection.area === "string" &&
    typeof inspection.narrativeHeadline === "string" &&
    Array.isArray(inspection.mainFindings) &&
    Array.isArray(inspection.narrative) &&
    Array.isArray(inspection.scores) &&
    inspection.scores.length === 5 &&
    typeof inspection.opportunityScore === "number" &&
    typeof inspection.recommendedDevelopment === "string" &&
    typeof inspection.explanation === "string" &&
    typeof inspection.confidence === "number"
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("survey");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A survey file is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, JPG, or PNG." },
      { status: 415 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "The survey exceeds the 20 MB limit." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const evidenceInput =
    file.type === "application/pdf"
      ? { type: "input_file", filename: file.name, file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl, detail: "high" };

  const prompt = `You are BOB, an AI Territory Inspector using the PSM methodology. Analyze the uploaded property survey as territorial evidence before architecture begins.

Read only what the evidence supports. Do not invent exact dimensions, contours, vegetation species, legal conditions, flood guarantees, or infrastructure that are not visible or stated. When evidence is incomplete, lower confidence and phrase findings cautiously.

Return a concise inspection that:
- speaks in Bob's calm, observant voice, as if the land is speaking through him;
- identifies terrain, drainage, vegetation, access, and development implications;
- gives exactly five scores using the required labels and a 1–5 scale;
- recommends the best-fit development direction, not a final engineering approval;
- uses \"Unknown property\" or \"Area not established\" when those facts cannot be extracted.`;

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }, evidenceInput],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "psm_territory_inspection",
          strict: true,
          schema: inspectionSchema,
        },
      },
    }),
  });

  const responseBody = (await openAIResponse.json()) as unknown;

  if (!openAIResponse.ok) {
    const message =
      responseBody && typeof responseBody === "object"
        ? (responseBody as { error?: { message?: string } }).error?.message
        : null;

    return NextResponse.json(
      { error: message || "OpenAI could not complete the inspection." },
      { status: openAIResponse.status },
    );
  }

  const outputText = getOutputText(responseBody);
  if (!outputText) {
    return NextResponse.json(
      { error: "Bob returned no structured inspection." },
      { status: 502 },
    );
  }

  try {
    const inspection = JSON.parse(outputText) as unknown;
    if (!isTerritoryInspection(inspection)) throw new Error("Invalid inspection shape");
    return NextResponse.json({ inspection });
  } catch {
    return NextResponse.json(
      { error: "Bob returned an inspection that could not be validated." },
      { status: 502 },
    );
  }
}
