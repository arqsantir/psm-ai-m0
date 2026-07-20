"use client";

import type { BobScenario } from "../bob-assets";

type BobRendererProps = {
  scenario: BobScenario;
  alt: string;
  className?: string;
  priority?: boolean;
  compact?: boolean;
};

function isVideoSource(source: string) {
  return source.endsWith(".mp4");
}

export default function BobRenderer({
  scenario,
  alt,
  className = "",
  priority = false,
  compact = false,
}: BobRendererProps) {
  const classes = [
    "bob-renderer",
    `bob-renderer--${scenario.motion}`,
    compact ? "bob-renderer--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-bob-scenario={scenario.id}>
      {isVideoSource(scenario.src) ? (
        <video
          aria-label={alt}
          autoPlay
          loop
          muted
          playsInline
          poster={scenario.poster}
          preload={priority ? "auto" : "metadata"}
          src={scenario.src}
        />
      ) : (
        <img
          alt={alt}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          src={scenario.src}
        />
      )}
      <span className="bob-renderer__breath" aria-hidden="true" />
    </div>
  );
}
