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
4. The Edge Function sends a push notification to every subscribed client.
5. The notification says "It's Friday — time to log your check-in! 💪" and links to the check-in page.

## Check-in window

- **Opens**: Thursday 00:00
- **Recommended**: Friday (reminder sent)
- **Grace period**: through Tuesday
- **Closed**: Wednesday (shows "opens Thursday" message)
