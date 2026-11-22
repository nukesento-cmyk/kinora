-- Audit entries are immutable: reject UPDATE, DELETE and TRUNCATE on audit_logs.
-- Retention (if ever required) must be done by a migration run by the database owner,
-- which drops and recreates this trigger explicitly and is itself reviewed.
CREATE OR REPLACE FUNCTION audit_logs_reject_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% rejected)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_change();
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_reject_change();
