CREATE FUNCTION history_picks_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'history picks are append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER history_picks_append_only_guard
  BEFORE UPDATE OR DELETE ON "history_picks"
  FOR EACH ROW EXECUTE FUNCTION history_picks_append_only();
--> statement-breakpoint
CREATE TRIGGER history_picks_no_truncate
  BEFORE TRUNCATE ON "history_picks"
  FOR EACH STATEMENT EXECUTE FUNCTION history_picks_append_only();
