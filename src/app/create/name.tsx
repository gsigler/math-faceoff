import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius } from '@/theme';
import { createFamily } from '@/lib/api';
import { useFlow } from '@/state/flow';

export default function CreateName() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const setCreatedFamily = useFlow((s) => s.setCreatedFamily);
  const valid = name.trim().length > 0;

  async function confirm() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const fam = await createFamily(name.trim());
      setCreatedFamily(fam);
      router.push('/create/code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <BackButton onPress={() => router.back()} />
      <Text kind="display" size={28} style={{ marginTop: 22, marginHorizontal: 2 }}>
        Name your family
      </Text>
      <Text kind="bodyHeavy" size={14.5} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 4, marginBottom: 22, lineHeight: 20 }}>
        Pick something everyone knows — you can change it later.
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="The Riveras"
        placeholderTextColor={colors.faint}
        maxLength={20}
        style={{
          height: 60,
          borderWidth: 2,
          borderColor: colors.hairline,
          borderRadius: radius.md,
          paddingHorizontal: 18,
          fontFamily: 'Nunito_800ExtraBold',
          fontSize: 20,
          color: colors.ink,
          backgroundColor: colors.surface,
        }}
      />
      <View style={{ flex: 1 }} />
      <PrimaryButton label={busy ? 'Creating…' : 'Create family'} disabled={!valid || busy} onPress={confirm} />
    </Screen>
  );
}
