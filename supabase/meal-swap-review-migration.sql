-- Flags a client's week for the coach to check once the client swaps which meal they're having
-- for a slot (not an ingredient-quantity tweak — an actual different meal choice), so the coach
-- knows to go verify the swap's quantities/macros still work. Set true by the client's own save
-- (src/pages/client/ClientMealPlan.jsx handleSave) whenever an active override away from the
-- template exists, and cleared automatically the moment the coach saves that week themselves
-- (src/pages/coach/CoachClientProfile.jsx handleSaveSlots) — reviewing it, whatever they change,
-- is what resolves it. Also cleared automatically if the client reverts back to matching the
-- template exactly, so a stale flag never lingers with nothing left to review.
alter table client_week_meals
  add column if not exists needs_coach_review boolean not null default false;
