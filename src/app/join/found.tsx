import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Card, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';
import { useFlow } from '@/state/flow';

export default function JoinFound() {
  const fam = useFlow((s) => s.lookupResult);
  const setPending = useFlow((s) => s.setPending);

  if (!fam) {
    return <Redirect href="/join" />;
  }

  function joinAsNew() {
    if (fam) setPending(fam.id);
    router.push('/profile');
  }

  return (
    <Screen scroll={false}>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Text kind="bodyHeavy" size={13} color="#21BA72" style={{ letterSpacing: 1 }}>
          FOUND THEM!
        </Text>
        <View
          style={{
            width: 78,
            height: 78,
            borderRadius: 24,
            backgroundColor: '#21BA72',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 14,
            marginBottom: 12,
            boxShadow: shadow.candy,
          }}
        >
          <Text kind="display" size={38} color={colors.white}>
            {(fam.name.trim()[0] || '?').toUpperCase()}
          </Text>
        </View>
        <Text kind="display" size={28}>
          {fam.name}
        </Text>
        <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginTop: 4 }}>
          {fam.members.length} {fam.members.length === 1 ? 'player' : 'players'}
        </Text>
      </View>

      <Card style={{ marginTop: 22, padding: 18 }}>
        <Text kind="bodyHeavy" size={11} color={colors.faint} style={{ letterSpacing: 0.5, marginBottom: 14 }}>
          WHO'S ALREADY HERE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {fam.members.map((m) => (
            <View
              key={m.id}
              style={{
                backgroundColor: colors.surfaceAlt,
                borderRadius: radius.pill,
                paddingVertical: 8,
                paddingHorizontal: 14,
              }}
            >
              <Text kind="bodyHeavy" size={13.5}>
                {m.name}
              </Text>
            </View>
          ))}
          {fam.members.length === 0 && (
            <Text kind="bodyHeavy" size={13} color={colors.muted}>
              You'll be the first one in!
            </Text>
          )}
        </View>
      </Card>

      <View style={{ flex: 1 }} />
      <PrimaryButton label="Join as a new player" onPress={joinAsNew} />
      <Pressable onPress={() => router.replace('/welcome')} style={{ alignSelf: 'center', marginTop: 12 }}>
        <Text kind="bodyHeavy" size={13.5} color={colors.muted}>
          Not your family? Go back
        </Text>
      </Pressable>
    </Screen>
  );
}
