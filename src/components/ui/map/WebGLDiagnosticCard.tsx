import React, { useState } from "react";
import {
  Wrench,
  RefreshCw,
  CheckCheck,
  Copy,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Globe,
} from "lucide-react";
import type { WebGLDiagnosticResult } from "../../../utils/webglDiagnostic";

const toast = {
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg),
};

interface WebGLDiagnosticCardProps {
  diagnostic: WebGLDiagnosticResult;
  onRetry: () => void;
  isRestoring?: boolean;
  className?: string;
}

export const WebGLDiagnosticCard: React.FC<WebGLDiagnosticCardProps> = ({
  diagnostic,
  onRetry,
  isRestoring = false,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  const handleCopy = () => {
    try {
      const payload = JSON.stringify(diagnostic, null, 2);
      navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success("Diagnostic report copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy diagnostic report");
    }
  };

  const handleManualProbe = () => {
    setIsProbing(true);
    setTimeout(() => {
      setIsProbing(false);
      onRetry();
    }, 600);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center h-full w-full p-6 sm:p-8 bg-surface-muted/90 dark:bg-canvas/95 backdrop-blur-md overflow-y-auto ${className}`}
    >
      <div className="w-full max-w-xl rounded-3xl bg-panel border border-hairline shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Alert */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline pb-5">
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  GPU Diagnostic
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-muted">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Auto-Restorable Probe Active
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-ink mt-1.5">
                WebGL2 Acceleration Required
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                MapLibre GL 3D vector maps require WebGL2 hardware acceleration. Turn it on in your
                browser settings, and this map will automatically self-restore.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Diagnostics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          <div className="rounded-2xl p-3 bg-canvas/60 dark:bg-surface-muted/40 border border-hairline/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <Globe className="size-3" />
              Browser & OS
            </span>
            <p className="font-semibold text-ink truncate" title={`${diagnostic.browserName} on ${diagnostic.osName}`}>
              {diagnostic.browserName} · {diagnostic.osName}
            </p>
          </div>

          <div className="rounded-2xl p-3 bg-canvas/60 dark:bg-surface-muted/40 border border-hairline/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <Cpu className="size-3" />
              Graphics Engine
            </span>
            <p className="font-semibold text-ink truncate" title={diagnostic.unmaskedRenderer || diagnostic.renderer}>
              {diagnostic.unmaskedRenderer || "Default Rasterizer"}
            </p>
          </div>

          <div className="rounded-2xl p-3 bg-canvas/60 dark:bg-surface-muted/40 border border-hairline/80 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <Wrench className="size-3" />
              WebGL Status
            </span>
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              {diagnostic.status === "webgl1_only"
                ? "WebGL1 Only (Need WebGL2)"
                : diagnostic.status === "disabled"
                  ? "Disabled in Settings"
                  : diagnostic.status === "crashed"
                    ? "Context Interrupted"
                    : "Context Unavailable"}
            </p>
          </div>
        </div>

        {/* Browser-Specific Instructions */}
        <div className="rounded-2xl p-4 bg-canvas/80 dark:bg-surface-muted/60 border border-hairline space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-accent" />
              How to enable in {diagnostic.browserName}
            </span>
            <span className="text-[10px] font-medium text-ink-muted">
              Auto-restores once toggled
            </span>
          </div>

          <ol className="space-y-1.5 text-xs text-ink/90 list-decimal list-inside leading-relaxed">
            {diagnostic.troubleshootingSteps.map((step, idx) => (
              <li key={idx} className="font-medium">
                <span className="text-ink">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleManualProbe}
            disabled={isProbing || isRestoring}
            className="w-full sm:flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-xs font-bold uppercase tracking-wider text-canvas transition-all hover:bg-ink/85 active:scale-98 disabled:opacity-60 shadow-md"
          >
            <RefreshCw className={`size-4 ${isProbing || isRestoring ? "animate-spin" : ""}`} />
            {isProbing || isRestoring ? "Checking WebGL2…" : "Probe & Restore Map"}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5 rounded-2xl bg-canvas hover:bg-surface-muted border border-hairline px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors active:scale-98 shrink-0"
          >
            {copied ? (
              <>
                <CheckCheck className="size-4 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4 text-ink-muted" />
                Copy Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
