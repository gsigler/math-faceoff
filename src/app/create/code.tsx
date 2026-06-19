import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { PrimaryButton, Screen, Text } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';
import { useFlow } from '@/state/flow';

export default function CreateCode() {
  const createdFamily = useFlow((s) => s.createdFamily);
  const setPending = useFlow((s) => s.setPending);
  const [copied, setCopied] = useState(false);

  const code = createdFamily?.code ?? '';
  const chars = code.replace('-', '').split('');

  async function copy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function next() {
    if (createdFamily) setPending(createdFamily.id);
    router.push('/profile');
  }

  return (
    <Screen scroll={false}>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View
          style={{
            width: 66,
            height: 66,
            borderRadius: 20,
            backgroundColor: colors.goldSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text size={34} color={colors.gold}>
            ★
          </Text>
        </View>
        <Text kind="display" size={26}>
          Your family is ready!
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
      <PrimaryButton label="Set up my player →" onPress={next} />
    </Screen>
  );
}
