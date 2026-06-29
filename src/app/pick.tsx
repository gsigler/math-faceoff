import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Screen, Text } from '@/components/ui';
import { colors, OPERATIONS, shadow } from '@/theme';
import { useFlow } from '@/state/flow';
import { useRound } from '@/state/round';
import { useMe, useMyPracticeAttempts } from '@/queries/hooks';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Pick() {
  const opKey = useFlow((s) => s.selectedOperation);
  const op = OPERATIONS[opKey];
  const start = useRound((s) => s.start);
  const me = useMe();
  const practice = useMyPracticeAttempts(me.data?.id, opKey);

  const bestByNumber = new Map<number, number>();
  for (const run of practice.data ?? []) {
    bestByNumber.set(run.practice_number, Math.max(bestByNumber.get(run.practice_number) ?? 0, run.score));
  }

  function pick(n: number) {
    start(opKey, 'practice', n);
    router.push('/test');
  }

  const basis = '22%';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton onPress={() => router.back()} />
        <Text kind="display" size={26} color={op.color} style={{ flex: 1, textAlign: 'right' }}>
          Practice
        </Text>
      </View>

      <Text kind="display" size={24} style={{ marginTop: 22, marginHorizontal: 2 }}>
        Pick a number
      </Text>
      <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 2, marginBottom: 18 }}>
        Tap a number to drill it for 2:00
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {NUMBERS.map((n) => {
          const best = bestByNumber.get(n);
          return (
            <Pressable
              key={n}
              onPress={() => pick(n)}
              style={({ pressed }) => ({
                flexGrow: 1,
                flexBasis: basis,
                height: 78,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadow.candySm,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text kind="display" size={best != null ? 28 : 32}>
                {n}
              </Text>
              {best != null && (
                <Text kind="bodyHeavy" size={11} color={op.color} style={{ marginTop: 2 }}>
                  best {best}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
