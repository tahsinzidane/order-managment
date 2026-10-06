export function formatBDT(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return '৳' + rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function piecePriceFromDozen(dozenPrice: number): number {
  return dozenPrice / 12;
}

export function formatMoneyShort(n: number): string {
  return formatBDT(n);
}
