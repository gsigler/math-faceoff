// Arcade theme — warm cream, chunky candy buttons, operator-colored accents.
// Ported from the locked-in prototype direction.

export const colors = {
  bg: '#FFF6EC', // warm cream
  ink: '#20242E', // near-black text
  inkSoft: '#5a6170',
  muted: '#8a8f99',
  faint: '#b7bcc6',
  hairline: '#e6e2d8',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FA',
  highlight: '#FFF6DA', // "you" row highlight
  track: '#eef0f3', // progress track on white
  trackWarm: '#eadfce', // progress track on cream
  danger: '#EF6F6F',
  success: '#21BA72', // correct-answer celebration
  gold: '#F0B400',
  goldSoft: '#FFF1C9',
  goldInk: '#A66A00',
  white: '#FFFFFF',
} as const;

export type OperationKey = 'add' | 'sub' | 'mul' | 'div';

export interface OperationDef {
  key: OperationKey;
  name: string;
  sym: string;
  color: string;
  tint: string; // pale background for record cards
  tintBorder: string;
}

export const OPERATIONS: Record<OperationKey, OperationDef> = {
  add: { key: 'add', name: 'Addition', sym: '+', color: '#21BA72', tint: '#F1FBF5', tintBorder: '#d6f1e1' },
  sub: { key: 'sub', name: 'Subtraction', sym: '−', color: '#2E90E0', tint: '#EFF7FD', tintBorder: '#d2e8f8' },
  mul: { key: 'mul', name: 'Multiplication', sym: '×', color: '#B25CE0', tint: '#F8F1FD', tintBorder: '#ecd9f7' },
  div: { key: 'div', name: 'Division', sym: '÷', color: '#F08A37', tint: '#FEF5EC', tintBorder: '#f8e2cb' },
} as const;

export const OPERATION_ORDER: OperationKey[] = ['add', 'sub', 'mul', 'div'];

export const fonts = {
  // Display (chunky, rounded) — Fredoka
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  // Body / UI — Nunito
  body: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

// Hard "candy" drop shadows (no blur) + soft card shadows.
export const shadow = {
  candy: '0px 5px 0px rgba(0,0,0,0.12)', // primary buttons
  candySm: '0px 3px 0px rgba(0,0,0,0.07)', // keypad / small tiles
  card: '0px 2px 0px rgba(0,0,0,0.04), 0px 10px 26px rgba(0,0,0,0.05)',
  cardWide: '0px 2px 0px rgba(0,0,0,0.04), 0px 12px 30px rgba(0,0,0,0.05)',
  chip: '0px 2px 6px rgba(0,0,0,0.06)',
} as const;

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}
