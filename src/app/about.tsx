import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { BackButton, Card, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors } from '@/theme';

// ─── Edit these to your own details ──────────────────────────────────────────
const CREATOR_NAME = 'Grady Sigler';
const CREATOR_BIO =
  'Fact Faceoff is a little family project — a fast, no-logins way for kids to ' +
  'drill their math facts and race a shared family leaderboard. Built on nights ' +
  'and weekends with Expo and Supabase.';
const COFFEE_URL = 'https://buymeacoffee.com/gradysigler';
// ─────────────────────────────────────────────────────────────────────────────

const VERSION = Constants.expoConfig?.version ?? '';

export default function About() {
  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text kind="display" size={26}>
          About
        </Text>
      </View>

      <Card style={{ padding: 20 }}>
        <Text kind="bodyHeavy" size={11} color={colors.faint} style={{ letterSpacing: 0.5, marginBottom: 8 }}>
          THE CREATOR
        </Text>
        <Text kind="display" size={22} style={{ marginBottom: 10 }}>
          {CREATOR_NAME}
        </Text>
        <Text kind="body" size={15} color={colors.inkSoft} style={{ lineHeight: 22 }}>
          {CREATOR_BIO}
        </Text>
      </Card>

      <View style={{ marginTop: 28 }}>
        <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginBottom: 10, marginHorizontal: 2 }}>
          Enjoying it? Help keep it going.
        </Text>
        <PrimaryButton
          label="Buy me a coffee"
          bg={colors.gold}
          textColor={colors.goldInk}
          onPress={() => Linking.openURL(COFFEE_URL)}
        />
      </View>

      <View style={{ flex: 1 }} />
      <Text size={12.5} color={colors.faint} style={{ textAlign: 'center', marginBottom: 4 }}>
        Fact Faceoff{VERSION ? ` · v${VERSION}` : ''}
      </Text>
    </Screen>
  );
}
