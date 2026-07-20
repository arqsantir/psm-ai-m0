import { createReportFileName, type PsmReportData } from "./report-data";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 86;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;

const COLORS = {
  background: "#08110f",
  surface: "#101b17",
  surfaceLight: "#18241f",
  ink: "#f2eadc",
  muted: "#a9b1a7",
  green: "#79a67c",
  greenBright: "#a9c6a8",
  line: "#34443a",
  clay: "#c8845d",
};

const TERRITORY_COVER = "/assets/demo/colina-condesa/terrain.png";
const TERRITORY_SYNTHESIS = "/assets/demo/colina-condesa/overlays.png";
const BOB_REPORT_IMAGE = "/assets/bob/expressions/thinking.png";

type ReportAssets = {
  coverTerritory: HTMLImageElement;
  synthesis: HTMLImageElement;
  bob: HTMLImageElement;
};

type TextOptions = {
  color?: string;
  family?: "sans" | "serif";
  lineHeight?: number;
  maxLines?: number;
  size?: number;
  weight?: number;
};

type PdfResult = {
  blob: Blob;
  fileName: string;
};

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF canvas is unavailable in this browser.");
  context.textBaseline = "top";
  return { canvas, context };
}

function font(
  context: CanvasRenderingContext2D,
  size: number,
  weight = 400,
  family: "sans" | "serif" = "sans",
) {
  const fontFamily = family === "serif" ? "Georgia, serif" : "Arial, sans-serif";
  context.font = `${weight} ${size}px ${fontFamily}`;
}

function fitLine(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  if (context.measureText(value).width <= maxWidth) return value;

  let shortened = value;
  while (shortened.length > 1 && context.measureText(`${shortened}...`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened.trimEnd()}...`;
}

function wrapLines(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines = Number.POSITIVE_INFINITY,
) {
  const paragraphs = value.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) break;
    }

    if (lines.length < maxLines && currentLine) lines.push(currentLine);
    if (lines.length === maxLines) break;
  }

  if (lines.length === maxLines) {
    const consumed = lines.join(" ").length;
    if (consumed < value.replace(/\s+/g, " ").trim().length) {
      lines[lines.length - 1] = fitLine(context, `${lines.at(-1)}...`, maxWidth);
    }
  }

  return lines;
}

function drawText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  options: TextOptions = {},
) {
  const size = options.size ?? 26;
  const lineHeight = options.lineHeight ?? Math.round(size * 1.42);
  font(context, size, options.weight ?? 400, options.family ?? "sans");
  context.fillStyle = options.color ?? COLORS.ink;
  const lines = wrapLines(context, value, maxWidth, options.maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawLabel(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
) {
  font(context, 17, 700);
  context.fillStyle = COLORS.greenBright;
  context.fillText(value.toUpperCase(), x, y);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 16,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = COLORS.surface,
) {
  roundedRect(context, x, y, width, height, 15);
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = COLORS.line;
  context.lineWidth = 2;
  context.stroke();
}

function drawPageBase(
  context: CanvasRenderingContext2D,
  pageNumber: number,
  section: string,
) {
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  drawLabel(context, "PSM AI", PAGE_MARGIN, 50);
  font(context, 16, 600);
  context.fillStyle = COLORS.muted;
  context.textAlign = "right";
  context.fillText(section.toUpperCase(), PAGE_WIDTH - PAGE_MARGIN, 51);
  context.textAlign = "left";

  context.strokeStyle = COLORS.line;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(PAGE_MARGIN, 88);
  context.lineTo(PAGE_WIDTH - PAGE_MARGIN, 88);
  context.stroke();

  context.beginPath();
  context.moveTo(PAGE_MARGIN, PAGE_HEIGHT - 74);
  context.lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 74);
  context.stroke();

  font(context, 15, 500);
  context.fillStyle = COLORS.muted;
  context.fillText("BOB - AI Territory Inspector", PAGE_MARGIN, PAGE_HEIGHT - 50);
  context.textAlign = "right";
  context.fillText(`${String(pageNumber).padStart(2, "0")} / 08`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 50);
  context.textAlign = "left";
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Required report asset is unavailable: ${source}`));
    image.src = source;
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const targetWidth = image.naturalWidth * scale;
  const targetHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    x + (width - targetWidth) / 2,
    y + (height - targetHeight) / 2,
    targetWidth,
    targetHeight,
  );
}

function drawHeading(
  context: CanvasRenderingContext2D,
  eyebrow: string,
  heading: string,
) {
  drawLabel(context, eyebrow, PAGE_MARGIN, 132);
  return drawText(context, heading, PAGE_MARGIN, 174, PAGE_WIDTH - PAGE_MARGIN * 2, {
    family: "serif",
    lineHeight: 70,
    maxLines: 3,
    size: 62,
    weight: 500,
  });
}

function drawList(
  context: CanvasRenderingContext2D,
  values: string[],
  x: number,
  y: number,
  width: number,
  maxItems = values.length,
) {
  let currentY = y;
  values.slice(0, maxItems).forEach((value) => {
    context.fillStyle = COLORS.green;
    context.beginPath();
    context.arc(x + 7, currentY + 13, 6, 0, Math.PI * 2);
    context.fill();
    currentY = drawText(context, value, x + 28, currentY, width - 28, {
      color: COLORS.ink,
      lineHeight: 30,
      maxLines: 3,
      size: 21,
    }) + 15;
  });
  return currentY;
}

function drawMetric(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawPanel(context, x, y, width, height);
  drawLabel(context, label, x + 24, y + 22);
  drawText(context, value, x + 24, y + 58, width - 48, {
    family: "serif",
    lineHeight: 38,
    maxLines: 3,
    size: 31,
    weight: 500,
  });
}

function drawCoverPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
  assets: ReportAssets,
) {
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  drawLabel(context, "PSM AI", PAGE_MARGIN, 72);
  drawText(context, "BOB - AI Territory Inspector", PAGE_MARGIN, 112, 700, {
    color: COLORS.muted,
    size: 21,
    weight: 600,
  });
  drawText(context, "PSM REPORT", PAGE_MARGIN, 210, 900, {
    family: "serif",
    lineHeight: 86,
    size: 80,
    weight: 500,
  });
  const projectY = drawText(context, data.projectName, PAGE_MARGIN, 325, 900, {
    family: "serif",
    lineHeight: 62,
    maxLines: 2,
    size: 54,
    weight: 500,
  });
  drawText(context, `${data.location} - ${data.area}`, PAGE_MARGIN, projectY + 16, 900, {
    color: COLORS.muted,
    maxLines: 2,
    size: 23,
  });

  const imageX = PAGE_MARGIN;
  const imageY = 540;
  const imageWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const imageHeight = 785;
  roundedRect(context, imageX, imageY, imageWidth, imageHeight, 18);
  context.save();
  context.clip();
  drawImageCover(context, assets.coverTerritory, imageX, imageY, imageWidth, imageHeight);
  const gradient = context.createLinearGradient(imageX, imageY, imageX, imageY + imageHeight);
  gradient.addColorStop(0, "rgba(8,17,15,0.08)");
  gradient.addColorStop(1, "rgba(8,17,15,0.82)");
  context.fillStyle = gradient;
  context.fillRect(imageX, imageY, imageWidth, imageHeight);
  context.restore();

  drawPanel(context, 760, 825, 350, 390, "#151a17");
  roundedRect(context, 770, 835, 330, 325, 12);
  context.save();
  context.clip();
  drawImageCover(context, assets.bob, 770, 835, 330, 325);
  context.restore();
  drawLabel(context, "BOB", 790, 1175);

  drawText(context, "Evidence -> Intelligence -> Decisions", PAGE_MARGIN, 1390, 900, {
    color: COLORS.greenBright,
    family: "serif",
    lineHeight: 45,
    size: 35,
    weight: 500,
  });
  drawText(context, `Generated ${data.generatedDate}`, PAGE_MARGIN, 1480, 600, {
    color: COLORS.muted,
    size: 19,
  });
  drawText(context, "Place Systems Method", PAGE_MARGIN, 1595, 600, {
    color: COLORS.muted,
    size: 17,
    weight: 600,
  });
}

function drawExecutiveSummaryPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
) {
  drawPageBase(context, 2, "Executive Summary");
  const headingBottom = drawHeading(context, "Bob's territory conclusion", data.conclusion);
  const summaryBottom = drawText(
    context,
    data.summary,
    PAGE_MARGIN,
    headingBottom + 28,
    PAGE_WIDTH - PAGE_MARGIN * 2,
    { color: COLORS.muted, lineHeight: 35, maxLines: 7, size: 24 },
  );

  const cardY = Math.max(summaryBottom + 50, 640);
  const gap = 22;
  const cardWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap) / 2;
  drawMetric(context, "Land Health Score", `${data.landHealthScore} / 100`, PAGE_MARGIN, cardY, cardWidth, 150);
  drawMetric(context, "Main opportunity", data.mainOpportunity, PAGE_MARGIN + cardWidth + gap, cardY, cardWidth, 150);
  drawMetric(context, "Recommended density", data.recommendedDensity, PAGE_MARGIN, cardY + 172, cardWidth, 150);
  drawMetric(context, "Development risk", data.developmentRisk, PAGE_MARGIN + cardWidth + gap, cardY + 172, cardWidth, 150);
  drawMetric(context, "Key development principle", data.keyPrinciple, PAGE_MARGIN, cardY + 344, cardWidth * 2 + gap, 180);
}

function drawPropertyEvidencePage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
) {
  drawPageBase(context, 3, "Property and Evidence");
  drawHeading(context, "Inspection record", "Property and evidence");
  const rows = [
    ["Property", data.projectName],
    ["Location", data.location],
    ["Area", data.area],
    ["Inspection mode", data.inspectionMode],
    ["Uploaded filename", data.uploadedFileName],
    ["File type", data.uploadedFileType],
  ];
  let rowY = 350;
  rows.forEach(([label, value]) => {
    context.strokeStyle = COLORS.line;
    context.beginPath();
    context.moveTo(PAGE_MARGIN, rowY + 86);
    context.lineTo(PAGE_WIDTH - PAGE_MARGIN, rowY + 86);
    context.stroke();
    drawLabel(context, label, PAGE_MARGIN, rowY + 9);
    drawText(context, value, 420, rowY, PAGE_WIDTH - PAGE_MARGIN - 420, {
      family: "serif",
      lineHeight: 34,
      maxLines: 2,
      size: 27,
      weight: 500,
    });
    rowY += 96;
  });

  drawPanel(context, PAGE_MARGIN, 980, PAGE_WIDTH - PAGE_MARGIN * 2, 250);
  drawLabel(context, "Evidence sources", PAGE_MARGIN + 28, 1010);
  drawList(context, data.evidenceSources, PAGE_MARGIN + 28, 1052, PAGE_WIDTH - PAGE_MARGIN * 2 - 56, 4);

  drawLabel(context, "Evidence availability note", PAGE_MARGIN, 1285);
  drawText(context, data.evidenceNote, PAGE_MARGIN, 1330, PAGE_WIDTH - PAGE_MARGIN * 2, {
    color: COLORS.muted,
    lineHeight: 34,
    maxLines: 7,
    size: 23,
  });
}

function drawTerritoryReadingPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
) {
  drawPageBase(context, 4, "Territory Reading");
  drawHeading(context, "Evidence interpreted", "Territory reading");
  const gap = 22;
  const cardWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap) / 2;
  const cardHeight = 224;
  data.territoryReading.slice(0, 6).forEach((reading, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE_MARGIN + column * (cardWidth + gap);
    const y = 330 + row * (cardHeight + gap);
    drawPanel(context, x, y, cardWidth, cardHeight);
    drawLabel(context, reading.label, x + 24, y + 22);
    drawText(context, reading.value, x + 24, y + 62, cardWidth - 48, {
      color: COLORS.ink,
      lineHeight: 29,
      maxLines: 5,
      size: 20,
    });
  });

  const sectionY = 1105;
  drawLabel(context, "Key constraints", PAGE_MARGIN, sectionY);
  drawList(context, data.constraints, PAGE_MARGIN, sectionY + 42, cardWidth, 3);
  drawLabel(context, "Key opportunities", PAGE_MARGIN + cardWidth + gap, sectionY);
  drawList(
    context,
    data.opportunities.map((opportunity) => opportunity.label),
    PAGE_MARGIN + cardWidth + gap,
    sectionY + 42,
    cardWidth,
    5,
  );
}

function drawVisualizationPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
  assets: ReportAssets,
) {
  drawPageBase(context, 5, "Territory Visualization");
  drawHeading(context, "Canonical evidence composition", "Territory visualization");
  const imageX = PAGE_MARGIN;
  const imageY = 300;
  const imageWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const imageHeight = 1060;
  drawPanel(context, imageX, imageY, imageWidth, imageHeight, "#0b100e");
  roundedRect(context, imageX + 8, imageY + 8, imageWidth - 16, imageHeight - 16, 12);
  context.save();
  context.clip();
  drawImageContain(context, assets.synthesis, imageX + 8, imageY + 8, imageWidth - 16, imageHeight - 16);
  context.restore();

  drawText(context, data.visualizationCaption, PAGE_MARGIN, 1390, imageWidth, {
    color: COLORS.muted,
    lineHeight: 27,
    maxLines: 2,
    size: 18,
  });

  const legend = ["Water", "Terrain", "Vegetation", "Access", "Opportunity"];
  const legendWidth = (imageWidth - 4 * 14) / 5;
  legend.forEach((label, index) => {
    const x = PAGE_MARGIN + index * (legendWidth + 14);
    drawPanel(context, x, 1480, legendWidth, 74, COLORS.surfaceLight);
    drawLabel(context, label, x + 18, 1506);
  });
}

function drawOpportunityPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
) {
  drawPageBase(context, 6, "Opportunity Score");
  drawHeading(context, "Ranked development fit", "Opportunity score");
  drawText(context, `${data.opportunityScore}`, PAGE_MARGIN, 292, 250, {
    color: COLORS.greenBright,
    family: "serif",
    size: 78,
    weight: 500,
  });
  drawLabel(context, "Overall opportunity", PAGE_MARGIN + 165, 330);

  const opportunities = data.opportunities.slice(0, 5);
  const rowHeight = opportunities.length > 3 ? 210 : 235;
  let y = 445;
  opportunities.forEach((opportunity, index) => {
    drawPanel(
      context,
      PAGE_MARGIN,
      y,
      PAGE_WIDTH - PAGE_MARGIN * 2,
      rowHeight - 18,
      opportunity.recommended ? "#182a20" : COLORS.surface,
    );
    drawLabel(context, String(index + 1).padStart(2, "0"), PAGE_MARGIN + 24, y + 24);
    drawText(context, opportunity.label, PAGE_MARGIN + 88, y + 20, 560, {
      family: "serif",
      lineHeight: 34,
      maxLines: 2,
      size: 28,
      weight: 500,
    });
    drawText(context, `${opportunity.score}`, PAGE_WIDTH - PAGE_MARGIN - 95, y + 18, 70, {
      color: opportunity.recommended ? COLORS.greenBright : COLORS.ink,
      family: "serif",
      size: 38,
      weight: 500,
    });
    context.fillStyle = COLORS.line;
    context.fillRect(PAGE_MARGIN + 88, y + 94, PAGE_WIDTH - PAGE_MARGIN * 2 - 176, 7);
    context.fillStyle = opportunity.recommended ? COLORS.greenBright : COLORS.green;
    context.fillRect(
      PAGE_MARGIN + 88,
      y + 94,
      (PAGE_WIDTH - PAGE_MARGIN * 2 - 176) * (Math.min(Math.max(opportunity.score, 0), 100) / 100),
      7,
    );
    drawText(context, opportunity.rationale, PAGE_MARGIN + 88, y + 122, PAGE_WIDTH - PAGE_MARGIN * 2 - 176, {
      color: COLORS.muted,
      lineHeight: 28,
      maxLines: 3,
      size: 19,
    });
    if (opportunity.recommended) drawLabel(context, "Recommended", PAGE_WIDTH - PAGE_MARGIN - 230, y + 66);
    y += rowHeight;
  });

  if (opportunities.length === 1) {
    drawText(
      context,
      "The uploaded structured result contains one explicit development recommendation. No additional options were invented for this report.",
      PAGE_MARGIN,
      y + 20,
      PAGE_WIDTH - PAGE_MARGIN * 2,
      { color: COLORS.muted, lineHeight: 32, maxLines: 4, size: 21 },
    );
  }
}

function drawRecommendationPage(
  context: CanvasRenderingContext2D,
  data: PsmReportData,
) {
  drawPageBase(context, 7, "Bob's Recommendation");
  const headingBottom = drawHeading(context, "Final recommendation", data.finalRecommendation);
  const rationaleBottom = drawText(
    context,
    data.recommendationRationale,
    PAGE_MARGIN,
    headingBottom + 30,
    PAGE_WIDTH - PAGE_MARGIN * 2,
    { color: COLORS.muted, lineHeight: 36, maxLines: 8, size: 24 },
  );

  const cardY = Math.max(rationaleBottom + 42, 670);
  const gap = 22;
  const cardWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap) / 2;
  drawMetric(context, "Main opportunity area", data.mainOpportunity, PAGE_MARGIN, cardY, cardWidth, 196);
  drawPanel(context, PAGE_MARGIN + cardWidth + gap, cardY, cardWidth, 196);
  drawLabel(context, "Development approach", PAGE_MARGIN + cardWidth + gap + 24, cardY + 22);
  drawText(
    context,
    data.developmentApproach,
    PAGE_MARGIN + cardWidth + gap + 24,
    cardY + 58,
    cardWidth - 48,
    { family: "serif", lineHeight: 31, maxLines: 4, size: 24, weight: 500 },
  );

  drawLabel(context, "Key organizing systems", PAGE_MARGIN, cardY + 240);
  drawList(context, data.organizingSystems, PAGE_MARGIN, cardY + 282, cardWidth, 5);
  drawLabel(context, "Risks to avoid", PAGE_MARGIN + cardWidth + gap, cardY + 240);
  drawList(context, data.risksToAvoid, PAGE_MARGIN + cardWidth + gap, cardY + 282, cardWidth, 3);

  drawLabel(context, "Suggested next studies", PAGE_MARGIN, 1350);
  drawList(context, data.suggestedStudies, PAGE_MARGIN, 1392, PAGE_WIDTH - PAGE_MARGIN * 2, 5);
}

function drawMethodologyPage(context: CanvasRenderingContext2D) {
  drawPageBase(context, 8, "PSM Methodology");
  drawHeading(context, "Place Systems Method", "GIS calculates. AI interprets. Bob communicates.");
  const methods = [
    ["Water", "Read drainage, watershed structure and the land's capacity to slow, hold and direct water."],
    ["Terrain", "Understand slopes, contours, stability and where construction can follow the territory."],
    ["Vegetation", "Identify ecological structure, habitat value and corridors that should shape development."],
    ["Access", "Evaluate entry, movement and infrastructure without forcing systems against the land."],
    ["Opportunity", "Synthesize evidence into development directions, tradeoffs and next decisions."],
  ];
  const gap = 22;
  const cardWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap) / 2;
  methods.forEach(([label, description], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const width = index === 4 ? cardWidth * 2 + gap : cardWidth;
    const x = index === 4 ? PAGE_MARGIN : PAGE_MARGIN + column * (cardWidth + gap);
    const y = 450 + row * 230;
    drawPanel(context, x, y, width, 204);
    drawLabel(context, label, x + 24, y + 24);
    drawText(context, description, x + 24, y + 64, width - 48, {
      color: COLORS.muted,
      lineHeight: 30,
      maxLines: 4,
      size: 20,
    });
  });

  drawText(
    context,
    '"We don\'t design buildings. We design systems that become places."',
    PAGE_MARGIN,
    1165,
    PAGE_WIDTH - PAGE_MARGIN * 2,
    { color: COLORS.greenBright, family: "serif", lineHeight: 55, maxLines: 3, size: 42, weight: 500 },
  );

  drawPanel(context, PAGE_MARGIN, 1410, PAGE_WIDTH - PAGE_MARGIN * 2, 185);
  drawLabel(context, "Disclaimer", PAGE_MARGIN + 26, 1438);
  drawText(
    context,
    "This report is an early-stage territorial intelligence document. It does not replace certified surveying, engineering, environmental, legal, municipal or financial studies.",
    PAGE_MARGIN + 26,
    1480,
    PAGE_WIDTH - PAGE_MARGIN * 2 - 52,
    { color: COLORS.muted, lineHeight: 31, maxLines: 4, size: 21 },
  );
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("A report page could not be encoded."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.9,
    );
  });
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function buildPdf(pageImages: Uint8Array[]) {
  const encoder = new TextEncoder();
  const objectCount = 2 + pageImages.length * 3;
  const objects = new Array<Uint8Array>(objectCount + 1);
  const pageObjectIds = pageImages.map((_, index) => 3 + index * 3);

  objects[1] = encoder.encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encoder.encode(
    `<< /Type /Pages /Count ${pageImages.length} /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`,
  );

  pageImages.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const content = encoder.encode(`q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ`);

    objects[pageId] = encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects[imageId] = concatBytes([
      encoder.encode(
        `<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
      ),
      image,
      encoder.encode("\nendstream"),
    ]);
    objects[contentId] = concatBytes([
      encoder.encode(`<< /Length ${content.length} >>\nstream\n`),
      content,
      encoder.encode("\nendstream"),
    ]);
  });

  const header = concatBytes([
    encoder.encode("%PDF-1.4\n%"),
    new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3, 0x0a]),
  ]);
  const chunks: Uint8Array[] = [header];
  const offsets = new Array<number>(objectCount + 1).fill(0);
  let byteOffset = header.length;

  for (let id = 1; id <= objectCount; id += 1) {
    offsets[id] = byteOffset;
    const objectBytes = concatBytes([
      encoder.encode(`${id} 0 obj\n`),
      objects[id],
      encoder.encode("\nendobj\n"),
    ]);
    chunks.push(objectBytes);
    byteOffset += objectBytes.length;
  }

  const xrefOffset = byteOffset;
  const xrefRows = ["0000000000 65535 f "];
  for (let id = 1; id <= objectCount; id += 1) {
    xrefRows.push(`${String(offsets[id]).padStart(10, "0")} 00000 n `);
  }
  chunks.push(
    encoder.encode(
      `xref\n0 ${objectCount + 1}\n${xrefRows.join("\n")}\ntrailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    ),
  );

  return new Blob(chunks, { type: "application/pdf" });
}

export async function generatePsmReport(data: PsmReportData): Promise<PdfResult> {
  const [coverTerritory, synthesis, bob] = await Promise.all([
    loadImage(TERRITORY_COVER),
    loadImage(TERRITORY_SYNTHESIS),
    loadImage(BOB_REPORT_IMAGE),
  ]);
  const assets = { coverTerritory, synthesis, bob };
  const pageDrawers = [
    (context: CanvasRenderingContext2D) => drawCoverPage(context, data, assets),
    (context: CanvasRenderingContext2D) => drawExecutiveSummaryPage(context, data),
    (context: CanvasRenderingContext2D) => drawPropertyEvidencePage(context, data),
    (context: CanvasRenderingContext2D) => drawTerritoryReadingPage(context, data),
    (context: CanvasRenderingContext2D) => drawVisualizationPage(context, data, assets),
    (context: CanvasRenderingContext2D) => drawOpportunityPage(context, data),
    (context: CanvasRenderingContext2D) => drawRecommendationPage(context, data),
    (context: CanvasRenderingContext2D) => drawMethodologyPage(context),
  ];
  const pages: Uint8Array[] = [];

  for (const drawPage of pageDrawers) {
    await nextFrame();
    const { canvas, context } = createCanvas();
    drawPage(context);
    pages.push(await canvasToJpeg(canvas));
  }

  return {
    blob: buildPdf(pages),
    fileName: createReportFileName(data.projectName),
  };
}

export function downloadPsmReport({ blob, fileName }: PdfResult) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}
