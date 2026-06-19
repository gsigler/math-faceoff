import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BackButton, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius } from '@/theme';
import { createPlayer } from '@/lib/api';
import { useFlow } from '@/state/flow';
import { useSession } from '@/state/session';
import { qk } from '@/queries/hooks';

export default function Profile() {
  const { pendingFamilyId, reset } = useFlow();
  const { uid } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = name.trim().length > 0;

  async function finish() {
    if (!valid || busy || !pendingFamilyId) return;
    setBusy(true);
    try {
      await createPlayer(pendingFamilyId, name.trim());
      reset();
      if (uid) await qc.invalidateQueries({ queryKey: qk.me(uid) });
      router.replace('/home');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <BackButton onPress={() => router.back()} />
      <Text kind="display" size={28} style={{ marginTop: 18, marginHorizontal: 2 }}>
        Make your player
      </Text>
      <Text kind="bodyHeavy" size={14.5} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 2, marginBottom: 20 }}>
        This is how your family sees you.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.faint}
        maxLength={14}
        style={{
          height: 60,
          borderWidth: 2,
          borderColor: colors.hairline,
          borderRadius: radius.md,
          paddingHorizontal: 18,
          fontFamily: 'Nunito_800ExtraBold',
          fontSize: 20,
          textAlign: 'center',
          color: colors.ink,
          backgroundColor: colors.surface,
        }}
      />

      <View style={{ flex: 1 }} />
      <PrimaryButton label={busy ? 'Setting up…' : 'Start playing →'} disabled={!valid || busy} onPress={finish} />
    </Screen>
  );
}
