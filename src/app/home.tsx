import { type DimensionValue, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Screen, Text } from '@/components/ui';
import { OperationCard, WeeklyByOperation } from '@/components/boards';
import { badgeDefs } from '@/components/badges';
import { StarIcon } from '@/components/icons';
import { isStreakAtRisk, StreakAtRiskCard, StreakChip } from '@/components/streak';
import { colors, OPERATION_ORDER, OPERATIONS, radius, shadow, type OperationKey } from '@/theme';
import { useLayout } from '@/theme/responsive';
import { useFlow } from '@/state/flow';
import {
  useAllTimeRecords,
  useLeaderboardRealtime,
  useMe,
  useMyBadges,
  useMyOperationBests,
  useMyStreak,
  useWeeklyByOperation,
} from '@/queries/hooks';
import type { RecordRow } from '@/lib/types';

/** Family chip: the family name on a candy-shadowed pill. Opens the share
 *  screen. Lives on the right of the header, like the phone layout. */
function FamilyButton({ name, nameSize = 13 }: { name: string; nameSize?: number }) {
  return (
    <Pressable
      onPress={() => router.push('/family')}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingVertical: 8,
        paddingHorizontal: 16,
        boxShadow: shadow.candy,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text kind="bodyHeavy" size={nameSize}>
        {name || '…'}
      </Text>
    </Pressable>
  );
}

/** Small pill under the greeting that makes the badge shelf discoverable —
 *  a plain tap on the name has no visual affordance, so this is the one
 *  clearly-tappable element that leads there. Shows the earned count as a
 *  hook ("3 badges") rather than a bare icon. */
function BadgesButton({ count, onPress }: { count: number | undefined; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: colors.goldSoft,
        borderRadius: radius.pill,
        paddingVertical: 6,
        paddingHorizontal: 12,
        boxShadow: shadow.chip,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <StarIcon size={14} color={colors.gold} />
      <Text kind="bodyHeavy" size={12} color={colors.goldInk}>
        {count == null ? 'Badges' : `${count} badge${count === 1 ? '' : 's'}`}
      </Text>
    </Pressable>
  );
}

/** Streak chip, or its at-risk variant once it's past 6pm with today unplayed.
 *  Renders nothing until the streak query resolves, to avoid a layout jump. */
function StreakSection({ streak, onPress }: { streak: ReturnType<typeof useMyStreak>; onPress: () => void }) {
  if (!streak.data) return null;
  return isStreakAtRisk(streak.data) ? (
    <StreakAtRiskCard current_streak={streak.data.current_streak} onPress={onPress} />
  ) : (
    <StreakChip streak={streak.data} onPress={onPress} />
  );
}

/** Quiet footer link into the About / support-the-creator screen. */
function AboutLink() {
  return (
    <Pressable
      onPress={() => router.push('/about')}
      hitSlop={8}
      style={({ pressed }) => ({ alignSelf: 'center', marginTop: 18, paddingVertical: 6, opacity: pressed ? 0.6 : 1 })}
    >
      <Text kind="bodyHeavy" size={13} color={colors.faint}>
        About Fact Faceoff
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const me = useMe();
  const { isTablet } = useLayout();
  const setOperation = useFlow((s) => s.setOperation);
  const familyId = me.data?.family_id;
  const greeting = me.data?.name ? `Hi, ${me.data.name}!` : 'Hi!';

  useLeaderboardRealtime(familyId);
  const weekly = useWeeklyByOperation(familyId);
  const records = useAllTimeRecords(familyId);
  const myBests = useMyOperationBests(me.data?.id);
  const streak = useMyStreak(me.data?.id);
  const badges = useMyBadges(me.data?.id);
  const earnedBadges = badges.data ? badgeDefs(badges.data).filter((d) => d.earned).length : undefined;

  function goToBadges() {
    router.push('/badges');
  }

  const recordByOp = new Map<OperationKey, RecordRow>();
  records.data?.forEach((r) => recordByOp.set(r.operation, r));

  const myBestByOp = new Map<OperationKey, number>();
  myBests.data?.forEach((r) => myBestByOp.set(r.operation, r.best));

  function choose(op: OperationKey) {
    setOperation(op);
    router.push('/mode');
  }

  const operationCards = (basis: DimensionValue, showRecord: boolean) =>
    OPERATION_ORDER.map((key) => (
      <OperationCard
        key={key}
        op={OPERATIONS[key]}
        record={recordByOp.get(key)}
        myBest={myBestByOp.get(key)}
        onPress={() => choose(key)}
        basis={basis}
        showRecord={showRecord}
      />
    ));

  // ─── iPad dashboard ──────────────────────────────────────────────────────
  if (isTablet) {
    return (
      <Screen wide>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text kind="bodyHeavy" size={13} color={colors.faint} style={{ letterSpacing: 1 }}>
              FAMILY MATH FACEOFF
            </Text>
            <Text kind="display" size={42} style={{ marginTop: 2 }}>
              {greeting}
            </Text>
          </View>
          <FamilyButton name={me.data?.family.name ?? ''} nameSize={15} />
        </View>

        <View style={{ marginBottom: 20 }}>
          <BadgesButton count={earnedBadges} onPress={goToBadges} />
        </View>

        <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginBottom: 14 }}>
          Pick an operation to play
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{operationCards('22%', true)}</View>

        <View style={{ marginTop: 24 }}>
          <StreakSection streak={streak} onPress={goToBadges} />
        </View>

        <Card style={{ marginTop: 24, padding: 22, borderRadius: 26 }}>
          <Text kind="display" size={22} style={{ marginBottom: 18 }}>
            This week · by operation
          </Text>
          <WeeklyByOperation rows={weekly.data ?? []} meId={me.data?.id} size="wide" />
        </Card>

        <AboutLink />
      </Screen>
    );
  }

  // ─── iPhone ──────────────────────────────────────────────────────────────
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text kind="display" size={26}>
          {greeting}
        </Text>
        <FamilyButton name={me.data?.family.name ?? ''} />
      </View>

      <View style={{ marginTop: 10, marginBottom: 4 }}>
        <BadgesButton count={earnedBadges} onPress={goToBadges} />
      </View>

      <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ marginTop: 14, marginBottom: 18 }}>
        Pick an operation to play
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{operationCards('47%', true)}</View>

      <View style={{ marginTop: 16 }}>
        <StreakSection streak={streak} onPress={goToBadges} />
      </View>

      <Card style={{ marginTop: 16, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text kind="display" size={17}>
            This week
          </Text>
          <Text kind="bodyHeavy" size={11} color={colors.faint} style={{ letterSpacing: 0.5 }}>
            BY OPERATION
          </Text>
        </View>
        <WeeklyByOperation rows={weekly.data ?? []} meId={me.data?.id} size="compact" />
      </Card>

      <AboutLink />
    </Screen>
  );
}
