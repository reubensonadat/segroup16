export const USD_TO_GHS = 10;

export function toGhs(usd: number): number {
  return usd * USD_TO_GHS;
}

export function formatGhs(amount: number): string {
  return `GH₵${new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
