import { createContext, useContext, type ReactNode } from "react";
import type { MarkerContextValue } from "./types";

const MarkerContext = createContext<MarkerContextValue | null>(null);

export function MarkerProvider({ children, value }: { children: ReactNode; value: MarkerContextValue }) {
  return <MarkerContext.Provider value={value}>{children}</MarkerContext.Provider>;
}

export function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("Marker components must be used within MapMarker");
  }
  return context;
}
