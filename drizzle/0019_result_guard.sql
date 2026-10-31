CREATE OR REPLACE FUNCTION picks_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'picks are append only: % rejected', lower(TG_OP);
  END IF;
  IF (to_jsonb(NEW) - 'result') IS DISTINCT FROM (to_jsonb(OLD) - 'result') THEN
    RAISE EXCEPTION 'picks are append only: only result may change';
  END IF;
  IF NEW.result IS DISTINCT FROM OLD.result AND OLD.result <> 'pending' AND NOT EXISTS (
    SELECT 1 FROM pick_result_changes c
    WHERE c.pick_id = OLD.id
      AND c.from_result = OLD.result
      AND c.to_result = NEW.result
      AND c.txid = txid_current()
  ) THEN
    RAISE EXCEPTION 'picks: result of pick % is final (%), a correction needs a pick_result_changes row in the same transaction', OLD.id, OLD.result;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE FUNCTION pick_result_changes_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pick result changes are append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER pick_result_changes_append_only_guard
  BEFORE UPDATE OR DELETE ON "pick_result_changes"
  FOR EACH ROW EXECUTE FUNCTION pick_result_changes_append_only();
--> statement-breakpoint
CREATE TRIGGER pick_result_changes_no_truncate
  BEFORE TRUNCATE ON "pick_result_changes"
  FOR EACH STATEMENT EXECUTE FUNCTION pick_result_changes_append_only();
--> statement-breakpoint
CREATE FUNCTION pick_disqualifications_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pick disqualifications are append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER pick_disqualifications_append_only_guard
  BEFORE UPDATE OR DELETE ON "pick_disqualifications"
  FOR EACH ROW EXECUTE FUNCTION pick_disqualifications_append_only();
--> statement-breakpoint
CREATE TRIGGER pick_disqualifications_no_truncate
  BEFORE TRUNCATE ON "pick_disqualifications"
  FOR EACH STATEMENT EXECUTE FUNCTION pick_disqualifications_append_only();
