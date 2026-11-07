import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "../../../utils/cn";
import { useResolvedTheme } from "./useMapTheme";
import { MapProvider } from "./MapContext";
import type { MapProps, MapViewport, MapStyleOption } from "./types";
import { defaultStyles } from "./types";
import {
  checkWebGLSupport,
  createWebGLRestorer,
  type WebGLDiagnosticResult,
} from "../../../utils/webglDiagnostic";
import { WebGLDiagnosticCard } from "./WebGLDiagnosticCard";

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

function DefaultLoader() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-xs pointer-events-none">
      <div className="flex gap-1.5 items-center">
        <span className="size-2 rounded-full bg-accent animate-bounce" />
        <span className="size-2 rounded-full bg-accent animate-bounce [animation-delay:0.15s]" />
        <span className="size-2 rounded-full bg-accent animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}

export function Map({
  children,
  className,
  theme: themeProp,
  styles,
  projection,
  viewport,
  onViewportChange,
  loading = false,
  fallback,
  ...props
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isContextLost, setIsContextLost] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<WebGLDiagnosticResult | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [retryToken, setRetryToken] = useState(0);

  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  const isControlled = viewport !== undefined && onViewportChange !== undefined;
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles],
  );

  const clearStyleTimeout = () => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  };

  const handleRetry = useCallback(() => {
    setMapError(null);
    setIsRestoring(true);
    setRetryToken((t) => t + 1);
  }, []);

  // Primary Map Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    // Pre-flight WebGL check before touching MapLibreGL constructor
    const initialDiag = checkWebGLSupport();
    setDiagnostic(initialDiag);

    if (!initialDiag.webgl2Supported) {
      setWebglSupported(false);
      setMapError(
        initialDiag.statusMessage ||
          "WebGL2 is required to display this map. Hardware acceleration is disabled.",
      );
      setIsRestoring(false);
      return;
    }

    const initialStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    let map: MapLibreGL.Map | null = null;

    try {
      map = new MapLibreGL.Map({
        container: containerRef.current,
        style: initialStyle,
        renderWorldCopies: false,
        attributionControl: { compact: true },
        ...props,
        ...viewport,
      });
      setWebglSupported(true);
      setIsContextLost(false);
    } catch (err: unknown) {
      const failDiag = checkWebGLSupport(err);
      setDiagnostic(failDiag);
      setWebglSupported(false);
      setMapError(
        err instanceof Error
          ? err.message
          : "WebGL2 is required to display this map. Browser graphics acceleration is disabled.",
      );
      setIsRestoring(false);
      return;
    }

    const styleDataHandler = () => {
      clearStyleTimeout();
      styleTimeoutRef.current = setTimeout(() => {
        setIsStyleLoaded(true);
        if (projection && map) map.setProjection(projection);
      }, 100);
    };

    const loadHandler = () => {
      setIsLoaded(true);
      setMapError(null);
      setIsRestoring(false);
    };

    const errorHandler = (e: MapLibreGL.ErrorEvent) => {
      if (map && map.loaded()) return;
      setMapError((prev) => prev ?? e.error?.message ?? "Map failed to initialize");
    };

    const contextLostHandler = (e: any) => {
      e?.preventDefault?.();
      setIsContextLost(true);
      setMapError("WebGL graphics context was interrupted or terminated.");
    };

    const contextRestoredHandler = () => {
      setIsContextLost(false);
      setMapError(null);
      handleRetry();
    };

    const handleMove = () => {
      if (internalUpdateRef.current || !map) return;
      onViewportChangeRef.current?.(getViewport(map));
    };

    map.on("load", loadHandler);
    map.on("styledata", styleDataHandler);
    map.on("error", errorHandler);
    map.on("webglcontextlost", contextLostHandler);
    map.on("webglcontextrestored", contextRestoredHandler);
    map.on("move", handleMove);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      if (map) {
        map.off("load", loadHandler);
        map.off("styledata", styleDataHandler);
        map.off("error", errorHandler);
        map.off("webglcontextlost", contextLostHandler);
        map.off("webglcontextrestored", contextRestoredHandler);
        map.off("move", handleMove);
        map.remove();
      }
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
      setMapError(null);
    };
  }, [retryToken, resolvedTheme]);

  // Auto-Restoration Engine: Probes for WebGL2 restoration in the background
  useEffect(() => {
    if (webglSupported && !isContextLost) return;

    // If WebGL2 failed or was lost, observe focus / periodic probe to restore automatically
    const cleanupRestorer = createWebGLRestorer(() => {
      const rechecked = checkWebGLSupport();
      if (rechecked.webgl2Supported) {
        setDiagnostic(rechecked);
        setWebglSupported(true);
        setIsContextLost(false);
        setMapError(null);
        handleRetry();
      }
    }, 3000);

    return cleanupRestorer;
  }, [webglSupported, isContextLost, handleRetry]);

  // Viewport updates
  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport) return;
    if (mapInstance.isMoving()) return;

    const current = getViewport(mapInstance);
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    };

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.flyTo({
      center: next.center,
      zoom: next.zoom,
      bearing: next.bearing,
      pitch: next.pitch,
      duration: 1500,
      essential: true,
    });
    internalUpdateRef.current = false;
  }, [mapInstance, isControlled, viewport]);

  // Theme updates
  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;
    const newStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    if (currentStyleRef.current === newStyle) return;

    clearStyleTimeout();
    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);
    mapInstance.setStyle(newStyle, { diff: true });
  }, [mapInstance, resolvedTheme, mapStyles]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
      error: mapError,
      webglSupported,
      isContextLost,
      diagnostic,
      retryMap: handleRetry,
    }),
    [mapInstance, isLoaded, isStyleLoaded, mapError, webglSupported, isContextLost, diagnostic, handleRetry],
  );

  const activeDiagnostic = diagnostic ?? checkWebGLSupport();
  const hasFatalError = !webglSupported || isContextLost || Boolean(mapError);

  return (
    <MapProvider value={contextValue}>
      <div ref={containerRef} className={cn("relative h-full w-full", className)}>
        {/* Loading Spinner */}
        {!hasFatalError && (!isLoaded || !isStyleLoaded || loading) && <DefaultLoader />}

        {/* Fallback View when WebGL2 is disabled or fatal error occurs */}
        {hasFatalError && (
          <div className="absolute inset-0 z-20 overflow-hidden bg-canvas">
            {fallback ? (
              typeof fallback === "function" ? (
                fallback({
                  diagnostic: activeDiagnostic,
                  onRetry: handleRetry,
                  isRestoring,
                })
              ) : (
                fallback
              )
            ) : (
              <WebGLDiagnosticCard
                diagnostic={activeDiagnostic}
                onRetry={handleRetry}
                isRestoring={isRestoring}
              />
            )}
          </div>
        )}

        {/* Map Children (rendered only when map is active) */}
        {!hasFatalError && children}
      </div>
    </MapProvider>
  );
}
