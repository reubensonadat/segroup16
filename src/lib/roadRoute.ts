/**
 * roadRoute.ts — the ONE road-distance engine (moved from manager
 * deliverymap/helpers so checkout can share it).
 *
 * DOCTRINE (user directive 2026-10-27): any distance that prices money —
 * route-mode delivery fees especially — is measured on REAL ROADS, never as
 * a straight line. The public OSRM router (no API key, CORS-open) returns
 * the actual driving geometry; haversine is only ever a LABELLED fallback
 * when the router is unreachable, never a silent substitute.
 *
 * Consumers: CheckoutPage (route-fee measurement) · ManagerDelivery
 * (dispatch visualization). Keep both on this single implementation — a
 * second router would let the map and the fee disagree.
 */

export interface RoadPoint {
    lat: number;
    lng: number;
}

export interface RoadRouteGeometry {
    coords: [number, number][]; // [lng, lat] following real streets
    distanceKm: number;
    durationMin: number;
}

// Swap to a self-hosted OSRM instance here when we go to production.
const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Real driving route through the given waypoints. Returns null on ANY
 * failure (offline, server hiccup, bad geometry) so callers fall back
 * honestly — the calling surface never breaks.
 */
export async function fetchRoadRoute(
    waypoints: RoadPoint[],
): Promise<RoadRouteGeometry | null> {
    if (waypoints.length < 2) return null;

    // OSRM path format: lng,lat;lng,lat — semicolons must stay raw.
    const path = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');

    try {
        const res = await fetch(
            `${OSRM_BASE}/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`,
        );
        if (!res.ok) return null;

        const data = await res.json();
        const route = data?.routes?.[0];
        const line = route?.geometry?.coordinates as [number, number][] | undefined;
        if (!Array.isArray(line) || line.length < 2) return null;

        return {
            coords: line,
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMin: Math.round(route.duration / 60),
        };
    } catch {
        return null;
    }
}

/** Road distance in km between two points (null = router unreachable). */
export async function roadDistanceKm(
    from: RoadPoint,
    to: RoadPoint,
): Promise<number | null> {
    const route = await fetchRoadRoute([from, to]);
    return route ? route.distanceKm : null;
}
