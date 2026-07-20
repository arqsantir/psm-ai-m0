import { useEffect, useMemo, useState } from "react";

export type BobMotion =
  | "idle"
  | "observe"
  | "walk"
  | "sniff"
  | "look-around"
  | "thinking"
  | "tail-wag";

export type TerritoryScene =
  | "survey"
  | "terrain"
  | "drainage"
  | "vegetation"
  | "access"
  | "opportunity"
  | "synthesis";

export type BobScenario = {
  id: string;
  motion: BobMotion;
  src: string;
  poster?: string;
  label?: string;
};

export type BobScenarioLibrary = Record<string, BobScenario>;

const BOB_ROOT = "/assets/bob";

const bobAnimations = {
  look_around: `${BOB_ROOT}/animations/look_around.mp4`,
  sit: `${BOB_ROOT}/animations/sit.mp4`,
  sniff: `${BOB_ROOT}/animations/sniff.mp4`,
  tail_wag: `${BOB_ROOT}/animations/tail_wag.mp4`,
  walk: `${BOB_ROOT}/animations/walk.mp4`,
} as const;

const bobExpressions = {
  Bob_sniff: `${BOB_ROOT}/expressions/Bob_sniff.png`,
  curious: `${BOB_ROOT}/expressions/curious.png`,
  happy: `${BOB_ROOT}/expressions/happy.png`,
  neutral: `${BOB_ROOT}/expressions/neutral.png`,
  sniff: `${BOB_ROOT}/expressions/sniff.png`,
  thinking: `${BOB_ROOT}/expressions/thinking.png`,
} as const;

type BobAnimationName = keyof typeof bobAnimations;
type BobExpressionName = keyof typeof bobExpressions;

const animationMotions: Record<BobAnimationName, BobMotion> = {
  look_around: "look-around",
  sit: "observe",
  sniff: "sniff",
  tail_wag: "tail-wag",
  walk: "walk",
};

const expressionMotions: Record<BobExpressionName, BobMotion> = {
  Bob_sniff: "sniff",
  curious: "idle",
  happy: "tail-wag",
  neutral: "idle",
  sniff: "sniff",
  thinking: "thinking",
};

function createScenario(
  id: string,
  motion: BobMotion,
  src: string,
  poster: string | undefined,
  label: string,
): BobScenario {
  return { id, motion, src, poster, label };
}

export const defaultBobScenarios: BobScenarioLibrary = {
  landing: createScenario(
    "landing",
    "observe",
    bobAnimations.sit,
    bobExpressions.neutral,
    "Ready to inspect",
  ),
  "loading-survey": createScenario(
    "loading-survey",
    "observe",
    bobAnimations.sit,
    bobExpressions.neutral,
    "Sit · Observe",
  ),
  "loading-terrain": createScenario(
    "loading-terrain",
    "walk",
    bobAnimations.walk,
    bobExpressions.curious,
    "Walk",
  ),
  "loading-drainage": createScenario(
    "loading-drainage",
    "sniff",
    bobAnimations.sniff,
    bobExpressions.Bob_sniff,
    "Sniff",
  ),
  "loading-vegetation": createScenario(
    "loading-vegetation",
    "look-around",
    bobAnimations.look_around,
    bobExpressions.curious,
    "Look around",
  ),
  "loading-access": createScenario(
    "loading-access",
    "walk",
    bobAnimations.walk,
    bobExpressions.curious,
    "Walk",
  ),
  "loading-opportunity": createScenario(
    "loading-opportunity",
    "thinking",
    bobExpressions.thinking,
    undefined,
    "Thinking",
  ),
  "loading-complete": createScenario(
    "loading-complete",
    "tail-wag",
    bobAnimations.tail_wag,
    bobExpressions.happy,
    "Tail wag",
  ),
  narrative: createScenario(
    "narrative",
    "observe",
    bobAnimations.sit,
    bobExpressions.thinking,
    "Territory reading complete",
  ),
  dashboard: createScenario(
    "dashboard",
    "tail-wag",
    bobAnimations.tail_wag,
    bobExpressions.happy,
    "Inspecting the map",
  ),
  "inspector-panel": createScenario(
    "inspector-panel",
    "thinking",
    bobExpressions.thinking,
    undefined,
    "Bob's conclusion",
  ),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAnimationName(value: unknown): value is BobAnimationName {
  return typeof value === "string" && value in bobAnimations;
}

function isExpressionName(value: unknown): value is BobExpressionName {
  return typeof value === "string" && value in bobExpressions;
}

function mapConfiguredScenario(id: string, value: unknown): BobScenario | null {
  if (!isRecord(value)) return null;

  const animationName = isAnimationName(value.animation)
    ? value.animation
    : undefined;
  const expressionName = isExpressionName(value.expression)
    ? value.expression
    : undefined;
  const src = animationName
    ? bobAnimations[animationName]
    : expressionName
      ? bobExpressions[expressionName]
      : undefined;

  if (!src) return null;

  const defaultScenario = defaultBobScenarios[id];
  const motion = animationName
    ? animationMotions[animationName]
    : expressionMotions[expressionName as BobExpressionName];

  return {
    id,
    motion,
    src,
    poster:
      animationName && expressionName
        ? bobExpressions[expressionName]
        : undefined,
    label: defaultScenario?.label,
  };
}

export function normalizeScenarioLibrary(raw: unknown): BobScenarioLibrary {
  if (!isRecord(raw)) return defaultBobScenarios;

  const configured = isRecord(raw.scenarios) ? raw.scenarios : raw;
  const normalized: BobScenarioLibrary = {};

  for (const [id, value] of Object.entries(configured)) {
    const scenario = mapConfiguredScenario(id, value);
    if (scenario) normalized[id] = scenario;
  }

  return { ...defaultBobScenarios, ...normalized };
}

export function useBobScenarioLibrary() {
  const [configuredScenarios, setConfiguredScenarios] =
    useState<BobScenarioLibrary>({});

  useEffect(() => {
    let active = true;

    fetch(`${BOB_ROOT}/scenarios.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Bob scenario library unavailable");
        return response.json() as Promise<unknown>;
      })
      .then((raw) => {
        if (active) setConfiguredScenarios(normalizeScenarioLibrary(raw));
      })
      .catch(() => {
        if (active) setConfiguredScenarios({});
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(
    () => ({ ...defaultBobScenarios, ...configuredScenarios }),
    [configuredScenarios],
  );
}
