import { useWindowDimensions } from 'react-native';

// One universal app: the same screens render a phone (1-col) or iPad layout
// based on available width. No forked screens, no separate board mode.

export const TABLET_BREAKPOINT = 700;

// Single-focus screens (onboarding, the drill) stay a comfortable centered
// column even on a big iPad; the dashboard (home) is allowed to go wide.
export const FOCUSED_MAX_WIDTH = 460;
export const WIDE_MAX_WIDTH = 980;

export interface Layout {
  width: number;
  height: number;
  isTablet: boolean;
  /** Horizontal gutter. */
  gutter: number;
}

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return { width, height, isTablet, gutter: isTablet ? 40 : 18 };
}

/** Content max-width for a screen given the `wide` (dashboard) flag. */
export function contentWidthFor(isTablet: boolean, width: number, wide: boolean): number {
  if (!isTablet) return width;
  return wide ? Math.min(width, WIDE_MAX_WIDTH) : FOCUSED_MAX_WIDTH;
}
