import { type DimensionValue, Pressable, View } from 'react-native';
import { OpBadge, ProgressBar, Text } from '@/components/ui';
import {
  colors,
  OPERATION_ORDER,
  OPERATIONS,
  radius,
  shadow,
  withAlpha,
  type OperationDef,
  type OperationKey,
} from '@/theme';
import type { RecordRow, WeeklyOpRow } from '@/lib/types';

export type Size = 'compact' | 'wide';

/** Candy operation button. The subtitle leads with your own best, then the
 *  family record so you can see how you stack up at a glance. */
export function OperationCard({
  op,
  record,
  myBest,
  onPress,
  basis,
  showRecord = true,
}: {
  op: OperationDef;
  record?: RecordRow;
  myBest?: number;
  onPress: () => void;
  basis: DimensionValue;
  showRecord?: boolean;
}) {
  const subtitle =
    myBest != null
      ? `You ${myBest}${record ? ` · Record ${record.best}` : ''}`
      : record
        ? `Record ${record.best} · ${record.holder_name}`
        : 'No record yet';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: basis,
        backgroundColor: op.color,
        borderRadius: 24,
        padding: 18,
        boxShadow: `${shadow.candy}, 0px 12px 22px ${withAlpha(op.color, 0.32)}`,
        opacity: pressed ? 0.94 : 1,
        gap: 5,
      })}
    >
      <Text kind="display" size={44} color={colors.white} style={{ lineHeight: 46 }}>
        {op.sym}
      </Text>
      <Text kind="bodyHeavy" size={17} color={colors.white}>
        {op.name}
      </Text>
      {showRecord && (
        <Text kind="bodyHeavy" size={12} color={withAlpha(colors.white, 0.92)}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Weekly standings split per operation. A player appears under each operation
 * they played this week. Colour belongs to the operation: the section header and
 * every bar under it share the operation's colour. People have no colour.
 */
export function WeeklyByOperation({
  rows,
  meId,
  size = 'compact',
}: {
  rows: WeeklyOpRow[];
  meId?: string;
  size?: Size;
}) {
  if (rows.length === 0) {
    return (
      <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ paddingVertical: 8 }}>
        No scores yet this week — play a Faceoff to get on the board.
      </Text>
    );
  }
  const wide = size === 'wide';
  const byOp = new Map<OperationKey, WeeklyOpRow[]>();
  rows.forEach((r) => {
    const list = byOp.get(r.operation) ?? [];
    list.push(r);
    byOp.set(r.operation, list);
  });
  const sections = OPERATION_ORDER.filter((k) => byOp.has(k));

  return (
    <View style={{ gap: wide ? 22 : 18 }}>
      {sections.map((key) => {
        const op = OPERATIONS[key];
        const list = (byOp.get(key) ?? []).slice().sort((a, b) => b.points - a.points);
        const max = Math.max(1, ...list.map((r) => r.points));
        return (
          <View key={key} style={{ gap: wide ? 13 : 11 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <OpBadge sym={op.sym} size={wide ? 28 : 24} symSize={wide ? 19 : 16} bg={op.color} />
              <Text kind="bodyHeavy" size={wide ? 15 : 14} color={op.color}>
                {op.name}
              </Text>
            </View>
            {list.map((r, i) => (
              <WeeklyRow key={r.player_id} row={r} rank={i + 1} max={max} isMe={r.player_id === meId} wide={wide} accent={op.color} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function WeeklyRow({
  row,
  rank,
  max,
  isMe,
  wide,
  accent,
}: {
  row: WeeklyOpRow;
  rank: number;
  max: number;
  isMe: boolean;
  wide: boolean;
  accent: string;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: wide ? 14 : 11 },
        isMe && {
          backgroundColor: colors.highlight,
          marginHorizontal: wide ? -10 : -8,
          paddingHorizontal: wide ? 10 : 8,
          paddingVertical: wide ? 8 : 6,
          borderRadius: radius.sm,
        },
      ]}
    >
      <Text kind="display" size={wide ? 17 : 14} color={rank === 1 ? colors.gold : colors.faint} style={{ width: wide ? 18 : 14 }}>
        {rank}
      </Text>
      <View style={{ flex: 1 }}>
        <Text kind="bodyHeavy" size={wide ? 16 : 14} style={{ marginBottom: wide ? 6 : 4 }}>
          {isMe ? 'You' : row.name}
        </Text>
        <ProgressBar pct={(row.points / max) * 100} color={accent} track={isMe ? colors.surface : colors.track} height={wide ? 8 : 6} />
      </View>
      <Text kind="display" size={wide ? 18 : 15}>
        {row.points.toLocaleString()}
      </Text>
    </View>
  );
}
