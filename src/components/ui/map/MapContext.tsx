import { createContext, useContext, type ReactNode } from "react";
import type { MapContextValue } from "./types";

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children, value }: { children: ReactNode; value: MapContextValue }) {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}
