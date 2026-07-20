"use client";

import type { ReactNode } from "react";
import type { BobScenario, TerritoryScene } from "../bob-assets";

const TERRITORY_ROOT = "/assets/demo/colina-condesa";

const territoryAssets: Record<TerritoryScene, string> = {
  survey: `${TERRITORY_ROOT}/survey.png`,
  terrain: `${TERRITORY_ROOT}/terrain.png`,
  drainage: `${TERRITORY_ROOT}/dem.png`,
  vegetation: `${TERRITORY_ROOT}/overlays.png`,
  access: `${TERRITORY_ROOT}/overlays.png`,
  opportunity: `${TERRITORY_ROOT}/overlays.png`,
  synthesis: `${TERRITORY_ROOT}/overlays.png`,
};

type TerritoryVisualProps = {
  scene: TerritoryScene;
  scenario?: BobScenario;
  className?: string;
  alt: string;
  priority?: boolean;
  children?: ReactNode;
};

export default function TerritoryVisual({
  scene,
  scenario,
  className = "",
  alt,
  priority = false,
  children,
}: TerritoryVisualProps) {
  const classes = ["territory-visual", `territory-visual--${scene}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      data-bob-scenario={scenario?.id}
      data-territory-scene={scene}
    >
      <img
        alt={alt}
        className="territory-visual__image"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        src={territoryAssets[scene]}
      />
      <div className="territory-visual__grade" aria-hidden="true" />
      {children}
    </div>
  );
}
