import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius } from '@/theme';
import { lookupFamily } from '@/lib/api';
import { useFlow } from '@/state/flow';

export default function JoinCode() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const setLookupResult = useFlow((s) => s.setLookupResult);

  async function submit() {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const fam = await lookupFamily(code.trim());
      if (fam) {
        setLookupResult(fam);
        router.push('/join/found');
      } else {
        setError(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <BackButton onPress={() => router.back()} />
      <Text kind="display" size={28} style={{ marginTop: 22, marginHorizontal: 2 }}>
        Enter your family code
      </Text>
      <Text kind="bodyHeavy" size={14.5} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 4, marginBottom: 22, lineHeight: 20 }}>
        Ask a family member for the code they got when they made the family.
      </Text>
      <TextInput
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          setError(false);
        }}
        placeholder="MANGO-42"
        placeholderTextColor={colors.faint}
        autoCapitalize="characters"
        maxLength={10}
        style={{
          height: 64,
          borderWidth: 2,
          borderColor: error ? colors.danger : colors.hairline,
          borderRadius: radius.md,
          paddingHorizontal: 18,
          fontFamily: 'Fredoka_600SemiBold',
          fontSize: 26,
          letterSpacing: 4,
          textAlign: 'center',
          color: colors.ink,
          backgroundColor: colors.surface,
        }}
      />
      {error && (
        <Text kind="bodyHeavy" size={13.5} color={colors.danger} style={{ marginTop: 12, textAlign: 'center' }}>
          Hmm — no family with that code. Check it and try again.
        </Text>
      )}
      <Pressable onPress={() => setCode('MANGO-42')} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ textDecorationLine: 'underline' }}>
          Use demo code · MANGO-42
        </Text>
      </Pressable>
      <View style={{ flex: 1 }} />
      <PrimaryButton label={busy ? 'Finding…' : 'Find my family'} disabled={busy} onPress={submit} />
    </Screen>
  );
}
