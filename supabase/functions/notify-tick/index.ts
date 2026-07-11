// Cron sweep (pg_cron, every ~30 min) for the two time-based moments: an
// evening streak reminder and a morning nudge. Both need live per-player
// content, so this always recomputes from `rounds`/`_streak_for_player`
// rather than scheduling anything on-device in advance.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendPushMessages, type PushMessage } from '../_shared/push.ts';

interface PlayerRow {
  id: string;
  name: string;
  timezone: string;
  player_push_tokens: { expo_push_token: string }[];
}

function localNow(timezone: string): { hour: number; date: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { hour: Number(get('hour')), date: `${get('year')}-${get('month')}-${get('day')}` };
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: players } = await admin
    .from('players')
    .select('id, name, timezone, player_push_tokens(expo_push_token)')
    .not('timezone', 'is', null);

  const messages: PushMessage[] = [];
  const logRows: { player_id: string; kind: string; local_date: string }[] = [];

  for (const p of (players ?? []) as PlayerRow[]) {
    const tokens = p.player_push_tokens.map((t) => t.expo_push_token);
    if (tokens.length === 0) continue;

    const { hour, date: localDate } = localNow(p.timezone);

    if (hour === 18) {
      const alreadySent = await wasSent(admin, p.id, 'streak_risk', localDate);
      if (!alreadySent) {
        const { data: todays } = await admin
          .from('rounds')
          .select('id')
          .eq('player_id', p.id)
          .eq('mode', 'faceoff')
          .eq('local_date', localDate)
          .limit(1);
        if (!todays || todays.length === 0) {
          const { data: streak } = await admin.rpc('_streak_for_player', { p_player_id: p.id, p_today: localDate });
          const current = streak?.current_streak ?? 0;
          const title = current > 0 ? 'Your streak ends in 3 hours' : 'Start today’s streak';
          const body =
            current > 0
              ? `${current} day${current === 1 ? '' : 's'} and counting — one Faceoff round keeps it alive.`
              : 'One Faceoff round today gets you started.';
          for (const to of tokens) messages.push({ to, title, body });
          logRows.push({ player_id: p.id, kind: 'streak_risk', local_date: localDate });
        }
      }
    }

    if (hour === 8) {
      const alreadySent = await wasSent(admin, p.id, 'daily_nudge', localDate);
      if (!alreadySent) {
        const body = await nudgeBody(admin, p.id);
        for (const to of tokens) messages.push({ to, title: "Today's warm-up", body });
        logRows.push({ player_id: p.id, kind: 'daily_nudge', local_date: localDate });
      }
    }
  }

  await sendPushMessages(messages);
  if (logRows.length > 0) {
    await admin.from('notification_log').upsert(logRows, { onConflict: 'player_id,kind,local_date', ignoreDuplicates: true });
  }

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
});

// deno-lint-ignore no-explicit-any
async function wasSent(admin: any, playerId: string, kind: string, localDate: string): Promise<boolean> {
  const { data } = await admin
    .from('notification_log')
    .select('id')
    .eq('player_id', playerId)
    .eq('kind', kind)
    .eq('local_date', localDate)
    .maybeSingle();
  return !!data;
}

/** Points at whichever badge this player is closest to earning, with a
 *  generic fallback — real progress, not filler copy. */
// deno-lint-ignore no-explicit-any
async function nudgeBody(admin: any, playerId: string): Promise<string> {
  const { data: badges } = await admin.rpc('_streak_for_player', { p_player_id: playerId });
  const bestStreak: number = badges?.current_streak ?? 0;

  const { data: solvedRows } = await admin.from('rounds').select('score').eq('player_id', playerId);
  const solved = (solvedRows ?? []).reduce((sum: number, r: { score: number }) => sum + r.score, 0);
  const toGo = Math.max(0, 100 - solved);

  if (bestStreak > 0 && bestStreak < 7) {
    return `${7 - bestStreak} more day${7 - bestStreak === 1 ? '' : 's'} for your 7-day streak badge.`;
  }
  if (toGo > 0 && toGo <= 20) {
    return `You're ${toGo} solved away from the 100-solved badge.`;
  }
  return 'A quick Faceoff round keeps your skills sharp.';
}
