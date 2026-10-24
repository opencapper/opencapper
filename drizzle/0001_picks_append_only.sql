CREATE FUNCTION picks_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'picks are append only: % rejected', lower(TG_OP);
  END IF;
  IF (to_jsonb(NEW) - 'result') IS DISTINCT FROM (to_jsonb(OLD) - 'result') THEN
    RAISE EXCEPTION 'picks are append only: only result may change';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER picks_append_only_guard
  BEFORE UPDATE OR DELETE ON "picks"
  FOR EACH ROW EXECUTE FUNCTION picks_append_only();
--> statement-breakpoint
CREATE TRIGGER picks_no_truncate
  BEFORE TRUNCATE ON "picks"
  FOR EACH STATEMENT EXECUTE FUNCTION picks_append_only();
