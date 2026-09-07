-- Rename resolved_at → completed_at and resolved_by → completed_by on status_updates
ALTER TABLE status_updates RENAME COLUMN resolved_at TO completed_at;
ALTER TABLE status_updates RENAME COLUMN resolved_by TO completed_by;

-- Rename the RLS policy that allowed patient or helper to mark updates resolved
ALTER POLICY "Patient or helper can mark update resolved" ON status_updates
  RENAME TO "Patient or helper can mark update completed";
