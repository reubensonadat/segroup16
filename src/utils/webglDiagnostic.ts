/**
 * WebGL2 Diagnostic & Auto-Restoration Engine for Kola
 *
 * Provides real-time GPU/WebGL capability probing, granular diagnostics,
 * tailored browser-specific troubleshooting steps, and automatic restoration
 * detection when hardware acceleration is restored.
 */

export type WebGLDiagnosticStatus =
  | "supported"
  | "webgl1_only"
  | "disabled"
  | "crashed"
  | "unavailable";

export type BrowserName =
  | "Chrome"
  | "Safari"
  | "Firefox"
  | "Edge"
  | "Brave"
  | "Opera"
  | "Unknown";

export type OSName =
  | "macOS"
  | "Windows"
  | "Linux"
  | "iOS"
  | "Android"
  | "Unknown";

export interface WebGLDiagnosticResult {
  webgl2Supported: boolean;
  webgl1Supported: boolean;
  status: WebGLDiagnosticStatus;
  vendor: string;
  renderer: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  browserName: BrowserName;
  osName: OSName;
  isHardwareAccelerationDisabled: boolean;
  statusMessage: string;
  troubleshootingSteps: string[];
  rawError?: string | null;
  timestamp: string;
}

/**
 * Detect browser engine from navigator user-agent
 */
export function detectBrowserAndOS(): { browser: BrowserName; os: OSName } {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { browser: "Unknown", os: "Unknown" };
  }

  const ua = navigator.userAgent;

  // OS detection
  let os: OSName = "Unknown";
  if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = "Linux";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";

  // Browser detection
  let browser: BrowserName = "Unknown";
  if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === "function") {
    browser = "Brave";
  } else if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Chrome|CriOS/i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg\//i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = "Firefox";
  }

  return { browser, os };
}

/**
 * Run diagnostic probe on WebGL2 & WebGL1 capabilities
 */
export function checkWebGLSupport(errorOverride?: unknown): WebGLDiagnosticResult {
  const { browser, os } = detectBrowserAndOS();
  const timestamp = new Date().toISOString();

  let rawError: string | null = null;
  if (errorOverride) {
    if (errorOverride instanceof Error) {
      rawError = errorOverride.message;
    } else if (typeof errorOverride === "string") {
      rawError = errorOverride;
    } else {
      rawError = String(errorOverride);
    }
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      webgl2Supported: false,
      webgl1Supported: false,
      status: "unavailable",
      vendor: "N/A (SSR)",
      renderer: "N/A (SSR)",
      unmaskedVendor: "N/A",
      unmaskedRenderer: "N/A",
      browserName: browser,
      osName: os,
      isHardwareAccelerationDisabled: true,
      statusMessage: "Running in server-side or headless environment without DOM.",
      troubleshootingSteps: ["Run inside a modern graphical web browser."],
      rawError,
      timestamp,
    };
  }

  let canvas: HTMLCanvasElement | null = null;
  let gl2: WebGL2RenderingContext | null = null;
  let gl1: WebGLRenderingContext | null = null;

  try {
    canvas = document.createElement("canvas");
    gl2 = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
      powerPreference: "default",
    }) as WebGL2RenderingContext | null;
  } catch (err: any) {
    if (!rawError) rawError = err?.message ?? String(err);
  }

  try {
    if (canvas && !gl2) {
      gl1 = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    }
  } catch (err: any) {
    if (!rawError) rawError = err?.message ?? String(err);
  }

  const activeGl = gl2 || gl1;

  let vendor = "";
  let renderer = "";
  let unmaskedVendor = "";
  let unmaskedRenderer = "";

  if (activeGl) {
    try {
      vendor = activeGl.getParameter(activeGl.VENDOR) || "";
      renderer = activeGl.getParameter(activeGl.RENDERER) || "";
      const debugInfo = activeGl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        unmaskedVendor = activeGl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
        unmaskedRenderer = activeGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      }
    } catch {
      // Ignored: some restricted security sandboxes throw on parameter reads
    }
  }

  const isSoftwareRenderer = /swiftshader|llvmpipe|software rasterizer|google swiftshader/i.test(
    `${unmaskedRenderer} ${renderer}`,
  );
  const webgl2Supported = Boolean(gl2);
  const webgl1Supported = Boolean(gl2 || gl1);

  let status: WebGLDiagnosticStatus = "supported";
  let isHardwareAccelerationDisabled = isSoftwareRenderer || !webgl2Supported;
  let statusMessage = "WebGL2 graphics accelerator is operational.";

  if (!webgl2Supported && !webgl1Supported) {
    status = "disabled";
    isHardwareAccelerationDisabled = true;
    statusMessage =
      "Hardware acceleration or WebGL is completely disabled in your browser settings.";
  } else if (!webgl2Supported && webgl1Supported) {
    status = "webgl1_only";
    isHardwareAccelerationDisabled = isSoftwareRenderer;
    statusMessage =
      "Legacy WebGL1 is present, but modern WebGL2 is required for MapLibre 3D cartography.";
  } else if (rawError && /lost|crash|fail/i.test(rawError)) {
    status = "crashed";
    statusMessage = "WebGL context was interrupted or terminated by the OS display driver.";
  }

  // Tailor troubleshooting steps to browser and OS
  const troubleshootingSteps = getBrowserInstructions(browser, os, status);

  return {
    webgl2Supported,
    webgl1Supported,
    status,
    vendor: vendor || "Unknown Vendor",
    renderer: renderer || "Unknown Renderer",
    unmaskedVendor: unmaskedVendor || vendor || "Standard GPU",
    unmaskedRenderer: unmaskedRenderer || renderer || "Default Rasterizer",
    browserName: browser,
    osName: os,
    isHardwareAccelerationDisabled,
    statusMessage,
    troubleshootingSteps,
    rawError,
    timestamp,
  };
}

/**
 * Get curated, step-by-step instructions for the user's specific browser
 */
function getBrowserInstructions(
  browser: BrowserName,
  _os: OSName,
  _status: WebGLDiagnosticStatus,
): string[] {
  switch (browser) {
    case "Chrome":
      return [
        "Open Chrome Settings > System (or navigate to chrome://settings/system).",
        "Toggle ON 'Use graphics acceleration when available'.",
        "Click 'Relaunch' to restart Chrome.",
        "Optional: Navigate to chrome://flags/#ignore-gpu-blocklist and set to 'Enabled'.",
      ];
    case "Brave":
      return [
        "Open Brave Settings > System (or navigate to brave://settings/system).",
        "Ensure 'Use graphics acceleration when available' is toggled ON.",
        "Relaunch Brave to apply changes.",
        "Ensure Shields or aggressive fingerprinting protection is not blocking WebGL.",
      ];
    case "Edge":
      return [
        "Open Edge Settings > System and performance (edge://settings/system).",
        "Toggle ON 'Use graphics acceleration when available'.",
        "Restart Edge.",
      ];
    case "Safari":
      return [
        "In the macOS menu bar, click Safari > Settings (or ⌘,).",
        "Go to the 'Advanced' tab and check 'Show features for web developers'.",
        "In the newly added 'Develop' menu at the top, open 'Feature Flags'.",
        "Ensure 'WebGL 2.0' (and 'WebGL via Metal') are checked.",
        "Reload this page.",
      ];
    case "Firefox":
      return [
        "Navigate to about:config in Firefox and click 'Accept the Risk'.",
        "Search for 'webgl.disabled' and set to false.",
        "Search for 'webgl.force-enabled' and set to true.",
        "Restart Firefox.",
      ];
    default:
      return [
        "Open your browser settings and search for 'hardware acceleration'.",
        "Enable hardware graphics acceleration and restart your browser.",
        "Check your operating system display drivers to ensure 3D acceleration is active.",
      ];
  }
}

/**
 * Creates an Auto-Restorer observer that detects when WebGL2 context
 * becomes available again (e.g. after the user toggles hardware acceleration
 * in settings and focuses back on the tab).
 */
export function createWebGLRestorer(
  onRestore: () => void,
  pollIntervalMs = 3500,
): () => void {
  if (typeof window === "undefined") return () => {};

  let active = true;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const testAndNotify = () => {
    if (!active) return;
    try {
      const canvas = document.createElement("canvas");
      const gl2 = canvas.getContext("webgl2", {
        failIfMajorPerformanceCaveat: false,
      });
      if (gl2) {
        // WebGL2 is back!
        active = false;
        onRestore();
        return;
      }
    } catch {
      // Continue polling
    }

    if (active) {
      timerId = setTimeout(testAndNotify, pollIntervalMs);
    }
  };

  const handleWindowFocus = () => {
    testAndNotify();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      testAndNotify();
    }
  };

  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Initial poll delay
  timerId = setTimeout(testAndNotify, pollIntervalMs);

  return () => {
    active = false;
    if (timerId) clearTimeout(timerId);
    window.removeEventListener("focus", handleWindowFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
