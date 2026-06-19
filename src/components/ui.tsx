import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text as RNText,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '@/theme';
import { contentWidthFor, useLayout } from '@/theme/responsive';

type FontKind = 'display' | 'displayBold' | 'body' | 'bodyHeavy';

export function Text({
  kind = 'body',
  color = colors.ink,
  size,
  style,
  ...rest
}: TextProps & { kind?: FontKind; color?: string; size?: number }) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: fonts[kind], color }, size != null && { fontSize: size }, style]}
    />
  );
}

/** Full-screen cream surface with safe-area padding and centered content. */
export function Screen({
  children,
  scroll = true,
  center = false,
  wide = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  /** Dashboard screens (home) go wide; single-focus screens stay a column. */
  wide?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const { gutter, isTablet, width } = useLayout();
  const contentWidth = contentWidthFor(isTablet, width, wide);
  const pad: ViewStyle = {
    paddingTop: insets.top + 16,
    paddingBottom: insets.bottom + 20,
    paddingHorizontal: gutter,
  };
  const inner = (
    <View style={[{ width: '100%', maxWidth: contentWidth, alignSelf: 'center', flex: scroll ? undefined : 1 }, style]}>
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.screen, pad, center && styles.center]}>{inner}</View>;
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[pad, center && styles.centerGrow]}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
}

export function PrimaryButton({
  label,
  color = colors.surfaceAlt,
  textColor = colors.white,
  bg = '#21BA72',
  disabled,
  style,
  ...rest
}: PressableProps & { label: string; bg?: string; textColor?: string; color?: string }) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: bg, boxShadow: shadow.candy, opacity: disabled ? 0.45 : pressed ? 0.92 : 1 },
        style as ViewStyle,
      ]}
    >
      <Text kind="bodyHeavy" size={17} color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  style,
  ...rest
}: PressableProps & { label: string }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.85 : 1 }, style as ViewStyle]}
    >
      <Text kind="bodyHeavy" size={17} color={colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]} hitSlop={8}>
      <Text size={20} color={colors.inkSoft} style={{ marginTop: -3 }}>
        ‹
      </Text>
    </Pressable>
  );
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text kind="bodyHeavy" size={size * 0.42} color={colors.white}>
        {(name.trim()[0] || '?').toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * Operator glyph drawn from geometric bars (not a font glyph), so it is exactly
 * centered both axes at any size. `symSize` is the glyph's visual extent.
 */
function OpGlyph({ sym, symSize, color }: { sym: string; symSize: number; color: string }) {
  const L = Math.round(symSize * 0.72); // glyph length
  const t = Math.max(2, Math.round(symSize * 0.18)); // stroke thickness
  const bar = (s: ViewStyle, key?: string) => (
    <View key={key} style={[{ position: 'absolute', backgroundColor: color, borderRadius: t / 2 }, s]} />
  );
  const hBar: ViewStyle = { top: (L - t) / 2, left: 0, width: L, height: t };
  const vBar: ViewStyle = { left: (L - t) / 2, top: 0, width: t, height: L };

  let parts: ReactNode;
  if (sym === '+') parts = [bar(hBar, 'h'), bar(vBar, 'v')];
  else if (sym === '−') parts = bar(hBar, 'h'); // −
  else if (sym === '×') {
    parts = [bar({ ...hBar, transform: [{ rotate: '45deg' }] }, 'a'), bar({ ...hBar, transform: [{ rotate: '-45deg' }] }, 'b')]; // ×
  } else {
    const d = Math.max(2, Math.round(symSize * 0.2)); // dot
    const gap = Math.max(2, Math.round(symSize * 0.12));
    parts = [
      bar({ top: (L - t) / 2 - gap - d, left: (L - d) / 2, width: d, height: d, borderRadius: d / 2 }, 'top'),
      bar(hBar, 'mid'),
      bar({ top: (L + t) / 2 + gap, left: (L - d) / 2, width: d, height: d, borderRadius: d / 2 }, 'bot'),
    ]; // ÷
  }
  return <View style={{ width: L, height: L }}>{parts}</View>;
}

/** A rounded square holding a perfectly-centered operator glyph. */
export function OpBadge({
  sym,
  size,
  symSize,
  bg,
  color = colors.white,
  radius: r = 8,
  style,
}: {
  sym: string;
  size: number;
  symSize: number;
  bg: string;
  color?: string;
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      <OpGlyph sym={sym} symSize={symSize} color={color} />
    </View>
  );
}

export function ProgressBar({ pct, color, track = colors.track, height = 8 }: { pct: number; color: string; track?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ height, width: `${Math.max(0, Math.min(100, pct))}%`, borderRadius: radius.pill, backgroundColor: color }} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center' },
  centerGrow: { flexGrow: 1, justifyContent: 'center' },
  primary: {
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondary: {
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.hairline,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.chip,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    boxShadow: shadow.card,
  },
});
