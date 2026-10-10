CREATE EXTENSION IF NOT EXISTS http;
CREATE OR REPLACE FUNCTION notify_outbreak_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-outbreak-sms',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('alertId', NEW.id)
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER outbreak_alert_created
  AFTER INSERT ON outbreak_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_outbreak_alert();