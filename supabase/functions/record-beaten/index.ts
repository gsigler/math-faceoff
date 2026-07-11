// Invoked by the client right after finish_round() returns is_record: true.
// Re-reads the confirming data itself rather than trusting client-relayed
// numbers — the request body only tells us *what to check*, not what to say.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendPushMessages } from '../_shared/push.ts';

const OP_NAMES: Record<string, string> = {
  add: 'Addition',
  sub: 'Subtraction',
  mul: 'Multiplication',
  div: 'Division',
};

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('unauthorized', { status: 401 });

  let operation: string;
  try {
    ({ operation } = await req.json());
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!OP_NAMES[operation]) return new Response('bad operation', { status: 400 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Resolve the caller from their own JWT (RLS-scoped client, not trusted input).
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: me } = await admin
    .from('players')
    .select('id, family_id, name')
    .eq('auth_uid', user.id)
    .single();
  if (!me) return new Response('no player', { status: 400 });

  // Confirm the caller's own most recent faceoff round for this operation is
  // actually flagged as a record — don't trust the client beyond the trigger.
  const { data: round } = await admin
    .from('rounds')
    .select('score, is_record')
    .eq('player_id', me.id)
    .eq('operation', operation)
    .eq('mode', 'faceoff')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!round?.is_record) return new Response('not a record', { status: 200 });

  const { data: priorRows } = await admin
    .from('rounds')
    .select('score')
    .eq('family_id', me.family_id)
    .eq('operation', operation)
    .eq('mode', 'faceoff')
    .neq('player_id', me.id)
    .order('score', { ascending: false })
    .limit(1);
  const priorBest = priorRows?.[0]?.score ?? 0;

  const { data: rivalRounds } = await admin
    .from('rounds')
    .select('player_id')
    .eq('family_id', me.family_id)
    .eq('operation', operation)
    .eq('mode', 'faceoff')
    .neq('player_id', me.id);
  const rivalIds = [...new Set((rivalRounds ?? []).map((r) => r.player_id as string))];
  if (rivalIds.length === 0) return new Response('no rivals', { status: 200 });

  const today = new Date().toISOString().slice(0, 10);
  const { data: alreadySent } = await admin
    .from('notification_log')
    .select('player_id')
    .eq('kind', 'record_beaten')
    .eq('local_date', today)
    .in('player_id', rivalIds);
  const sent = new Set((alreadySent ?? []).map((r) => r.player_id as string));
  const targets = rivalIds.filter((id) => !sent.has(id));
  if (targets.length === 0) return new Response('already notified', { status: 200 });

  const { data: tokenRows } = await admin
    .from('player_push_tokens')
    .select('player_id, expo_push_token')
    .in('player_id', targets);

  const messages = (tokenRows ?? []).map((t) => ({
    to: t.expo_push_token as string,
    title: `${me.name} just beat your ${OP_NAMES[operation]} record!`,
    body: `${priorBest} → ${round.score} correct. Think you can take it back?`,
  }));
  await sendPushMessages(messages);

  await admin
    .from('notification_log')
    .upsert(
      targets.map((player_id) => ({ player_id, kind: 'record_beaten', local_date: today })),
      { onConflict: 'player_id,kind,local_date', ignoreDuplicates: true },
    );

  return new Response('ok', { status: 200 });
});
