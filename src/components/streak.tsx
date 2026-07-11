import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { CheckIcon, DiamondIcon, FlameIcon } from '@/components/icons';
import { colors, radius, shadow } from '@/theme';
import { localDateString } from '@/lib/date';
import type { StreakDay, StreakInfo } from '@/lib/types';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Sun=0..Sat=6 -> Mon=0..Sun=6, matching DAY_LABELS. */
function weekdayIndex(dateStr: string): number {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return (day + 6) % 7;
}

function StreakCalendarRow({ calendar }: { calendar: StreakDay[] }) {
  const today = localDateString(new Date());
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
      {calendar.map((d) => {
        const isToday = d.date === today;
        const cellStyle =
          d.status === 'played'
            ? { bg: colors.success, border: 'transparent' }
            : d.status === 'frozen'
              ? { bg: '#EAF4FD', border: 'transparent' }
              : { bg: colors.surfaceAlt, border: isToday ? colors.faint : 'transparent' };
        return (
          <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: '100%',
                height: 34,
                borderRadius: 9,
                backgroundColor: cellStyle.bg,
                borderWidth: isToday ? 1.5 : 0,
                borderColor: cellStyle.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {d.status === 'played' && <CheckIcon size={14} color={colors.white} />}
              {d.status === 'frozen' && <DiamondIcon size={12} color="#2E90E0" />}
            </View>
            <Text kind="bodyHeavy" size={10} color={colors.faint}>
              {DAY_LABELS[weekdayIndex(d.date)]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Streak chip: flame + day count + freeze bank, with the 7-day calendar
 *  underneath. Lives on Home, above the operation grid. Tapping it opens
 *  the badge shelf. */
export function StreakChip({ streak, onPress }: { streak: StreakInfo; onPress?: () => void }) {
  const { current_streak, freezes_remaining, calendar } = streak;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 18,
        boxShadow: shadow.card,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <FlameIcon size={20} color="#F0913A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text kind="display" size={19} style={{ lineHeight: 22 }}>
            {current_streak === 0 ? 'Start a streak' : `${current_streak}-day streak`}
          </Text>
          <Text kind="bodyHeavy" size={12} color={colors.muted} style={{ marginTop: 2 }}>
            {current_streak === 0 ? 'Play a Faceoff round today' : `Play today to make it ${current_streak + 1}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <DiamondIcon size={13} color="#2E90E0" />
          <Text kind="bodyHeavy" size={13} color={colors.muted}>
            {freezes_remaining}
          </Text>
        </View>
      </View>
      <StreakCalendarRow calendar={calendar} />
    </Pressable>
  );
}

/** Warning card shown after 6pm local time if today's slot is still unplayed.
 *  Disappears the moment a round is completed today. */
export function StreakAtRiskCard({ current_streak, onPress }: { current_streak: number; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, boxShadow: shadow.card, opacity: pressed ? 0.95 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE9E9', alignItems: 'center', justifyContent: 'center' }}>
          <Text kind="display" size={20} color={colors.danger}>
            !
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text kind="display" size={16}>
            Streak at risk
          </Text>
          <Text kind="bodyHeavy" size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {current_streak > 0
              ? `${current_streak} day${current_streak === 1 ? '' : 's'} and counting — one Faceoff round keeps it alive.`
              : 'Play a Faceoff round to start a new streak.'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Should the at-risk card show? Pure client check: evening + today unplayed. */
export function isStreakAtRisk(streak: StreakInfo | undefined): boolean {
  if (!streak) return false;
  const today = localDateString(new Date());
  const todayEntry = streak.calendar.find((d) => d.date === today);
  return new Date().getHours() >= 18 && todayEntry?.status !== 'played';
}
