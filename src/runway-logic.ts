/**
 * Pure calculations and state logic for Runway section
 */

export interface RingSlot {
  phi: number;
  z: number;
  persp: number;
  sl: number;
  scale: number;
  x: number;
  bottom: number;
  blur: number;
  opacity: number;
  zIndex: number;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function wrapN(val: number, N = 12): number {
  return ((val % N) + N) % N;
}

export function shortestIndexDelta(i: number, index: number, total = 6): number {
  let d = ((i - index) % total + total) % total;
  if (d > total / 2) d -= total;
  return d;
}

/**
 * Computes 3D ring placement for body `a`
 */
export function computeRingSlot(
  a: number,
  cur: number,
  W: number,
  H: number,
  isMobile: boolean,
  fs = 1.08,
  still = false
): RingSlot {
  const step = (2 * Math.PI) / 12; // 30 deg
  const cx = 0.5 * W;
  const R = (isMobile ? 0.72 : 0.62) * W;
  const P = (isMobile ? 1.9 : 1.65) * W;
  const floor = H - 34;
  const horizon = 0.62 * H;

  // wrap phi into (-PI, PI]
  let phi = ((a - cur) * step) % (2 * Math.PI);
  if (phi <= -Math.PI) phi += 2 * Math.PI;
  if (phi > Math.PI) phi -= 2 * Math.PI;

  const z = R * (1 - Math.cos(phi));
  const persp = P / (P + z);
  const sl = Math.abs(phi) / step;
  const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
  const x = cx + R * Math.sin(phi) * persp;
  const feet = horizon + (floor - horizon) * persp;
  const bottom = H - feet;

  const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
  let opacity = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);

  if (still && sl < 0.02) {
    opacity = 0; // Front body hidden at rest because identical hero shows
  }

  const zIndex = Math.round(scale * 1000);

  return {
    phi,
    z,
    persp,
    sl,
    scale,
    x,
    bottom,
    blur,
    opacity,
    zIndex,
  };
}

export interface ClassicSlot {
  x: number;
  bottom: number;
  scale: number;
  opacity: number;
  blur: number;
  zIndex: number;
}

export function computeClassicSlot(
  k: number,
  W: number,
  still = false
): ClassicSlot {
  const ax = 0.3;
  const ay = 22;
  const sx = 0.32;
  const sy = 22;
  const sr = 0.76;
  const d = 4;

  const x = W * (ax + sx * k);
  const bottom = ay + sy * k;
  const scale = Math.pow(sr, k);
  let opacity = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (4 - k));
  const blur = Math.min(0.9 * k, 3.2);
  const zIndex = 1000 - Math.round(10 * k);

  if (still && Math.abs(k) < 0.02) {
    opacity = 0;
  }

  return {
    x,
    bottom,
    scale,
    opacity,
    blur,
    zIndex,
  };
}

export interface StylingBagItem {
  id: number;
  quantity: number;
}

export function validateBagItems(raw: unknown): StylingBagItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: StylingBagItem[] = [];
  for (const entry of raw) {
    if (
      entry &&
      typeof entry === 'object' &&
      Number.isSafeInteger(entry.id) &&
      typeof entry.quantity === 'number' &&
      entry.quantity >= 1 &&
      entry.quantity <= 20
    ) {
      valid.push({
        id: entry.id,
        quantity: Math.floor(entry.quantity),
      });
    }
  }
  return valid.slice(0, 50);
}

export function addToBag(
  current: StylingBagItem[],
  newItems: { id: number; quantity: number }[]
): StylingBagItem[] {
  const items = current.map((item) => ({ ...item }));
  for (const newItem of newItems) {
    const existing = items.find((i) => i.id === newItem.id);
    if (existing) {
      existing.quantity = Math.min(20, existing.quantity + (newItem.quantity || 1));
    } else {
      if (items.length < 50) {
        items.push({
          id: newItem.id,
          quantity: Math.min(20, Math.max(1, newItem.quantity || 1)),
        });
      }
    }
  }
  return items;
}

export function generateShortlistText(
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    url: string;
  }>
): string {
  const parts = [
    'RUNWAY — STYLING SHORTLIST',
    'Reference prices; no order or payment has been placed.',
    '',
    ...items.map(
      (item) =>
        `${item.name} · Size ${item.size} · Quantity ${item.quantity}\n${item.url}`
    ),
  ];
  return parts.join('\n\n');
}
