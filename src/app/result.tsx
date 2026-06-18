import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Avatar, Card, PrimaryButton, Screen, SecondaryButton, Text } from '@/components/ui';
import { colors, OPERATIONS, radius } from '@/theme';
import { formatTime } from '@/game/facts';
import { finishRound } from '@/lib/api';
import type { FinishResult } from '@/lib/types';
import { useRound } from '@/state/round';
import { useMe, useOperationLeaderboard, qk } from '@/queries/hooks';

export default function Result() {
  const r = useRound();
  const me = useMe();
  const qc = useQueryClient();
  const op = OPERATIONS[r.operation];
  const accent = op.color;
  const isPractice = r.mode === 'practice';

  const [result, setResult] = useState<FinishResult | null>(null);
  const posted = useRef(false);

  // Post the round exactly once.
  useEffect(() => {
    if (posted.current) return;
    posted.current = true;
    const snapshot = useRound.getState();
    (async () => {
      try {
        const res = await finishRound({
          operation: snapshot.operation,
          mode: snapshot.mode,
          score: snapshot.score,
          wrongCount: snapshot.wrongCount,
          practiceNumber: snapshot.mode === 'practice' ? snapshot.practiceNumber : null,
          durationSeconds: snapshot.roundLen,
        });
        setResult(res);
        const fid = me.data?.family_id;
        if (fid) {
          qc.invalidateQueries({ queryKey: qk.weekly(fid) });
          qc.invalidateQueries({ queryKey: qk.records(fid) });
          qc.invalidateQueries({ queryKey: ['opBoard', fid] });
        }
      } catch {
        // Offline / transient: keep the local result on screen.
      }
    })();
  }, [me.data?.family_id, qc]);

  const board = useOperationLeaderboard(me.data?.family_id, r.operation);
  const total = r.score + r.wrongCount;
  const accuracy = total === 0 ? '100%' : `${Math.round((r.score / total) * 100)}%`;
  const label =
    isPractice && r.mode === 'practice'
      ? `${op.name} · ${r.practiceNumber}`
      : op.name;

  function playAgain() {
    r.start(r.operation, r.mode, r.practiceNumber);
    router.replace('/test');
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center' }}>
        <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ letterSpacing: 1 }}>
          {label.toUpperCase()} · TIME'S UP
        </Text>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text kind="displayBold" size={88} color={accent} style={{ lineHeight: 92 }}>
            {r.score}
          </Text>
        </Animated.View>
        <Text kind="bodyHeavy" size={15}>
          correct in {formatTime(r.roundLen)}
        </Text>
      </View>

      {!isPractice && (
        <>
          <View style={{ alignItems: 'center' }}>
            {result?.is_record ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, backgroundColor: colors.goldSoft, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill }}>
                <Text kind="bodyHeavy" size={14} color={colors.goldInk}>
                  ★ New family record!
                </Text>
              </View>
            ) : (
              <Text kind="bodyHeavy" size={14} color={colors.inkSoft} style={{ marginTop: 12, textAlign: 'center' }}>
                {result?.my_rank ? `You're #${result.my_rank} in the family · ` : ''}
                record is {result?.family_best ?? r.score}
              </Text>
            )}
          </View>

          <Card style={{ marginTop: 18, padding: 14 }}>
            <Text kind="display" size={16} style={{ paddingHorizontal: 6, paddingTop: 4, paddingBottom: 12 }}>
              {op.name} · all-time
            </Text>
            <View style={{ gap: 4 }}>
              {(board.data ?? []).map((p, i) => {
                const isMe = p.player_id === me.data?.id;
                return (
                  <View
                    key={p.player_id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 9,
                      paddingHorizontal: 10,
                      borderRadius: radius.sm,
                      backgroundColor: isMe ? colors.highlight : colors.surfaceAlt,
                    }}
                  >
                    <Text kind="display" size={15} color={colors.faint} style={{ width: 18 }}>
                      {i + 1}
                    </Text>
                    <Avatar name={p.name} color={p.color} size={34} />
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text kind="bodyHeavy" size={15}>
                        {isMe ? 'You' : p.name}
                      </Text>
                      {isMe && (
                        <View style={{ backgroundColor: '#21BA72', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill }}>
                          <Text kind="bodyHeavy" size={10} color={colors.white} style={{ letterSpacing: 0.5 }}>
                            YOU
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text kind="display" size={18}>
                      {p.best}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </>
      )}

      {isPractice && (
        <Card style={{ marginTop: 18, padding: 18 }}>
          <Text kind="bodyHeavy" size={12} color={colors.faint} style={{ letterSpacing: 1, textAlign: 'center' }}>
            PRACTICED · {label.toUpperCase()}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Stat value={String(r.score)} caption="solved" color={accent} />
            <Stat value={accuracy} caption="accuracy" color={accent} />
          </View>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <PrimaryButton label="Play again" bg={accent} onPress={playAgain} style={{ flex: 1, height: 54 }} />
        <SecondaryButton label="Done" onPress={() => router.replace('/home')} style={{ flex: 1, height: 54 }} />
      </View>
    </Screen>
  );
}

function Stat({ value, caption, color }: { value: string; caption: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 16, alignItems: 'center' }}>
      <Text kind="displayBold" size={38} color={color} style={{ lineHeight: 40 }}>
        {value}
      </Text>
      <Text kind="bodyHeavy" size={12} color={colors.muted} style={{ marginTop: 6 }}>
        {caption}
      </Text>
    </View>
  );
}
