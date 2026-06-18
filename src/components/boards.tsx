import { type DimensionValue, Pressable, View } from 'react-native';
import { Avatar, ProgressBar, Text } from '@/components/ui';
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
import type { RecordRow, WeeklyRow } from '@/lib/types';

export type Size = 'compact' | 'wide';

/** Candy operation button. On phone it shows the record subtitle. */
export function OperationCard({
  op,
  record,
  onPress,
  basis,
  showRecord = true,
}: {
  op: OperationDef;
  record?: RecordRow;
  onPress: () => void;
  basis: DimensionValue;
  showRecord?: boolean;
}) {
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
          {record ? `Record ${record.best} · ${record.holder_name}` : 'No record yet'}
        </Text>
      )}
    </Pressable>
  );
}

/** Ranked weekly "Total points" rows with bars. */
export function WeeklyBoard({
  rows,
  meId,
  size = 'compact',
}: {
  rows: WeeklyRow[];
  meId?: string;
  size?: Size;
}) {
  if (rows.length === 0) {
    return (
      <Text kind="bodyHeavy" size={13.5} color={colors.muted} style={{ paddingVertical: 8 }}>
        No points yet this week — play a Faceoff to get on the board.
      </Text>
    );
  }
  const wide = size === 'wide';
  const avatar = wide ? 42 : 32;
  const nameSize = wide ? 17 : 14;
  const scoreSize = wide ? 19 : 15;
  const barH = wide ? 8 : 6;
  const gap = wide ? 18 : 13;
  const max = Math.max(1, ...rows.map((r) => r.points));

  return (
    <View style={{ gap }}>
      {rows.map((r, i) => {
        const isMe = r.player_id === meId;
        return (
          <View
            key={r.player_id}
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
            <Text kind="display" size={wide ? 18 : 15} color={i === 0 ? colors.gold : colors.faint} style={{ width: wide ? 18 : 14 }}>
              {i + 1}
            </Text>
            <Avatar name={r.name} color={r.color} size={avatar} />
            <View style={{ flex: 1 }}>
              <Text kind="bodyHeavy" size={nameSize} style={{ marginBottom: wide ? 6 : 4 }}>
                {isMe ? 'You' : r.name}
              </Text>
              <ProgressBar pct={(r.points / max) * 100} color={r.color} track={isMe ? colors.surface : colors.track} height={barH} />
            </View>
            <Text kind="display" size={scoreSize}>
              {r.points.toLocaleString()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** 2×2 grid of all-time record cards (iPad dashboard). */
export function RecordsGrid({ records }: { records: Map<OperationKey, RecordRow> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {OPERATION_ORDER.map((key) => {
        const op = OPERATIONS[key];
        const rec = records.get(key);
        return (
          <View
            key={key}
            style={{
              flexGrow: 1,
              flexBasis: '45%',
              borderRadius: 20,
              backgroundColor: op.tint,
              borderWidth: 2,
              borderColor: op.tintBorder,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: op.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text kind="display" size={24} color={colors.white}>
                  {op.sym}
                </Text>
              </View>
              <Text kind="bodyHeavy" size={14}>
                {op.name}
              </Text>
            </View>
            <Text kind="displayBold" size={38} color={op.color} style={{ lineHeight: 40 }}>
              {rec ? rec.best : '—'}
            </Text>
            <Text kind="bodyHeavy" size={13} color={colors.inkSoft} style={{ marginTop: 4 }}>
              {rec ? `held by ${rec.holder_name}` : 'No record yet'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
