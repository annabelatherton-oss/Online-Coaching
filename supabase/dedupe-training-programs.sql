-- Consolidates the 9 duplicated training blocks found by
-- find-duplicate-training-programs.sql down to one row each — the most
-- complete copy (real top_lifts, 7 sessions) for each block name.
-- Run once in Supabase SQL Editor.

-- Step 1: move the 2 real client assignments off the stale duplicates onto
-- the canonical row for their block.
UPDATE client_training_assignments SET program_id = 'f1c09c9d-b5a1-4ccb-8581-caaba31035c9' WHERE program_id = '9303dba8-9280-4108-95be-6740be79f9a7'; -- 3 Day — Block 2 (Strength)
UPDATE client_training_assignments SET program_id = '4b7666f9-4ac0-4243-96d7-2d0fc6eaf640' WHERE program_id = 'd317eaaf-55c4-4f81-adc6-6de4738a9f60'; -- 5 Day — Block 1 (Hypertrophy)

-- Step 2: clear any other (inactive/historical) assignment rows still
-- pointing at a duplicate, so they don't block deletion.
DELETE FROM client_training_assignments WHERE program_id IN (
  '0c0fe99b-91e5-4b5b-a188-0109d5377ee2', '2d2c9e82-9d8a-45a9-a21f-08272ce679a1',
  '9303dba8-9280-4108-95be-6740be79f9a7', 'a8862882-a939-4325-a745-7f11435db828',
  '38cdc2bd-07d6-4e56-8e49-468b10fe9ccf', 'cee9d25c-eef4-447f-86ba-9b7036e826aa',
  'c1ed1461-e2c7-431a-a5a7-99ad2a9eeaa8', '8dcbdf0f-766d-4743-aeed-d5992f79e5cd',
  '1d64f07b-ce62-41c2-92b6-2c36f91c4c73', 'd060ad09-99c4-4e9e-8e78-b87724f9b3a1',
  'b48175f0-9ce1-4f55-bedd-6ccae1478cc5', '4ebc2755-b026-45ad-80ff-d0324bf5cbf8',
  '09952e9f-ecb3-44e0-b9b9-a6ca13169500', 'd317eaaf-55c4-4f81-adc6-6de4738a9f60',
  '5f12f57f-6d98-4fde-bb85-7779bde59cbe', 'e18ee336-14da-4a7d-aaf6-594f38506c12',
  '78466f49-3b45-404c-a5a8-a86c1c3d276d', '923fae64-0c00-4035-b003-0f55eddf10ec'
);

-- Step 3: delete the duplicate programs (training_sessions/session_exercises
-- cascade automatically).
DELETE FROM training_programs WHERE id IN (
  '0c0fe99b-91e5-4b5b-a188-0109d5377ee2', '2d2c9e82-9d8a-45a9-a21f-08272ce679a1', -- 3 Day — Block 1 (Hypertrophy)
  '9303dba8-9280-4108-95be-6740be79f9a7', 'a8862882-a939-4325-a745-7f11435db828', -- 3 Day — Block 2 (Strength)
  '38cdc2bd-07d6-4e56-8e49-468b10fe9ccf', 'cee9d25c-eef4-447f-86ba-9b7036e826aa', -- 3 Day — Block 3 (Block 3)
  'c1ed1461-e2c7-431a-a5a7-99ad2a9eeaa8', '8dcbdf0f-766d-4743-aeed-d5992f79e5cd', -- 4 Day — Block 1 (Hypertrophy)
  '1d64f07b-ce62-41c2-92b6-2c36f91c4c73', 'd060ad09-99c4-4e9e-8e78-b87724f9b3a1', -- 4 Day — Block 2 (Strength)
  'b48175f0-9ce1-4f55-bedd-6ccae1478cc5', '4ebc2755-b026-45ad-80ff-d0324bf5cbf8', -- 4 Day — Block 3 (Block 3)
  '09952e9f-ecb3-44e0-b9b9-a6ca13169500', 'd317eaaf-55c4-4f81-adc6-6de4738a9f60', -- 5 Day — Block 1 (Hypertrophy)
  '5f12f57f-6d98-4fde-bb85-7779bde59cbe', 'e18ee336-14da-4a7d-aaf6-594f38506c12', -- 5 Day — Block 2 (Strength)
  '78466f49-3b45-404c-a5a8-a86c1c3d276d', '923fae64-0c00-4035-b003-0f55eddf10ec'  -- 5 Day — Block 3 (Block 3)
);
