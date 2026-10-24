CREATE FUNCTION pick_log_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pick log is append only: % rejected', lower(TG_OP);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE FUNCTION pick_log_chain() RETURNS trigger AS $$
DECLARE
  last_seq bigint;
  last_root bytea;
BEGIN
  SELECT seq, root INTO last_seq, last_root FROM pick_log ORDER BY seq DESC LIMIT 1;
  IF NEW.seq IS DISTINCT FROM coalesce(last_seq, 0) + 1 THEN
    RAISE EXCEPTION 'pick log: seq % does not follow %', NEW.seq, coalesce(last_seq, 0);
  END IF;
  IF NEW.prev_root IS DISTINCT FROM coalesce(last_root, decode(repeat('00', 32), 'hex')) THEN
    RAISE EXCEPTION 'pick log: prev_root does not match the current root';
  END IF;
  IF NEW.root IS DISTINCT FROM sha256(NEW.prev_root || NEW.leaf_hash) THEN
    RAISE EXCEPTION 'pick log: root is not sha256(prev_root || leaf_hash)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER pick_log_chain_guard
  BEFORE INSERT ON "pick_log"
  FOR EACH ROW EXECUTE FUNCTION pick_log_chain();
--> statement-breakpoint
CREATE TRIGGER pick_log_append_only_guard
  BEFORE UPDATE OR DELETE ON "pick_log"
  FOR EACH ROW EXECUTE FUNCTION pick_log_append_only();
--> statement-breakpoint
CREATE TRIGGER pick_log_no_truncate
  BEFORE TRUNCATE ON "pick_log"
  FOR EACH STATEMENT EXECUTE FUNCTION pick_log_append_only();
--> statement-breakpoint
CREATE FUNCTION log_anchors_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'log anchors are append only: % rejected', lower(TG_OP);
  END IF;
  IF (to_jsonb(NEW) - 'ots' - 'upgraded') IS DISTINCT FROM (to_jsonb(OLD) - 'ots' - 'upgraded') THEN
    RAISE EXCEPTION 'log anchors are append only: only ots and upgraded may change';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER log_anchors_guard
  BEFORE UPDATE OR DELETE ON "log_anchors"
  FOR EACH ROW EXECUTE FUNCTION log_anchors_guard();
--> statement-breakpoint
CREATE TRIGGER log_anchors_no_truncate
  BEFORE TRUNCATE ON "log_anchors"
  FOR EACH STATEMENT EXECUTE FUNCTION log_anchors_guard();
