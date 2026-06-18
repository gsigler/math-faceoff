import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BackButton, ProgressBar, Screen, Text } from '@/components/ui';
import { colors, OPERATIONS, radius, shadow } from '@/theme';
import { formatTime, practiceLabel } from '@/game/facts';
import { useRound } from '@/state/round';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'] as const;

export default function Test() {
  const r = useRound();
  const op = OPERATIONS[r.operation];
  const accent = op.color;

  // Drive the 2:00 clock.
  useEffect(() => {
    const id = setInterval(() => useRound.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  // Leave for the result screen when the clock runs out.
  useEffect(() => {
    if (r.status === 'done') router.replace('/result');
  }, [r.status]);

  // Shake the answer box on a wrong entry.
  const shake = useSharedValue(0);
  useEffect(() => {
    if (r.wrong) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      const t = setTimeout(() => useRound.getState().clearWrong(), 300);
      return () => clearTimeout(t);
    }
  }, [r.wrong]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  // Blinking caret when there's no input.
  const blink = useSharedValue(1);
  useEffect(() => {
    blink.value = withRepeat(withTiming(0, { duration: 530 }), -1, true);
  }, []);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  const label = r.mode === 'practice' ? practiceLabel(r.operation, r.practiceNumber) : op.name;
  const timePct = (r.timeLeft / r.roundLen) * 100;

  return (
    <Screen scroll={false}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onPress={() => router.replace('/home')} />
        <View style={{ backgroundColor: accent, paddingVertical: 7, paddingHorizontal: 16, borderRadius: radius.pill }}>
          <Text kind="bodyHeavy" size={14} color={colors.white}>
            {label}
          </Text>
        </View>
        <Text kind="display" size={22} color={accent} style={{ minWidth: 56, textAlign: 'right' }}>
          {formatTime(r.timeLeft)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <Text kind="bodyHeavy" size={14}>
          Score <Text kind="display" size={18}>{r.score}</Text>
        </Text>
        {r.streak >= 2 && (
          <Text kind="bodyHeavy" size={13} color="#F0913A">
            {r.streak} in a row
          </Text>
        )}
      </View>
      <View style={{ marginTop: 10 }}>
        <ProgressBar pct={timePct} color={accent} track={colors.trackWarm} />
      </View>

      {/* problem */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <Text kind="display" size={60} style={{ letterSpacing: 1 }}>
          {r.a} <Text kind="display" size={60} color={accent}>{r.sym}</Text> {r.b}
        </Text>
        <Animated.View
          style={[
            {
              minWidth: 170,
              height: 86,
              paddingHorizontal: 22,
              borderWidth: 3,
              borderColor: r.wrong ? colors.danger : accent,
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            },
            shakeStyle,
          ]}
        >
          {r.input.length > 0 ? (
            <Text kind="display" size={48}>
              {r.input}
            </Text>
          ) : (
            <Animated.View style={[{ width: 4, height: 48, borderRadius: 2, backgroundColor: accent }, blinkStyle]} />
          )}
        </Animated.View>
      </View>

      {/* keypad */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {KEYS.map((k) => {
          const label = k === 'del' ? '⌫' : k === 'clr' ? 'C' : k;
          const onPress =
            k === 'del' ? r.del : k === 'clr' ? r.clear : () => r.press(k);
          return (
            <Pressable
              key={k}
              onPress={onPress}
              style={({ pressed }) => ({
                flexGrow: 1,
                flexBasis: '30%',
                height: 62,
                borderRadius: 17,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadow.candySm,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text kind="display" size={28}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
