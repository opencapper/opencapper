CREATE FUNCTION event_results_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'event results are append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER event_results_append_only_guard
  BEFORE UPDATE OR DELETE ON "event_results"
  FOR EACH ROW EXECUTE FUNCTION event_results_append_only();
--> statement-breakpoint
CREATE TRIGGER event_results_no_truncate
  BEFORE TRUNCATE ON "event_results"
  FOR EACH STATEMENT EXECUTE FUNCTION event_results_append_only();
