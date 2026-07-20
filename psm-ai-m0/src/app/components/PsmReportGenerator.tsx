"use client";

import { useEffect, useState } from "react";
import {
  downloadPsmReport,
  generatePsmReport,
} from "../report-generator";
import type { PsmReportData } from "../report-data";

type ReportStatus = "idle" | "preparing" | "ready" | "error";

type PsmReportGeneratorProps = {
  data: PsmReportData;
  variant?: "dark" | "light";
};

const statusLabels: Record<Exclude<ReportStatus, "error">, string> = {
  idle: "Generate PSM Report",
  preparing: "Preparing report...",
  ready: "Report ready",
};

export default function PsmReportGenerator({
  data,
  variant = "dark",
}: PsmReportGeneratorProps) {
  const [status, setStatus] = useState<ReportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<{
    fileName: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (download) URL.revokeObjectURL(download.url);
    };
  }, [download]);

  const generateReport = async () => {
    setStatus("preparing");
    setError(null);

    try {
      const report = await generatePsmReport(data);
      const url = downloadPsmReport(report);
      setDownload({ fileName: report.fileName, url });
      setStatus("ready");
    } catch (generationError) {
      setStatus("error");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The report could not be generated. Please try again.",
      );
    }
  };

  const label = status === "error" ? "Try report again" : statusLabels[status];

  return (
    <div
      className={`psm-report-generator psm-report-generator--${variant}`}
      data-report-status={status}
    >
      <button
        aria-describedby={error ? "psm-report-error" : undefined}
        disabled={status === "preparing"}
        onClick={generateReport}
        type="button"
      >
        {label}
      </button>
      <span aria-live="polite" className="psm-report-generator__status">
        {status === "preparing"
          ? "Building eight report pages from the current inspection."
          : status === "ready"
            ? "The PDF has been downloaded."
            : ""}
      </span>
      {error ? (
        <p id="psm-report-error" role="alert">
          {error}
        </p>
      ) : null}
      {download ? (
        <a
          aria-hidden="true"
          className="psm-report-generator__download"
          download={download.fileName}
          href={download.url}
          tabIndex={-1}
        >
          Download generated report
        </a>
      ) : null}
    </div>
  );
}
