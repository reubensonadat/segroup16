import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as MapLibreGL from "maplibre-gl";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useMarkerContext } from "./MarkerContext";

export function PopupCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close popup"
      className="absolute top-1.5 right-1.5 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-ink transition-colors"
    >
      <X className="size-3" />
    </button>
  );
}

interface MarkerPopupProps {
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
  offset?: number | [number, number] | { x: number; y: number };
  maxWidth?: string;
}

export function MarkerPopup({
  children,
  className,
  closeButton = false,
  offset = 16,
  maxWidth = "none",
}: MarkerPopupProps) {
  const { marker, map } = useMarkerContext();
  const container = useMemo(() => document.createElement("div"), []);
  const prevOptions = useRef({ offset, maxWidth });

  const popup = useMemo(() => {
    const p = new MapLibreGL.Popup({
      offset: offset as any,
      closeButton: false,
      maxWidth: maxWidth,
      className: "clean-maplibre-popup",
    })
      .setMaxWidth(maxWidth)
      .setDOMContent(container);
    return p;
  }, []);

  useEffect(() => {
    if (!map) return;
    popup.setDOMContent(container);
    marker.setPopup(popup);
    return () => {
      marker.setPopup(null as any);
    };
  }, [map, marker, popup, container]);

  if (popup.isOpen()) {
    const prev = prevOptions.current;
    if (prev.offset !== offset) popup.setOffset(offset as any);
    if (prev.maxWidth !== maxWidth) popup.setMaxWidth(maxWidth);
    prevOptions.current = { offset, maxWidth };
  }

  const handleClose = () => popup.remove();

  return createPortal(
    <div
      className={cn(
        "relative rounded-2xl bg-card p-3 text-foreground shadow-xl border border-border min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
    >
      {closeButton && <PopupCloseButton onClick={handleClose} />}
      {children}
    </div>,
    container,
  );
}
