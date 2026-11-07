import { useEffect, useMemo, useRef } from "react";
import * as MapLibreGL from "maplibre-gl";
import { useMap } from "./MapContext";
import { MarkerProvider } from "./MarkerContext";
import { MarkerContent } from "./MarkerContent";
import { MarkerPopup } from "./MarkerPopup";
import { MarkerTooltip } from "./MarkerTooltip";
import { MarkerLabel } from "./MarkerLabel";
import type { MapMarkerProps } from "./types";

function MapMarkerInner({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  offset = [0, 0],
  rotation = 0,
  rotationAlignment = "auto",
  pitchAlignment = "auto",
}: MapMarkerProps) {
  const { map } = useMap();
  const callbacksRef = useRef({ onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd });
  callbacksRef.current = { onClick, onMouseEnter, onMouseLeave, onDragStart, onDrag, onDragEnd };

  const marker = useMemo(() => {
    const el = document.createElement("div");
    const m = new MapLibreGL.Marker({ element: el, draggable }).setLngLat([longitude, latitude]);

    const handleClick = (e: MouseEvent) => callbacksRef.current.onClick?.(e);
    const handleMouseEnter = (e: MouseEvent) => callbacksRef.current.onMouseEnter?.(e);
    const handleMouseLeave = (e: MouseEvent) => callbacksRef.current.onMouseLeave?.(e);

    el.addEventListener("click", handleClick);
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    const dragStart = () => {
      const ll = m.getLngLat();
      callbacksRef.current.onDragStart?.({ lng: ll.lng, lat: ll.lat });
    };
    const drag = () => {
      const ll = m.getLngLat();
      callbacksRef.current.onDrag?.({ lng: ll.lng, lat: ll.lat });
    };
    const dragEnd = () => {
      const ll = m.getLngLat();
      callbacksRef.current.onDragEnd?.({ lng: ll.lng, lat: ll.lat });
    };

    m.on("dragstart", dragStart);
    m.on("drag", drag);
    m.on("dragend", dragEnd);

    return m;
  }, []);

  useEffect(() => {
    if (!map) return;
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, marker]);

  const currentLngLat = marker.getLngLat();
  if (currentLngLat.lng !== longitude || currentLngLat.lat !== latitude) {
    marker.setLngLat([longitude, latitude]);
  }
  if (marker.isDraggable() !== draggable) {
    marker.setDraggable(draggable);
  }

  const [newOffsetX, newOffsetY] = Array.isArray(offset)
    ? offset
    : [offset ? (offset as { x: number; y: number }).x : 0, offset ? (offset as { x: number; y: number }).y : 0];
  const currentOffset = marker.getOffset();
  if (currentOffset.x !== newOffsetX || currentOffset.y !== newOffsetY) {
    marker.setOffset(offset);
  }
  if (marker.getRotation() !== rotation) {
    marker.setRotation(rotation);
  }
  if (marker.getRotationAlignment() !== rotationAlignment) {
    marker.setRotationAlignment(rotationAlignment);
  }
  if (marker.getPitchAlignment() !== pitchAlignment) {
    marker.setPitchAlignment(pitchAlignment);
  }

  return (
    <MarkerProvider value={{ marker, map }}>
      {children}
    </MarkerProvider>
  );
}

export function MapMarker(props: MapMarkerProps) {
  return <MapMarkerInner {...props} />;
}

export { MarkerContent, MarkerPopup, MarkerTooltip, MarkerLabel };
