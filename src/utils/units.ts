import type { Unit } from '@/types';

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
];

export function unitLabel(unit: Unit): string {
  const found = UNITS.find((u) => u.value === unit);
  return found ? found.label : unit;
}

export function formatQty(qty: number, unit: Unit): string {
  const display = Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100);
  return `${display} ${unit}`;
}

export const PIECES_PER_DOZEN = 12;

/** Returns the whole-dozen equivalent when pieces divide evenly into dozens, else null. */
export function dozenEquivalent(pieces: number): number | null {
  if (!Number.isInteger(pieces) || pieces <= 0) return null;
  if (pieces % PIECES_PER_DOZEN !== 0) return null;
  return pieces / PIECES_PER_DOZEN;
}
