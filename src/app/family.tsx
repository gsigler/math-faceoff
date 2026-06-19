import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { BackButton, PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';
import { useMe } from '@/queries/hooks';

export default function Family() {
  const me = useMe();
  const [copied, setCopied] = useState(false);

  const name = me.data?.family.name ?? '';
  const code = me.data?.family.code ?? '';
  const chars = code.replace('-', '').split('');

  async function copy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    try {
      await Share.share({
        message: `Join ${name} on Fact Faceoff! Our family code is ${code}.`,
      });
    } catch {
      // Share unavailable (e.g. web) — fall back to copying the code.
      await copy();
    }
  }

  return (
    <Screen scroll={false}>
      <BackButton onPress={() => router.back()} />

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <Text kind="bodyHeavy" size={13} color={colors.faint} style={{ letterSpacing: 1 }}>
          FAMILY CODE
        </Text>
        <Text kind="display" size={28} style={{ marginTop: 6 }}>
          {name || '…'}
        </Text>
        <Text kind="bodyHeavy" size={14.5} color={colors.muted} style={{ marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          Share this code so your family can join.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 26, marginBottom: 10 }}>
        {chars.map((ch, i) => (
          <View
            key={i}
            style={{
              width: 38,
              height: 52,
              borderRadius: radius.sm,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadow.candySm,
            }}
          >
            <Text kind="display" size={26}>
              {ch}
            </Text>
          </View>
        ))}
      </View>
      <Text kind="display" size={18} color="#21BA72" style={{ textAlign: 'center', letterSpacing: 2 }}>
        {code}
      </Text>

      <Pressable
        onPress={copy}
        style={({ pressed }) => ({
          alignSelf: 'center',
          marginTop: 16,
          height: 42,
          paddingHorizontal: 20,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text kind="bodyHeavy" size={14}>
          {copied ? 'Copied!' : 'Copy code'}
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <Text size={12.5} color={colors.faint} style={{ textAlign: 'center', marginBottom: 14 }}>
        Anyone with this code can join your family.
      </Text>
      <PrimaryButton label="Share code" onPress={share} />
    </Screen>
  );
}
