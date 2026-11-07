import React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../utils/cn";
import { useMarkerContext } from "./MarkerContext";

export function DefaultMarkerIcon() {
  return <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />;
}

export function MarkerContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  const { marker } = useMarkerContext();
  return createPortal(
    <div className={cn("relative cursor-pointer select-none", className)}>
      {children || <DefaultMarkerIcon />}
    </div>,
    marker.getElement(),
  );
}
