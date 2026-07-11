import { View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Screen, Text } from '@/components/ui';
import { badgeDefs, BadgeTile } from '@/components/badges';
import { colors } from '@/theme';
import { useLayout } from '@/theme/responsive';
import { useMe, useMyBadges } from '@/queries/hooks';

export default function BadgesScreen() {
  const { isTablet } = useLayout();
  const me = useMe();
  const badges = useMyBadges(me.data?.id);
  const defs = badges.data ? badgeDefs(badges.data) : [];
  const earnedCount = defs.filter((d) => d.earned).length;

  return (
    <Screen wide={isTablet}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton onPress={() => router.back()} />
        <Text kind="display" size={26} style={{ flex: 1, textAlign: 'right' }}>
          Badges
        </Text>
      </View>

      <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ marginTop: 22, marginHorizontal: 2, marginBottom: 20 }}>
        {defs.length === 0 ? 'Loading…' : `${earnedCount} of ${defs.length} earned`}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 26 }}>
        {defs.map((def) => (
          <BadgeTile key={def.id} def={def} size={isTablet ? 88 : 72} />
        ))}
      </View>
    </Screen>
  );
}
