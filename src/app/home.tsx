import { type DimensionValue, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Screen, Text } from '@/components/ui';
import { OperationCard, RecordsGrid, WeeklyByOperation } from '@/components/boards';
import { colors, OPERATION_ORDER, OPERATIONS, radius, shadow, type OperationKey } from '@/theme';
import { useLayout } from '@/theme/responsive';
import { useFlow } from '@/state/flow';
import { useAllTimeRecords, useLeaderboardRealtime, useMe, useWeeklyByOperation } from '@/queries/hooks';
import type { RecordRow } from '@/lib/types';

function weekOfLabel(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export default function Home() {
  const me = useMe();
  const { isTablet } = useLayout();
  const setOperation = useFlow((s) => s.setOperation);
  const familyId = me.data?.family_id;

  useLeaderboardRealtime(familyId);
  const weekly = useWeeklyByOperation(familyId);
  const records = useAllTimeRecords(familyId);

  const recordByOp = new Map<OperationKey, RecordRow>();
  records.data?.forEach((r) => recordByOp.set(r.operation, r));

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
        onPress={() => choose(key)}
        basis={basis}
        showRecord={showRecord}
      />
    ));

  // ─── iPad dashboard ──────────────────────────────────────────────────────
  if (isTablet) {
    return (
      <Screen wide>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }}>
          <View>
            <Text kind="bodyHeavy" size={13} color={colors.faint} style={{ letterSpacing: 1 }}>
              FAMILY MATH FACEOFF
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <View style={{ width: 16, height: 16, borderRadius: radius.pill, backgroundColor: me.data?.color ?? '#21BA72' }} />
              <Text kind="display" size={42}>
                {me.data?.family.name ?? '…'}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 18, boxShadow: shadow.chip }}>
            <Text kind="bodyHeavy" size={15}>
              {weekOfLabel()}
            </Text>
          </View>
        </View>

        <Text kind="bodyHeavy" size={14} color={colors.muted} style={{ marginBottom: 14 }}>
          Pick an operation to play
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>{operationCards('22%', false)}</View>

        <View style={{ flexDirection: 'row', gap: 24, marginTop: 24 }}>
          <Card style={{ flex: 1, padding: 22, borderRadius: 26 }}>
            <Text kind="display" size={22} style={{ marginBottom: 18 }}>
              This week · by operation
            </Text>
            <WeeklyByOperation rows={weekly.data ?? []} meId={me.data?.id} size="wide" />
          </Card>
          <Card style={{ flex: 1, padding: 22, borderRadius: 26 }}>
            <Text kind="display" size={22} style={{ marginBottom: 18 }}>
              All-time records
            </Text>
            <RecordsGrid records={recordByOp} />
            <View style={{ marginTop: 16, backgroundColor: '#FFFBEF', borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text kind="displayBold" size={15} color={colors.goldInk}>
                ★
              </Text>
              <Text kind="bodyHeavy" size={13.5} color="#7a6420" style={{ flex: 1, lineHeight: 19 }}>
                Beat a record in Faceoff and your name takes over the card here.
              </Text>
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  // ─── iPhone ──────────────────────────────────────────────────────────────
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text kind="display" size={26}>
          Faceoff
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, boxShadow: shadow.chip }}>
          <View style={{ width: 18, height: 18, borderRadius: radius.pill, backgroundColor: me.data?.color ?? '#21BA72' }} />
          <Text kind="bodyHeavy" size={13}>
            {me.data?.family.name ?? '…'}
          </Text>
        </View>
      </View>
      <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ marginBottom: 18 }}>
        Pick an operation to play
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{operationCards('47%', true)}</View>

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
    </Screen>
  );
}
