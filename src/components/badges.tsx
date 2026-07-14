import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { BarsIcon, CheckIcon, FlameIcon, LockIcon, MoonIcon, OpsGridIcon, StarIcon, SunIcon, TargetIcon } from '@/components/icons';
import { colors, radius } from '@/theme';
import type { Badges } from '@/lib/types';

interface BadgeDef {
  id: string;
  name: string;
  bg: string;
  fg: string;
  icon: (color: string) => ReactNode;
  earned: boolean;
  requirement: string;
}

/** Builds the fixed 8-badge shelf from a `my_badges()` response. Locked
 *  badges never reveal their real icon — only earned ones do, so kids can't
 *  peek at "mystery" art, just the requirement text. */
export function badgeDefs(badges: Badges): BadgeDef[] {
  const streak7 = badges.streak_7.earned;
  const streak30 = badges.streak_30.earned;
  const solved100 = badges.solved_100.earned;
  return [
    {
      id: 'perfect_drill',
      name: 'Perfect drill',
      bg: colors.goldSoft,
      fg: colors.gold,
      icon: (c) => <StarIcon size={30} color={c} />,
      earned: badges.perfect_drill,
      requirement: 'Finish a Practice drill with zero mistakes',
    },
    {
      id: 'streak_7',
      name: '7-day streak',
      bg: '#FFE7D3',
      fg: '#F0913A',
      icon: (c) => <FlameIcon size={30} color={c} />,
      earned: streak7,
      requirement: badges.streak_7.progress ? `${badges.streak_7.progress} days to go` : 'Play 7 days in a row',
    },
    {
      id: 'family_record',
      name: 'Family record',
      bg: '#E3F7EC',
      fg: colors.success,
      icon: (c) => (
        <Text kind="displayBold" size={26} color={c}>
          1
        </Text>
      ),
      earned: badges.family_record,
      requirement: 'Set a new family Faceoff record',
    },
    {
      id: 'streak_30',
      name: '30-day streak',
      bg: '#FFE7D3',
      fg: '#F0913A',
      icon: (c) => <FlameIcon size={30} color={c} />,
      earned: streak30,
      requirement: badges.streak_30.progress ? `${badges.streak_30.progress} days to go` : 'Play 30 days in a row',
    },
    {
      id: 'all_4_ops',
      name: 'All 4 operations',
      bg: '#EAF4FD',
      fg: '#2E90E0',
      icon: (c) => <CheckIcon size={26} color={c} />,
      earned: badges.all_4_ops,
      requirement: 'Drill each operation once',
    },
    {
      id: 'solved_100',
      name: '100 solved',
      bg: '#F8F1FD',
      fg: '#B25CE0',
      icon: (c) => <CheckIcon size={26} color={c} />,
      earned: solved100,
      requirement: badges.solved_100.progress ? `${badges.solved_100.progress} to go` : 'Solve 100 problems total',
    },
    {
      id: 'early_bird',
      name: 'Early bird',
      bg: '#FEF5EC',
      fg: '#F08A37',
      icon: (c) => <SunIcon size={26} color={c} />,
      earned: badges.early_bird,
      requirement: 'Play before 8am',
    },
    {
      id: 'family_champion',
      name: 'Family champion',
      bg: colors.goldSoft,
      fg: colors.goldInk,
      icon: (c) => <StarIcon size={30} color={c} />,
      earned: badges.family_champion,
      requirement: '#1 on all 4 boards',
    },
    {
      id: 'night_owl',
      name: 'Night owl',
      bg: '#EDEBFB',
      fg: '#7C6CE0',
      icon: (c) => <MoonIcon size={26} color={c} bg="#EDEBFB" />,
      earned: badges.night_owl,
      requirement: 'Play after 9pm',
    },
    {
      id: 'sharpshooter',
      name: 'Sharpshooter',
      bg: '#FDECEC',
      fg: '#E0524A',
      icon: (c) => <TargetIcon size={28} color={c} />,
      earned: badges.sharpshooter,
      requirement: 'Zero misses in a Faceoff round',
    },
    {
      id: 'marathoner',
      name: 'Marathoner',
      bg: '#FFEEE0',
      fg: '#E0662E',
      icon: (c) => <BarsIcon size={28} color={c} />,
      earned: badges.marathoner,
      requirement: '5 Faceoff rounds in one day',
    },
    {
      id: 'all_rounder',
      name: 'All-rounder',
      bg: '#F3F0FF',
      fg: '#7C5CE0',
      icon: () => <OpsGridIcon size={26} />,
      earned: badges.all_rounder,
      requirement: 'Faceoff every operation once',
    },
  ];
}

export function BadgeTile({ def, size = 72 }: { def: BadgeDef; size?: number }) {
  const bg = def.earned ? def.bg : colors.surfaceAlt;
  const fg = def.earned ? def.fg : colors.faint;
  return (
    <View style={{ alignItems: 'center', gap: 10, width: size + 30 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius.xl,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: def.earned ? 0 : 2,
          borderColor: '#dcdfe4',
          borderStyle: def.earned ? 'solid' : 'dashed',
        }}
      >
        {def.earned ? def.icon(fg) : <LockIcon size={26} color={fg} />}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text kind="display" size={13.5} color={def.earned ? colors.ink : colors.faint} style={{ textAlign: 'center' }}>
          {def.name}
        </Text>
        {def.earned && (
          <View style={{ marginTop: 5, backgroundColor: def.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill }}>
            <Text kind="bodyHeavy" size={10} color={def.fg} style={{ letterSpacing: 0.4 }}>
              EARNED
            </Text>
          </View>
        )}
        <Text
          kind="bodyHeavy"
          size={11}
          color={colors.faint}
          style={{ marginTop: def.earned ? 3 : 4, textAlign: 'center' }}
        >
          {def.requirement}
        </Text>
      </View>
    </View>
  );
}
