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
  imageLayers?: readonly TerritoryImageLayer[];
  children?: ReactNode;
};

export type TerritoryImageLayer = {
  id: string;
  src: string;
  visible: boolean;
};

export default function TerritoryVisual({
  scene,
  scenario,
  className = "",
  alt,
  priority = false,
  imageLayers,
  children,
}: TerritoryVisualProps) {
  const classes = ["territory-visual", `territory-visual--${scene}`, className]
    .filter(Boolean)
    .join(" ");

  const resolvedLayers =
    imageLayers && imageLayers.length > 0
      ? imageLayers
      : [{ id: scene, src: territoryAssets[scene], visible: true }];

  return (
    <div
      className={classes}
      data-bob-scenario={scenario?.id}
      data-territory-scene={scene}
    >
      {resolvedLayers.map((layer, index) => (
        <img
          alt={index === 0 ? alt : ""}
          aria-hidden={index === 0 ? undefined : true}
          className={`territory-visual__image${
            imageLayers ? " territory-visual__layer" : ""
          }`}
          data-territory-layer={layer.id}
          decoding="async"
          key={layer.id}
          loading={priority ? "eager" : "lazy"}
          src={layer.src}
          style={imageLayers ? { opacity: layer.visible ? 1 : 0 } : undefined}
        />
      ))}
      <div className="territory-visual__grade" aria-hidden="true" />
      {children}
    </div>
  );
}
