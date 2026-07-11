import { View, type ViewStyle } from 'react-native';
import { colors, OPERATION_ORDER, OPERATIONS } from '@/theme';

/**
 * Teardrop flame, drawn from one rotated square with asymmetric corner radii
 * (not a font glyph) — same technique as `OpGlyph`/`SkipIcon` in ui.tsx, so
 * badge/streak icons match the app's geometric-icon convention at any size.
 */
export function FlameIcon({ size = 22, color = colors.white }: { size?: number; color?: string }) {
  const w = Math.round(size * 0.62);
  const h = Math.round(size * 0.82);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: w,
          height: h,
          backgroundColor: color,
          borderTopLeftRadius: w * 0.6,
          borderTopRightRadius: w * 0.6,
          borderBottomRightRadius: w * 0.6,
          borderBottomLeftRadius: w * 0.06,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** Small rotated square — the freeze-token marker in the streak calendar. */
export function DiamondIcon({ size = 11, color = colors.white }: { size?: number; color?: string }) {
  const d = Math.round(size * 0.72);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: d, height: d, borderRadius: d * 0.18, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

/** Padlock — a rounded-top shackle arc over a rounded-bottom body. */
export function LockIcon({ size = 22, color = colors.white }: { size?: number; color?: string }) {
  const bodyW = Math.round(size * 0.62);
  const bodyH = Math.round(size * 0.44);
  const t = Math.max(2, Math.round(size * 0.13));
  const shackleW = Math.round(bodyW * 0.62);
  const shackleH = Math.round(size * 0.38);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: shackleW,
          height: shackleH,
          borderTopLeftRadius: shackleW / 2,
          borderTopRightRadius: shackleW / 2,
          borderWidth: t,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: -t,
        }}
      />
      <View style={{ width: bodyW, height: bodyH, borderRadius: t, backgroundColor: color }} />
    </View>
  );
}

/** Checkmark drawn from two bars — the "played" mark in the streak calendar. */
export function CheckIcon({ size = 14, color = colors.white }: { size?: number; color?: string }) {
  const t = Math.max(2, Math.round(size * 0.18));
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: t,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: t / 2,
          left: size * 0.16,
          top: size * 0.38,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: t,
          height: size * 0.72,
          backgroundColor: color,
          borderRadius: t / 2,
          left: size * 0.54,
          top: size * 0.08,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/** Filled circle — the "early bird" (sunrise) badge icon. */
export function SunIcon({ size = 22, color = colors.white }: { size?: number; color?: string }) {
  const d = Math.round(size * 0.6);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />
    </View>
  );
}

/** Crescent moon — a filled circle with an offset circle cut out of it in the
 *  tile's own background color. `bg` must match the badge tile's background
 *  so the "cutout" blends in seamlessly. */
export function MoonIcon({ size = 22, color = colors.white, bg }: { size?: number; color?: string; bg: string }) {
  const d = Math.round(size * 0.62);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />
      <View
        style={{
          position: 'absolute',
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: bg,
          left: size * 0.56,
          top: size * 0.16,
        }}
      />
    </View>
  );
}

/** Target rings — a ring with a filled center dot. The "sharpshooter" icon. */
export function TargetIcon({ size = 24, color = colors.white }: { size?: number; color?: string }) {
  const ring = Math.round(size * 0.7);
  const dot = Math.round(size * 0.22);
  const t = Math.max(2, Math.round(size * 0.11));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: ring, height: ring, borderRadius: ring / 2, borderWidth: t, borderColor: color, position: 'absolute' }} />
      <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
    </View>
  );
}

/** Three ascending bars — volume/endurance. The "marathoner" icon. */
export function BarsIcon({ size = 24, color = colors.white }: { size?: number; color?: string }) {
  const w = Math.max(3, Math.round(size * 0.16));
  const gap = Math.max(2, Math.round(size * 0.09));
  const heights = [0.42, 0.7, 1].map((f) => Math.round(size * 0.58 * f));
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap }}>
      {heights.map((h, i) => (
        <View key={i} style={{ width: w, height: h, backgroundColor: color, borderRadius: w / 3 }} />
      ))}
    </View>
  );
}

/** 2x2 grid in the four operation colors — "all-rounder" across every op. */
export function OpsGridIcon({ size = 24 }: { size?: number }) {
  const cell = Math.round(size * 0.4);
  const gap = Math.max(2, Math.round(size * 0.1));
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'center', justifyContent: 'center' }}>
      {OPERATION_ORDER.map((k) => (
        <View key={k} style={{ width: cell, height: cell, borderRadius: cell * 0.28, backgroundColor: OPERATIONS[k].color }} />
      ))}
    </View>
  );
}

/** Eight-point sparkle (two overlaid rotated squares) — the "star" badge icon. */
export function StarIcon({ size = 26, color = colors.white }: { size?: number; color?: string }) {
  const d = Math.round(size * 0.7);
  const square: ViewStyle = { width: d, height: d, borderRadius: d * 0.22, backgroundColor: color, position: 'absolute' };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[square, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[square, { transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
}
