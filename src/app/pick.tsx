import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Screen, Text } from '@/components/ui';
import { colors, OPERATIONS, radius, shadow } from '@/theme';
import { useFlow } from '@/state/flow';
import { useRound } from '@/state/round';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Pick() {
  const opKey = useFlow((s) => s.selectedOperation);
  const op = OPERATIONS[opKey];
  const start = useRound((s) => s.start);

  function pick(n: number) {
    start(opKey, 'practice', n);
    router.push('/test');
  }

  const basis = '22%';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton onPress={() => router.back()} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            backgroundColor: op.color,
            paddingVertical: 7,
            paddingLeft: 12,
            paddingRight: 16,
            borderRadius: radius.pill,
          }}
        >
          <Text kind="display" size={18} color={colors.white}>
            {op.sym}
          </Text>
          <Text kind="bodyHeavy" size={14} color={colors.white}>
            Practice · {op.name}
          </Text>
        </View>
      </View>

      <Text kind="display" size={24} style={{ marginTop: 22, marginHorizontal: 2 }}>
        Which number for {op.name.toLowerCase()}?
      </Text>
      <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 2, marginBottom: 18 }}>
        Tap a number to drill it for 2:00
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
        {NUMBERS.map((n) => (
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
            <Text kind="display" size={32}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
