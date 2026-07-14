-- Secure RPC: coaches can see all client tasks for a given day
-- Private tasks have label/notes replaced with NULL (masked), but is_private=true is returned
-- so the UI can show a "Private task" placeholder
CREATE OR REPLACE FUNCTION get_client_tasks_for_coach(
  p_client_id uuid,
  p_task_date date
)
RETURNS TABLE (
  id uuid,
  task_date date,
  task_type text,
  task_key text,
  label text,
  completed boolean,
  notes text,
  is_private boolean,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only the coach of this client may call this
  IF NOT EXISTS (
    SELECT 1 FROM clients WHERE id = p_client_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.task_date,
    t.task_type,
    t.task_key,
    CASE WHEN t.is_private THEN NULL ELSE t.label END AS label,
    t.completed,
    CASE WHEN t.is_private THEN NULL ELSE t.notes END AS notes,
    t.is_private,
    t.created_at
  FROM client_daily_tasks t
  WHERE t.client_id = p_client_id
    AND t.task_date = p_task_date
  ORDER BY
    CASE WHEN t.task_type = 'system' THEN 0 ELSE 1 END,
    t.created_at;
END;
$$;
