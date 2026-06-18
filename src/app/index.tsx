import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { colors } from '@/theme';
import { useSession } from '@/state/session';
import { useMe } from '@/queries/hooks';

export default function Index() {
  const session = useSession();
  const me = useMe();

  if (!session.configured) {
    return (
      <Screen center>
        <Text kind="display" size={24} style={{ textAlign: 'center', marginBottom: 10 }}>
          Almost there
        </Text>
        <Text size={15} color={colors.inkSoft} style={{ textAlign: 'center', lineHeight: 22 }}>
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env, then reload.
        </Text>
      </Screen>
    );
  }

  if (!session.ready || (me.isLoading && !me.data)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#21BA72" />
      </View>
    );
  }

  return <Redirect href={me.data ? '/home' : '/welcome'} />;
}
