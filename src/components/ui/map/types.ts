import type * as MapLibreGL from "maplibre-gl";

import type { WebGLDiagnosticResult } from "../../../utils/webglDiagnostic";

export type Theme = "light" | "dark";

export const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

export type MapStyleOption = string | any;

export type MapViewport = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

export type MapRef = MapLibreGL.Map;

export type MapFallbackProps = {
  diagnostic: WebGLDiagnosticResult;
  onRetry: () => void;
  isRestoring: boolean;
};

export type MapProps = {
  children?: React.ReactNode;
  className?: string;
  theme?: Theme;
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  projection?: any;
  viewport?: Partial<MapViewport>;
  onViewportChange?: (viewport: MapViewport) => void;
  loading?: boolean;
  /**
   * Optional custom fallback rendered when WebGL2 is not supported or crashed.
   * If not provided, a built-in Auto-Restorable Diagnostic card is rendered.
   */
  fallback?: React.ReactNode | ((props: MapFallbackProps) => React.ReactNode);
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

export type MarkerOptions = Omit<MapLibreGL.MarkerOptions, "element">;

export type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children: React.ReactNode;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & MarkerOptions;

export type MarkerContentProps = {
  children?: React.ReactNode;
  className?: string;
};

export type PopupOptions = Omit<MapLibreGL.PopupOptions, "className" | "closeButton">;

export type MarkerPopupProps = {
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
} & PopupOptions;

export type MarkerTooltipProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">;

export type MarkerLabelProps = {
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom";
};

export type MapControlsProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
};

export type MapPopupProps = {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
} & PopupOptions;

export type MapRouteProps = {
  id?: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  interactive?: boolean;
};

export type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
  /** First fatal error of the current mount (worker/style/WebGL). Null once healthy. */
  error?: string | null;
  webglSupported: boolean;
  isContextLost: boolean;
  diagnostic: WebGLDiagnosticResult | null;
  retryMap: () => void;
};

export type MarkerContextValue = {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
};
