"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type BobScenarioLibrary,
  useBobScenarioLibrary,
} from "../bob-assets";
import {
  colinaCondesaInspection,
  colinaInspectorDetails,
  colinaOpportunities,
  colinaTerritoryMetrics,
  loadingScenes,
  type TerritoryInspection,
  type TerritoryMetric,
  type TerritoryScore,
} from "../inspection-data";
import BobRenderer from "./BobRenderer";
import TerritoryVisual, {
  type TerritoryImageLayer,
} from "./TerritoryVisual";

type InspectionPhase =
  | "landing"
  | "loading"
  | "narrative"
  | "dashboard"
  | "opportunity";

type InspectionMode = "demo" | "upload" | null;

const LOADING_STEP_MS = 3000;
const MIN_LOADING_DURATION_MS = 22000;
const REDUCED_LOADING_STEP_MS = 80;
const REDUCED_LOADING_DURATION_MS = 650;
const UPLOAD_DASHBOARD_REVEAL_MS = 2200;
const SCORE_ANIMATION_DURATION_MS = 1500;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const TERRITORY_ASSET_ROOT = "/assets/demo/colina-condesa";

type TerritoryLayerId =
  | "orthophoto"
  | "survey"
  | "dem"
  | "contours"
  | "drainage"
  | "vegetation"
  | "access"
  | "opportunity";

type TerritoryLayerState = Record<TerritoryLayerId, boolean>;

const territoryLayerDefinitions: readonly {
  id: TerritoryLayerId;
  label: string;
  observation: string;
}[] = [
  {
    id: "orthophoto",
    label: "Orthophoto",
    observation: "The orthophoto shows the territory as it exists today.",
  },
  {
    id: "survey",
    label: "Survey",
    observation: "The survey confirms a gradual slope toward the southeast.",
  },
  {
    id: "dem",
    label: "DEM",
    observation: "The terrain reveals three primary drainage basins.",
  },
  {
    id: "contours",
    label: "Contours",
    observation: "The contours show where the land wants movement to slow down.",
  },
  {
    id: "drainage",
    label: "Drainage",
    observation: "Three natural watersheds organize this property.",
  },
  {
    id: "vegetation",
    label: "Vegetation",
    observation: "The healthiest ecological corridor crosses the northern plateau.",
  },
  {
    id: "access",
    label: "Access",
    observation: "The southeast approach provides the clearest access to the property.",
  },
  {
    id: "opportunity",
    label: "Opportunity",
    observation:
      "This area provides the best balance between access, terrain and ecological value.",
  },
];

const initialTerritoryLayers: TerritoryLayerState = {
  orthophoto: true,
  survey: true,
  dem: true,
  contours: true,
  drainage: true,
  vegetation: true,
  access: true,
  opportunity: true,
};

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 1024 * 1024 ? 1 : 2)} MB`;
}

function useAnimatedNumber(target: number, active: boolean, delay = 0) {
  const [displayedValue, setDisplayedValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplayedValue(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedValue(target);
      return;
    }

    let animationFrame = 0;
    const delayTimer = window.setTimeout(() => {
      const startedAt = window.performance.now();

      const updateValue = (now: number) => {
        const progress = Math.min(
          (now - startedAt) / SCORE_ANIMATION_DURATION_MS,
          1,
        );
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayedValue(Math.round(target * easedProgress));

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(updateValue);
        }
      };

      animationFrame = window.requestAnimationFrame(updateValue);
    }, delay);

    return () => {
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [active, delay, target]);

  return displayedValue;
}

function AnimatedNumber({
  value,
  active,
  delay = 0,
}: {
  value: number;
  active: boolean;
  delay?: number;
}) {
  return <>{useAnimatedNumber(value, active, delay)}</>;
}

function useOnceVisible<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isVisible) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10%", threshold: 0.18 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible]);

  return [elementRef, isVisible] as const;
}

function LandingView({
  selectedFile,
  error,
  scenarios,
  onFileChange,
  onSubmit,
  onDemo,
}: {
  selectedFile: File | null;
  error: string | null;
  scenarios: BobScenarioLibrary;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDemo: () => void;
}) {
  return (
    <main className="experience">
      <section className="hero hero--landing">
        <div className="hero-copy">
          <p className="eyebrow">BOB · AI TERRITORY INSPECTOR</p>
          <h1>
            Upload a survey.
            <br />
            Bob will read the territory.
          </h1>
          <p className="lead">
            The land is already speaking. Bob combines terrain, water,
            vegetation, access and development logic into one clear territorial
            reading using the PSM methodology.
          </p>

          <form className="upload-form" onSubmit={onSubmit}>
            <label className={`upload-field${selectedFile ? " has-file" : ""}`}>
              <input
                accept="application/pdf,image/jpeg,image/png"
                name="survey"
                onChange={onFileChange}
                type="file"
              />
              <span className="upload-field__label">
                {selectedFile ? "Survey ready" : "Upload survey"}
              </span>
              <strong>{selectedFile?.name || "PDF, JPG or PNG"}</strong>
              <small>
                {selectedFile
                  ? `${selectedFile.type.replace("image/", "").toUpperCase()} · ${formatFileSize(selectedFile.size)}`
                  : "One property document · Maximum 20 MB"}
              </small>
            </label>

            {error ? (
              <p className="upload-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="actions">
              <button disabled={!selectedFile} type="submit">
                Inspect uploaded survey
              </button>
              <button className="secondary-action" type="button" onClick={onDemo}>
                Start Inspection
              </button>
            </div>
          </form>
        </div>

        <div className="bob-card bob-card--library">
          <BobRenderer
            alt="Bob, AI Territory Inspector"
            className="bob-renderer--landing"
            priority
            scenario={scenarios.landing}
          />
          <div className="bob-caption">
            <strong>BOB</strong>
            <span>AI Territory Inspector</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingView({
  activeIndex,
  fileName,
  scenarios,
}: {
  activeIndex: number;
  fileName: string;
  scenarios: BobScenarioLibrary;
}) {
  const activeScene = loadingScenes[activeIndex] || loadingScenes[0];
  const scenario = scenarios[activeScene.scenarioId];
  const progress = ((activeIndex + 1) / loadingScenes.length) * 100;

  return (
    <main className="experience experience--loading">
      <section className="territory-loading">
        <header className="territory-loading__header">
          <div>
            <strong>BOB</strong>
            <span>AI Territory Inspector</span>
          </div>
          <p>{fileName}</p>
        </header>

        <TerritoryVisual
          alt={`${activeScene.backgroundLabel} for the active territory inspection`}
          className="territory-loading__visual"
          key={activeScene.scenarioId}
          priority
          scenario={scenario}
          scene={activeScene.scene}
        >
          <div className="territory-loading__readout">
            <p className="dark-eyebrow">LIVE TERRITORY INSPECTION</p>
            <span className="territory-loading__count">
              {String(activeIndex + 1).padStart(2, "0")} / {String(loadingScenes.length).padStart(2, "0")}
            </span>
            <h1 key={activeScene.message}>{activeScene.message}</h1>
            <div className="territory-loading__source">
              <span>{activeScene.backgroundLabel}</span>
              <strong>Bob · {scenario.label || activeScene.bobAction}</strong>
            </div>
          </div>

          <div className="territory-loading__bob">
            <BobRenderer
              alt={`Bob ${activeScene.bobAction.toLowerCase()} while inspecting the territory`}
              className="bob-renderer--territory-overlay"
              priority
              scenario={scenario}
            />
          </div>

          <div className="territory-loading__progress">
            <div className="loading-progress-meta" aria-hidden="true">
              <span>Territory understanding</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div
              className="progress-track progress-track--inspection"
              role="progressbar"
              aria-label="Territory inspection progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ol className="territory-loading__steps" aria-hidden="true">
            {loadingScenes.map((scene, index) => {
              const state =
                index < activeIndex
                  ? "is-complete"
                  : index === activeIndex
                    ? "is-active"
                    : "";

              return (
                <li className={state} key={scene.scenarioId}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {scene.message}
                </li>
              );
            })}
          </ol>
        </TerritoryVisual>
      </section>
    </main>
  );
}

function BobNarrative({
  inspection,
  scenarios,
  onContinue,
}: {
  inspection: TerritoryInspection;
  scenarios: BobScenarioLibrary;
  onContinue: () => void;
}) {
  return (
    <main className="experience experience--results">
      <section className="inspection-narrative reveal-section">
        <div className="narrative-copy">
          <p className="eyebrow">BOB · AI TERRITORY INSPECTOR</p>
          <div className="site-meta" aria-label="Property information">
            <span>{inspection.property}</span>
            <span>{inspection.area}</span>
          </div>
          <h1>{inspection.narrativeHeadline}</h1>
          <div className="bob-narrative">
            {inspection.narrative.map((paragraph, index) => (
              <p
                className={index === 0 ? "narrative-opening" : ""}
                key={`${index}-${paragraph}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <button className="narrative-action" type="button" onClick={onContinue}>
            See territory intelligence
          </button>
        </div>

        <div className="bob-card bob-card--narrative bob-card--library">
          <BobRenderer
            alt="Bob presenting his territory inspection"
            className="bob-renderer--narrative"
            priority
            scenario={scenarios.narrative}
          />
          <div className="bob-caption">
            <strong>BOB</strong>
            <span>The territory is speaking</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreRow({ score }: { score: TerritoryScore }) {
  const percentage = (score.value / score.max) * 100;

  return (
    <article className="score-row">
      <div className="score-row__header">
        <span>{score.label}</span>
        <strong>
          {score.value}/{score.max}
        </strong>
      </div>
      <div className="score-track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </article>
  );
}

function UploadedTerritoryDashboard({
  inspection,
  previewUrl,
}: {
  inspection: TerritoryInspection;
  previewUrl: string | null;
}) {
  return (
    <section className="dashboard reveal-section" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">BOB · TERRITORY DASHBOARD</p>
          <h2 id="dashboard-title">What the land wants to become</h2>
        </div>
        <div className="dashboard-summary">
          <strong>{inspection.scores.length}</strong>
          <span>systems inspected</span>
        </div>
      </div>

      <div className="grid">
        <div className="visual">
          <Image
            src={previewUrl || "/assets/demo/colina-condesa/overlays.png"}
            alt={
              previewUrl
                ? "Uploaded territory survey"
                : "Low-impact architecture integrated with territory"
            }
            fill
            unoptimized={Boolean(previewUrl)}
            sizes="(max-width: 850px) 100vw, 60vw"
          />
        </div>
        <div className="score-list">
          {inspection.scores.map((score) => (
            <ScoreRow key={score.label} score={score} />
          ))}
        </div>
      </div>

      <div className="findings-block">
        <p className="eyebrow">MAIN FINDINGS</p>
        <div className="findings-grid">
          {inspection.mainFindings.map((finding, index) => (
            <article key={`${index}-${finding}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{finding}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UploadedOpportunityRecommendation({
  inspection,
  onRestart,
}: {
  inspection: TerritoryInspection;
  onRestart: () => void;
}) {
  return (
    <section className="opportunity reveal-section" aria-labelledby="opportunity-title">
      <div className="opportunity-score">
        <strong>
          <AnimatedNumber active value={inspection.opportunityScore} />
        </strong>
        <span>Opportunity score</span>
      </div>

      <div className="opportunity-copy">
        <p className="eyebrow">RECOMMENDED DEVELOPMENT</p>
        <h2 id="opportunity-title">{inspection.recommendedDevelopment}</h2>
        <p>{inspection.explanation}</p>
        <div className="confidence">
          <span>Bob&apos;s confidence</span>
          <strong>
            <AnimatedNumber active value={inspection.confidence} />%
          </strong>
        </div>
        <button className="text-button" type="button" onClick={onRestart}>
          Inspect another survey
        </button>
      </div>
    </section>
  );
}

function MetricList({ metrics }: { metrics: TerritoryMetric[] }) {
  return (
    <dl className="intelligence-metrics">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DashboardTerritoryHero({ scenarios }: { scenarios: BobScenarioLibrary }) {
  const [visibleLayers, setVisibleLayers] = useState<TerritoryLayerState>(
    initialTerritoryLayers,
  );
  const [observedLayer, setObservedLayer] =
    useState<TerritoryLayerId>("opportunity");

  const imageLayers = useMemo<readonly TerritoryImageLayer[]>(
    () => [
      {
        id: "orthophoto",
        src: `${TERRITORY_ASSET_ROOT}/terrain.png`,
        visible: visibleLayers.orthophoto,
      },
      {
        id: "survey",
        src: `${TERRITORY_ASSET_ROOT}/survey.png`,
        visible: visibleLayers.survey,
      },
      {
        id: "dem",
        src: `${TERRITORY_ASSET_ROOT}/dem.png`,
        visible: visibleLayers.dem,
      },
      {
        id: "opportunity",
        src: `${TERRITORY_ASSET_ROOT}/overlays.png`,
        visible: visibleLayers.opportunity,
      },
    ],
    [
      visibleLayers.dem,
      visibleLayers.opportunity,
      visibleLayers.orthophoto,
      visibleLayers.survey,
    ],
  );

  const activeObservation =
    territoryLayerDefinitions.find((layer) => layer.id === observedLayer)
      ?.observation || territoryLayerDefinitions[0].observation;

  const toggleLayer = useCallback((layerId: TerritoryLayerId) => {
    setVisibleLayers((currentLayers) => ({
      ...currentLayers,
      [layerId]: !currentLayers[layerId],
    }));
    setObservedLayer(layerId);
  }, []);

  const layerClassName = (layerId: TerritoryLayerId) =>
    visibleLayers[layerId] ? "" : " is-layer-hidden";

  return (
    <section className="territory-overview territory-overview--alive" aria-label="Colina Condesa territory overview">
      <TerritoryVisual
        alt="Colina Condesa territory synthesis with inspection overlays"
        className="territory-map territory-map--alive"
        imageLayers={imageLayers}
        priority
        scenario={scenarios.dashboard}
        scene="synthesis"
      >
        <fieldset className="territory-layer-controls">
          <legend>TERRITORY LAYERS</legend>
          <div className="territory-layer-controls__grid">
            {territoryLayerDefinitions.map((layer) => (
              <label key={layer.id}>
                <input
                  checked={visibleLayers[layer.id]}
                  onChange={() => toggleLayer(layer.id)}
                  type="checkbox"
                />
                <span>{layer.label}</span>
              </label>
            ))}
          </div>
          <p
            aria-live="polite"
            className="territory-layer-observation"
            key={observedLayer}
          >
            <strong>BOB OBSERVES</strong>
            <span>{activeObservation}</span>
          </p>
        </fieldset>

        <div
          aria-hidden={!visibleLayers.drainage}
          className={`map-marker map-marker--watersheds${layerClassName("drainage")}`}
        >
          <span>01</span>
          <strong>Three watersheds</strong>
        </div>
        <div
          aria-hidden={!visibleLayers.contours}
          className={`map-marker map-marker--plateau${layerClassName("contours")}`}
        >
          <span>02</span>
          <strong>Northern plateau</strong>
        </div>
        <div
          aria-hidden={!visibleLayers.access}
          className={`map-marker map-marker--access${layerClassName("access")}`}
        >
          <span>03</span>
          <strong>Main access</strong>
        </div>
        <div
          aria-hidden={!visibleLayers.vegetation}
          className={`map-marker map-marker--corridor${layerClassName("vegetation")}`}
        >
          <span>04</span>
          <strong>Vegetation corridor</strong>
        </div>
        <div
          aria-hidden={!visibleLayers.opportunity}
          className={`map-marker map-marker--opportunity${layerClassName("opportunity")}`}
        >
          <span>05</span>
          <strong>Opportunity area</strong>
        </div>
        <div
          aria-hidden={!visibleLayers.survey}
          className={`map-legend${layerClassName("survey")}`}
        >
          <span>Territory reading</span>
          <strong>Water · Contour · Vegetation · Access</strong>
        </div>
        <div className="dashboard-bob-overlay">
          <BobRenderer
            alt="Bob walking through the territory map"
            className="bob-renderer--map"
            priority
            scenario={scenarios.dashboard}
          />
          <span>BOB · FIELD POSITION</span>
        </div>
      </TerritoryVisual>

      <aside className="territory-summary">
        <p className="dark-eyebrow">TERRITORY SUMMARY</p>
        <MetricList metrics={colinaTerritoryMetrics} />
      </aside>
    </section>
  );
}

function ColinaTerritoryDashboard({
  scenarios,
  onRestart,
}: {
  scenarios: BobScenarioLibrary;
  onRestart: () => void;
}) {
  const [opportunityRef, opportunityVisible] = useOnceVisible<HTMLElement>();

  return (
    <main className="dark-dashboard reveal-section">
      <header className="dark-dashboard__header">
        <div className="dark-brand">
          <strong>BOB</strong>
          <span>COLINA CONDESA · MAZATLÁN · 3 HA</span>
        </div>
        <div className="inspection-complete">
          <span aria-hidden="true" />
          Inspection complete
        </div>
      </header>

      <section className="dark-dashboard__intro">
        <div>
          <p className="dark-eyebrow">AI TERRITORY INSPECTOR · PSM METHODOLOGY</p>
          <h1>The land reveals a low-impact development structure.</h1>
        </div>
        <p>
          Three watersheds organize the site. The northern plateau offers the
          strongest balance between access, buildability and ecological value.
        </p>
      </section>

      <DashboardTerritoryHero scenarios={scenarios} />

      <section className="bob-inspector-panel">
        <div className="bob-inspector-panel__heading">
          <div className="bob-inspector-avatar bob-inspector-avatar--library">
            <BobRenderer
              alt="Bob considering the territory intelligence"
              compact
              scenario={scenarios["inspector-panel"]}
            />
          </div>
          <div>
            <p className="dark-eyebrow">BOB · AI TERRITORY INSPECTOR</p>
            <h2>Build with the contours.</h2>
          </div>
        </div>
        <MetricList metrics={colinaInspectorDetails} />
      </section>

      <section
        className="dark-opportunity"
        id="opportunity-score"
        ref={opportunityRef}
      >
        <div className="dark-opportunity__heading">
          <div>
            <p className="dark-eyebrow">OPPORTUNITY SCORE</p>
            <h2>What the territory can support</h2>
          </div>
          <span>BOB&apos;S RECOMMENDATION</span>
        </div>

        <div className="opportunity-ranking">
          {colinaOpportunities.map((option, index) => (
            <article
              className={option.recommended ? "is-recommended" : ""}
              key={option.label}
            >
              <span className="opportunity-ranking__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="opportunity-ranking__label">
                <strong>{option.label}</strong>
                {option.recommended ? <small>Recommended</small> : null}
              </div>
              <div className="opportunity-ranking__track" aria-hidden="true">
                <span
                  style={{
                    transitionDelay: opportunityVisible
                      ? `${index * 90}ms`
                      : "0ms",
                    width: opportunityVisible ? `${option.score}%` : "0%",
                  }}
                />
              </div>
              <strong className="opportunity-ranking__score">
                <AnimatedNumber
                  active={opportunityVisible}
                  delay={index * 90}
                  value={option.score}
                />
              </strong>
            </article>
          ))}
        </div>

        <blockquote>
          “The northern plateau provides the best balance between access,
          buildability and ecological preservation. A low-density eco-residential
          community can use the three drainage systems as organizing infrastructure
          while retaining the territory’s strongest vegetation corridors.”
        </blockquote>
      </section>

      <footer className="dark-dashboard__footer">
        <p>Evidence → Intelligence → Decisions</p>
        <button type="button" onClick={onRestart}>
          Run inspection again
        </button>
      </footer>
    </main>
  );
}

export default function InspectionExperience() {
  const scenarios = useBobScenarioLibrary();
  const [phase, setPhase] = useState<InspectionPhase>("landing");
  const [mode, setMode] = useState<InspectionMode>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<TerritoryInspection>(
    colinaCondesaInspection,
  );
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const loadingStartedAt = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;

    setLoadingIndex(0);
    const stepDuration = reducedMotion
      ? REDUCED_LOADING_STEP_MS
      : LOADING_STEP_MS;
    const stepTimers = loadingScenes.slice(1).map((_, index) =>
      window.setTimeout(
        () => setLoadingIndex(index + 1),
        (index + 1) * stepDuration,
      ),
    );

    return () => stepTimers.forEach(window.clearTimeout);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "dashboard" || mode !== "upload") return;
    const timer = window.setTimeout(
      () => setPhase("opportunity"),
      reducedMotion ? 100 : UPLOAD_DASHBOARD_REVEAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [mode, phase, reducedMotion]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const beginLoading = (nextMode: Exclude<InspectionMode, null>) => {
    loadingStartedAt.current = Date.now();
    setMode(nextMode);
    setLoadingIndex(0);
    setError(null);
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const revealInspection = async (nextInspection: TerritoryInspection) => {
    const minimumDuration = reducedMotion
      ? REDUCED_LOADING_DURATION_MS
      : MIN_LOADING_DURATION_MS;
    const elapsed = Date.now() - loadingStartedAt.current;

    if (elapsed < minimumDuration) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, minimumDuration - elapsed),
      );
    }

    setInspection(nextInspection);
    setPhase("narrative");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setError("Upload a PDF, JPG, or PNG survey.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("The survey must be 20 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const inspectUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(
      selectedFile.type.startsWith("image/")
        ? URL.createObjectURL(selectedFile)
        : null,
    );
    beginLoading("upload");

    try {
      const formData = new FormData();
      formData.append("survey", selectedFile);
      const response = await fetch("/api/inspect", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        inspection?: TerritoryInspection;
        error?: string;
      };

      if (!response.ok || !body.inspection) {
        throw new Error(body.error || "Bob could not inspect this survey.");
      }

      await revealInspection(body.inspection);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Bob could not inspect this survey.",
      );
      setMode(null);
      setPhase("landing");
    }
  };

  const runDemo = async () => {
    setSelectedFile(null);
    setError(null);
    setInspection(colinaCondesaInspection);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    beginLoading("demo");
    await revealInspection(colinaCondesaInspection);
  };

  const continueToIntelligence = () => {
    setPhase("dashboard");
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const restartInspection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setLoadingIndex(0);
    setSelectedFile(null);
    setInspection(colinaCondesaInspection);
    setPreviewUrl(null);
    setError(null);
    setMode(null);
    setPhase("landing");
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  if (phase === "landing") {
    return (
      <LandingView
        selectedFile={selectedFile}
        error={error}
        scenarios={scenarios}
        onFileChange={handleFileChange}
        onSubmit={inspectUpload}
        onDemo={runDemo}
      />
    );
  }

  if (phase === "loading") {
    return (
      <LoadingView
        activeIndex={loadingIndex}
        fileName={
          mode === "demo"
            ? "COLINA CONDESA · MAZATLÁN · 3 HA"
            : selectedFile?.name || "UPLOADED SURVEY"
        }
        scenarios={scenarios}
      />
    );
  }

  if (phase === "narrative") {
    return (
      <BobNarrative
        inspection={inspection}
        scenarios={scenarios}
        onContinue={continueToIntelligence}
      />
    );
  }

  if (mode === "demo") {
    return (
      <ColinaTerritoryDashboard
        scenarios={scenarios}
        onRestart={restartInspection}
      />
    );
  }

  const showUploadOpportunity = phase === "opportunity";

  return (
    <main className="experience experience--results">
      <UploadedTerritoryDashboard
        inspection={inspection}
        previewUrl={previewUrl}
      />
      {showUploadOpportunity ? (
        <UploadedOpportunityRecommendation
          inspection={inspection}
          onRestart={restartInspection}
        />
      ) : null}
    </main>
  );
}
