import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as MapLibreGL from "maplibre-gl";
import { cn } from "../../../utils/cn";
import { useMarkerContext } from "./MarkerContext";

interface MarkerTooltipProps {
  children: React.ReactNode;
  className?: string;
  offset?: number | [number, number] | { x: number; y: number };
  maxWidth?: string;
}

export function MarkerTooltip({
  children,
  className,
  offset = 16,
  maxWidth = "none",
}: MarkerTooltipProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);
  const prevOptions = useRef({ offset, maxWidth });

  const tooltip = useMemo(() => {
    const t = new MapLibreGL.Popup({
      offset: offset as any,
      closeOnClick: true,
      closeButton: false,
      maxWidth,
    }).setMaxWidth(maxWidth);
    return t;
  }, [offset, maxWidth]);

  useEffect(() => {
    if (!map) return;
    tooltip.setDOMContent(container);
    const onEnter = () => tooltip.setLngLat(marker.getLngLat()).addTo(map);
    const onLeave = () => tooltip.remove();
    const el = marker.getElement();
    el?.addEventListener("mouseenter", onEnter);
    el?.addEventListener("mouseleave", onLeave);
    return () => {
      el?.removeEventListener("mouseenter", onEnter);
      el?.removeEventListener("mouseleave", onLeave);
      tooltip.remove();
    };
  }, [map, marker, tooltip, container]);

  if (tooltip.isOpen()) {
    const prev = prevOptions.current;
    if (prev.offset !== offset) tooltip.setOffset(offset as any);
    if (prev.maxWidth !== maxWidth) tooltip.setMaxWidth(maxWidth);
    prevOptions.current = { offset, maxWidth };
  }

  return createPortal(
    <div
      className={cn(
        "pointer-events-none rounded-xl bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg border border-white/10 animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
    >
      {children}
    </div>,
    container,
  );
}
