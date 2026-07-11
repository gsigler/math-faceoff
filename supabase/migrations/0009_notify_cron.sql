-- Schedule the notify-tick sweep (streak reminder + daily nudge) every 30
-- minutes via pg_cron + pg_net.
--
-- MANUAL SETUP REQUIRED before this migration is applied (never commit
-- secrets to a migration file): in the Supabase dashboard, go to
-- Project Settings -> Vault, and create two secrets:
--   project_url        e.g. https://<project-ref>.supabase.co
--   service_role_key   the project's service_role key
-- pg_cron/pg_net read them from Vault at call time, so the key never touches
-- git history.

select cron.schedule(
  'notify-tick',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
