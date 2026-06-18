import { View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, Screen, SecondaryButton, Text } from '@/components/ui';
import { colors, OPERATION_ORDER, OPERATIONS, radius, shadow } from '@/theme';

export default function Welcome() {
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 26 }}>
          {OPERATION_ORDER.map((key) => {
            const op = OPERATIONS[key];
            return (
              <View
                key={key}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: op.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: shadow.candy,
                }}
              >
                <Text kind="display" size={28} color={colors.white}>
                  {op.sym}
                </Text>
              </View>
            );
          })}
        </View>
        <Text kind="displayBold" size={48} color={colors.ink}>
          Faceoff
        </Text>
        <Text
          kind="bodyHeavy"
          size={16}
          color={colors.inkSoft}
          style={{ textAlign: 'center', marginTop: 12, maxWidth: 250, lineHeight: 23 }}
        >
          Math battles for the whole family. Race the clock, top the leaderboard.
        </Text>
      </View>

      <View style={{ gap: 12, paddingBottom: 20 }}>
        <PrimaryButton label="Create a family" onPress={() => router.push('/create/name')} />
        <SecondaryButton label="Join a family" onPress={() => router.push('/join')} />
        <Text size={12.5} color={colors.faint} style={{ textAlign: 'center', marginTop: 6 }}>
          No email, no password — just a family code.
        </Text>
      </View>
    </Screen>
  );
}
