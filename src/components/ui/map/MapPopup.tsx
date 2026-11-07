import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as MapLibreGL from "maplibre-gl";
import { cn } from "../../../utils/cn";
import { PopupCloseButton } from "./MarkerPopup";
import { useMap } from "./MapContext";

interface MapPopupProps {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
  offset?: number | [number, number] | { x: number; y: number };
  maxWidth?: string;
}

export function MapPopup({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  offset = 16,
  maxWidth = "none",
}: MapPopupProps) {
  const { map } = useMap();
  const optionsRef = useRef({ offset, maxWidth });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const container = useMemo(() => document.createElement("div"), []);

  const popup = useMemo(() => {
    const p = new MapLibreGL.Popup({
      offset: offset as any,
      closeButton: false,
      maxWidth,
      className: "clean-maplibre-popup",
    })
      .setMaxWidth(maxWidth)
      .setLngLat([longitude, latitude]);
    return p;
  }, []);

  useEffect(() => {
    if (!map) return;
    const onCloseProp = () => onCloseRef.current?.();
    popup.on("close", onCloseProp);
    popup.setDOMContent(container);
    popup.addTo(map);
    return () => {
      popup.off("close", onCloseProp);
      if (popup.isOpen()) popup.remove();
    };
  }, [map, popup, container]);

  if (popup.isOpen()) {
    const prev = optionsRef.current;
    if (popup.getLngLat().lng !== longitude || popup.getLngLat().lat !== latitude) {
      popup.setLngLat([longitude, latitude]);
    }
    if (prev.offset !== offset) popup.setOffset(offset as any);
    if (prev.maxWidth !== maxWidth) popup.setMaxWidth(maxWidth);
    optionsRef.current = { offset, maxWidth };
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
