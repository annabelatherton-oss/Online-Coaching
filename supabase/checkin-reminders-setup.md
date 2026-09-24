# Check-in Reminder Setup

## VAPID keys (already generated — use these exact values)

VAPID_PUBLIC_KEY:
BICkHpRAhc6znVU4R7uNdxt6dGrAcIi68_J81swxgX9veGvhLQLWn1gCBIh2St9iFOov5o5GZm1wA2Stv_Zm_Hk

VAPID_PRIVATE_KEY:
ypPaEQTJuylWMA3PU4NJ7Y0XOFv9eRnvLFOfotG34LM

VAPID_PUBLIC_KEY_X:
gKQelECFzrOdVThHu413G3p0asBwiLrz8nzWzDGBf28

VAPID_PUBLIC_KEY_Y:
eGvhLQLWn1gCBIh2St9iFOov5o5GZm1wA2Stv_Zm_Hk

---

## Step 1 — Add VAPID public key to your .env

In your local `.env` file (copy from `.env.example`), add:

```
VITE_VAPID_PUBLIC_KEY=BICkHpRAhc6znVU4R7uNdxt6dGrAcIi68_J81swxgX9veGvhLQLWn1gCBIh2St9iFOov5o5GZm1wA2Stv_Zm_Hk
```

## Step 2 — Add secrets to Supabase Edge Function

In your Supabase dashboard → Settings → Edge Functions → Secrets, add:

| Secret name          | Value |
|----------------------|-------|
| VAPID_PUBLIC_KEY     | BICkHpRAhc6znVU4R7uNdxt6dGrAcIi68_J81swxgX9veGvhLQLWn1gCBIh2St9iFOov5o5GZm1wA2Stv_Zm_Hk |
| VAPID_PRIVATE_KEY    | ypPaEQTJuylWMA3PU4NJ7Y0XOFv9eRnvLFOfotG34LM |
| VAPID_PUBLIC_KEY_X   | gKQelECFzrOdVThHu413G3p0asBwiLrz8nzWzDGBf28 |
| VAPID_PUBLIC_KEY_Y   | eGvhLQLWn1gCBIh2St9iFOov5o5GZm1wA2Stv_Zm_Hk |

## Step 3 — Run SQL in Supabase SQL Editor

Run `supabase/push-subscriptions.sql` to create the push_subscriptions table.

## Step 4 — Deploy the Edge Function

In your terminal, from the project root:
```
npx supabase functions deploy send-checkin-reminders
```
(Requires Supabase CLI installed and project linked.)

## Step 5 — Set up the cron job

Enable these extensions in Supabase: Database → Extensions → enable `pg_cron` and `pg_net`.

Then run `supabase/setup-checkin-cron.sql` in the SQL Editor.

The cron runs every Friday at 5:00 UTC (6:00 AM UK summer time / BST).
Change to `'0 6 * * 5'` during winter when the UK is UTC+0.

---

## How it works

1. When a client logs into the app, they're asked for notification permission.
2. Their browser push subscription is stored in `push_subscriptions`.
3. Every Friday at 6am UK time, the cron job calls the Edge Function.
4. The Edge Function sends a push notification to every subscribed client —
   except anyone whose first plan assignment (`client_plan_assignments`) is
   less than 7 days old, or who has no plan assigned yet. A client onboarded
   this week gets their first reminder the following Friday, not the same
   week their first plan goes out.
5. The notification says "It's Friday — time to log your check-in! 💪" and links to the check-in page.

## Check-in window

- **Opens**: Thursday 00:00
- **Recommended**: Friday (reminder sent)
- **Grace period**: through Tuesday
- **Closed**: Wednesday (shows "opens Thursday" message)

---

## Coach reminder (Friday 7am — "check-ins are due, go review them")

Same VAPID keys and infrastructure, separate everything else — separate service worker
(`public/coach-sw.js`, scoped to `/coach/`) so the notification text and link differ from the
client one, separate `coach_id` column on `push_subscriptions` (added by
`coach-push-subscriptions-migration.sql`), separate Edge Function
(`send-coach-checkin-reminder`), separate cron job.

Setup, on top of everything above:
1. Run `supabase/coach-push-subscriptions-migration.sql` in the SQL Editor.
2. Deploy the new function: `npx supabase functions deploy send-coach-checkin-reminder`
   (uses the same VAPID secrets already configured for `send-checkin-reminders`).
3. Run `supabase/setup-coach-checkin-cron.sql` in the SQL Editor.
4. A coach registers for push automatically the next time they load the app (same
   ask-for-permission flow as clients), from `CoachLayout.jsx`.

The coach gets one notification every Friday at 7am UK time regardless of how many clients
they have or how recently they were onboarded — there's no "too new" exclusion like the
client-side reminder has, since reviewing check-ins is always relevant once a coach has any.

---

## "Notify client" button (coach-triggered, not scheduled)

A "Notify client of changes" button on the client's Meal Plan tab and Everyday Meals card
(`CoachClientProfile.jsx`) sends a one-off push straight to that client — e.g. after editing
their plan — instead of waiting for Friday. Unlike every other push in this app, this one
carries a real encrypted message (RFC 8291 aes128gcm) so the notification text actually differs
("meal plan updated" vs. "everyday meals updated") rather than relying on one fixed notification
baked into the service worker.

Setup, on top of everything above (same VAPID secrets, same client `push_subscriptions` rows —
no new migration needed):
1. Deploy the new function: `npx supabase functions deploy send-client-notification`
   **or**, if you're pasting the code straight into the Supabase Dashboard's function editor
   instead of using the CLI (as with every function up to this point), paste the whole contents
   of `supabase/functions/send-client-notification/index.ts` — it's fully self-contained (the
   encryption code is written directly into the file, not imported from anywhere else), so a
   single-file paste works correctly. The same applies to `send-meal-swap-notification` below.

That's it — no cron job, it fires on click. If the client hasn't turned on push notifications
yet, the button shows "Client hasn't turned on notifications" instead of silently doing nothing.
If it shows "Could not send — try again", the function likely hasn't been deployed yet (or was
deployed as a broken multi-file paste before this file became self-contained) — redeploy it with
either method above.

## Meal-swap notification (client-triggered)

`send-meal-swap-notification` — pushes the coach when a client saves an actual meal swap (see
CoachDashboard's "Needs Attention" list and the migration note in
`supabase/meal-swap-review-migration.sql`). Same deployment options as above: `npx supabase
functions deploy send-meal-swap-notification`, or paste its `index.ts` directly into the
Dashboard — also fully self-contained.

## Day-preference notification (client-triggered)

`send-day-preference-notification` — pushes the coach the moment a client changes their training
availability (My Profile, the first-open prompt, or My Training — see `DayAvailabilityRows` in
`src/components/DayAvailability.jsx`, which is what every one of those three places actually
renders). The change is also logged to `client_activity_log` at the same time and shows up
attached to whichever check-in the client submits next (`CheckinsTab` in
`CoachClientProfile.jsx`), so nothing gets missed even if the push is dismissed.

Setup, on top of everything above:
1. Run `supabase/client-activity-log-migration.sql` in the SQL Editor.
2. Deploy the new function: `npx supabase functions deploy send-day-preference-notification`,
   or paste its `index.ts` directly into the Dashboard — also fully self-contained.
