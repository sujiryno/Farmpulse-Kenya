SELECT cron.schedule(
  'export-diseases-to-claude',          -- unique job name
  '0 2 * * *',                          -- cron: 2 AM daily (UTC+3 EAT = 23 UTC previous day)
  $$
  SELECT
    net.http_post(
      url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/export-diseases-to-claude',
      headers := '{"Content-Type": "application/json", "X-Supabase-Cron": "true"}'::jsonb
    ) AS request_id;
  $$
);