CREATE FUNCTION pick_sources_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pick sources are append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER pick_sources_append_only_guard
  BEFORE UPDATE OR DELETE ON "pick_sources"
  FOR EACH ROW EXECUTE FUNCTION pick_sources_append_only();
--> statement-breakpoint
CREATE TRIGGER pick_sources_no_truncate
  BEFORE TRUNCATE ON "pick_sources"
  FOR EACH STATEMENT EXECUTE FUNCTION pick_sources_append_only();
