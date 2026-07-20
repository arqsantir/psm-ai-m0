"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  colinaCondesaInspection,
  loadingMessages,
  type TerritoryScore,
} from "../inspection-data";

type InspectionPhase =
  | "landing"
  | "loading"
  | "narrative"
  | "dashboard"
  | "opportunity";

const LOADING_STEP_MS = 820;
const LOADING_DURATION_MS = 5000;
const NARRATIVE_REVEAL_MS = 1800;
const DASHBOARD_REVEAL_MS = 2200;

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <main className="experience">
      <section className="hero hero--landing">
        <div className="hero-copy">
          <p className="eyebrow">PSM AI · TERRITORY INSPECTION</p>
          <h1>
            Upload a survey.
            <br />
            Bob will read the territory.
          </h1>
          <p className="lead">
            The land is already speaking. Bob combines terrain, water,
            vegetation, access and development logic into one clear territorial
            reading.
          </p>
          <div className="actions">
            <button type="button" onClick={onStart}>
              Try Colina Condesa
            </button>
            <span>Demo site · 3 hectares</span>
          </div>
        </div>

        <div className="bob-card">
          <Image
            src="/assets/bob.jpg"
            alt="Bob, PSM AI territory inspector"
            fill
            priority
            sizes="(max-width: 850px) 100vw, 42vw"
          />
          <div className="bob-caption">
            <strong>Bob</strong>
            <span>AI territory inspector</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingView({ activeIndex }: { activeIndex: number }) {
  const progress = ((activeIndex + 1) / loadingMessages.length) * 100;

  return (
    <main className="experience">
      <section className="loading-layout">
        <div className="loading-copy">
          <p className="eyebrow">COLINA CONDESA · FIRST INSPECTION</p>
          <h1>Bob is reading the territory.</h1>
          <p className="lead">
            Following the evidence from terrain to opportunity, one system at a
            time.
          </p>

          <div
            className="loading-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="loading-count">
              {String(activeIndex + 1).padStart(2, "0")} / 06
            </span>
            <p className="loading-message" key={loadingMessages[activeIndex]}>
              {loadingMessages[activeIndex]}
            </p>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Territory inspection progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <span style={{ width: `${progress}%` }} />
          </div>

          <ol className="loading-steps" aria-hidden="true">
            {loadingMessages.map((message, index) => {
              const state =
                index < activeIndex
                  ? "is-complete"
                  : index === activeIndex
                    ? "is-active"
                    : "";

              return (
                <li className={state} key={message}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {message}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="bob-card bob-card--loading">
          <Image
            src="/assets/bob.jpg"
            alt="Bob inspecting Colina Condesa"
            fill
            priority
            sizes="(max-width: 850px) 100vw, 42vw"
          />
          <div className="inspection-pulse" aria-hidden="true" />
          <div className="bob-caption">
            <strong>Bob</strong>
            <span>Inspection in progress</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function BobNarrative() {
  const inspection = colinaCondesaInspection;

  return (
    <section className="inspection-narrative reveal-section">
      <div className="narrative-copy">
        <p className="eyebrow">BOB · FIRST TERRITORIAL READING</p>
        <div className="site-meta" aria-label="Property information">
          <span>{inspection.property}</span>
          <span>{inspection.area}</span>
        </div>
        <h1>The ground already knows where development belongs.</h1>
        <div className="bob-narrative">
          {inspection.narrative.map((paragraph, index) => (
            <p className={index === 0 ? "narrative-opening" : ""} key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="bob-card bob-card--narrative">
        <Image
          src="/assets/bob.jpg"
          alt="Bob presenting his Colina Condesa inspection"
          fill
          priority
          sizes="(max-width: 850px) 100vw, 42vw"
        />
        <div className="bob-caption">
          <strong>Bob</strong>
          <span>The territory is speaking</span>
        </div>
      </div>
    </section>
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

function TerritoryDashboard() {
  const inspection = colinaCondesaInspection;

  return (
    <section className="dashboard reveal-section" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">TERRITORY DASHBOARD</p>
          <h2 id="dashboard-title">What the land wants to become</h2>
        </div>
        <div className="dashboard-summary">
          <strong>5</strong>
          <span>systems inspected</span>
        </div>
      </div>

      <div className="grid">
        <div className="visual">
          <Image
            src="/assets/wellness-territory.png"
            alt="Low-impact wellness architecture integrated with the territory"
            fill
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
            <article key={finding}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{finding}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpportunityRecommendation({ onRestart }: { onRestart: () => void }) {
  const inspection = colinaCondesaInspection;

  return (
    <section className="opportunity reveal-section" aria-labelledby="opportunity-title">
      <div className="opportunity-score">
        <strong>{inspection.opportunityScore}</strong>
        <span>Opportunity score</span>
      </div>

      <div className="opportunity-copy">
        <p className="eyebrow">RECOMMENDED DEVELOPMENT</p>
        <h2 id="opportunity-title">{inspection.recommendedDevelopment}</h2>
        <p>{inspection.explanation}</p>
        <div className="confidence">
          <span>Bob&apos;s confidence</span>
          <strong>{inspection.confidence}%</strong>
        </div>
        <button className="text-button" type="button" onClick={onRestart}>
          Run inspection again
        </button>
      </div>
    </section>
  );
}

export default function InspectionExperience() {
  const [phase, setPhase] = useState<InspectionPhase>("landing");
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    if (phase !== "loading") {
      return;
    }

    setLoadingIndex(0);

    const stepTimers = loadingMessages.map((_, index) =>
      window.setTimeout(() => setLoadingIndex(index), index * LOADING_STEP_MS),
    );
    const completionTimer = window.setTimeout(
      () => setPhase("narrative"),
      LOADING_DURATION_MS,
    );

    return () => {
      stepTimers.forEach(window.clearTimeout);
      window.clearTimeout(completionTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "narrative") {
      return;
    }

    const timer = window.setTimeout(
      () => setPhase("dashboard"),
      NARRATIVE_REVEAL_MS,
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "dashboard") {
      return;
    }

    const timer = window.setTimeout(
      () => setPhase("opportunity"),
      DASHBOARD_REVEAL_MS,
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  const startInspection = () => {
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restartInspection = () => {
    setLoadingIndex(0);
    setPhase("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (phase === "landing") {
    return <LandingView onStart={startInspection} />;
  }

  if (phase === "loading") {
    return <LoadingView activeIndex={loadingIndex} />;
  }

  const showDashboard = phase === "dashboard" || phase === "opportunity";
  const showOpportunity = phase === "opportunity";

  return (
    <main className="experience experience--results">
      <BobNarrative />
      {showDashboard ? <TerritoryDashboard /> : null}
      {showOpportunity ? (
        <OpportunityRecommendation onRestart={restartInspection} />
      ) : null}
    </main>
  );
}
