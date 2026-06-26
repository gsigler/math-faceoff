import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Card, Screen, Text } from '@/components/ui';
import { colors, OPERATIONS, radius, shadow, withAlpha } from '@/theme';
import { useFlow } from '@/state/flow';
import { useRound } from '@/state/round';
import { useMe, useMyAttempts } from '@/queries/hooks';
import type { AttemptRow } from '@/lib/types';

export default function Mode() {
  const opKey = useFlow((s) => s.selectedOperation);
  const op = OPERATIONS[opKey];
  const start = useRound((s) => s.start);
  const me = useMe();
  const attempts = useMyAttempts(me.data?.id, opKey);
  const runs = attempts.data ?? [];
  const myBest = runs.reduce((m, r) => Math.max(m, r.score), 0);

  function startFaceoff() {
    start(opKey, 'faceoff');
    router.push('/test');
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton onPress={() => router.back()} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            backgroundColor: op.color,
            paddingVertical: 7,
            paddingLeft: 12,
            paddingRight: 16,
            borderRadius: radius.pill,
          }}
        >
          <Text kind="display" size={18} color={colors.white}>
            {op.sym}
          </Text>
          <Text kind="bodyHeavy" size={14} color={colors.white}>
            {op.name}
          </Text>
        </View>
      </View>

      <Text kind="display" size={26} style={{ marginTop: 22, marginHorizontal: 2 }}>
        How do you want to play?
      </Text>
      <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginHorizontal: 2, marginTop: 4, marginBottom: 20 }}>
        {op.name} · choose a mode
      </Text>

      <View style={{ gap: 14 }}>
        <Pressable
          onPress={startFaceoff}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            backgroundColor: op.color,
            borderRadius: 24,
            padding: 22,
            boxShadow: shadow.candy,
            opacity: pressed ? 0.94 : 1,
          })}
        >
          <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: withAlpha(colors.white, 0.22), alignItems: 'center', justifyContent: 'center' }}>
            <Text size={28} color={colors.white}>
              ★
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text kind="display" size={24} color={colors.white}>
              Faceoff
            </Text>
            <Text kind="bodyHeavy" size={13.5} color={withAlpha(colors.white, 0.95)} style={{ marginTop: 6, lineHeight: 18 }}>
              Race the 2:00 clock on facts 1–12. Your score posts to the family board.
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/pick')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 22,
            boxShadow: shadow.card,
            opacity: pressed ? 0.94 : 1,
          })}
        >
          <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: '#FFF1DA', alignItems: 'center', justifyContent: 'center' }}>
            <Text kind="display" size={30} color={op.color}>
              {op.sym}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text kind="display" size={24}>
              Practice
            </Text>
            <Text kind="bodyHeavy" size={13.5} color={colors.inkSoft} style={{ marginTop: 6, lineHeight: 18 }}>
              Pick a number and drill it. Just for you — practice runs don't post to the board.
            </Text>
          </View>
        </Pressable>
      </View>

      <Card style={{ marginTop: 18, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text kind="display" size={17}>
            Your attempts
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text kind="bodyHeavy" size={11} color={colors.faint} style={{ letterSpacing: 0.5 }}>
              YOUR BEST
            </Text>
            <Text kind="displayBold" size={22} color={op.color} style={{ lineHeight: 24 }}>
              {runs.length ? myBest : '—'}
            </Text>
          </View>
        </View>

        {runs.length === 0 ? (
          <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ paddingVertical: 8 }}>
            No faceoff runs yet — play one to start your streak.
          </Text>
        ) : (
          <View style={{ gap: 4 }}>
            {runs.map((run) => (
              <AttemptRowView key={run.id} run={run} isBest={run.score === myBest} accent={op.color} />
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

function AttemptRowView({ run, isBest, accent }: { run: AttemptRow; isBest: boolean; accent: string }) {
  const total = run.score + run.wrong_count;
  const accuracy = total === 0 ? '100%' : `${Math.round((run.score / total) * 100)}%`;
  const date = new Date(run.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: radius.sm,
        backgroundColor: isBest ? colors.highlight : colors.surfaceAlt,
      }}
    >
      <Text kind="bodyHeavy" size={14} style={{ width: 56 }}>
        {date}
      </Text>
      <View style={{ flex: 1 }}>
        <Text kind="bodyHeavy" size={12.5} color={colors.muted}>
          {accuracy} accuracy
        </Text>
      </View>
      {isBest && (
        <View style={{ backgroundColor: accent, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill }}>
          <Text kind="bodyHeavy" size={10} color={colors.white} style={{ letterSpacing: 0.5 }}>
            BEST
          </Text>
        </View>
      )}
      <Text kind="display" size={18}>
        {run.score}
      </Text>
    </View>
  );
}
