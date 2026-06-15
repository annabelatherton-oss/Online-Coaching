# CoachHub — Setup Guide

Welcome! This guide walks you through getting CoachHub running from scratch.
No coding experience needed — follow each step in order.

---

## Step 1 — Create a Supabase account and project

Supabase is the database that stores all your coaching data.

1. Go to **https://supabase.com** and click **Start your project** (it's free).
2. Sign in with GitHub or create an email account.
3. Once logged in, click **New project**.
4. Fill in:
   - **Name**: CoachHub (or anything you like)
   - **Database Password**: choose a strong password and save it somewhere safe
   - **Region**: pick the one closest to you
5. Click **Create new project** and wait 1–2 minutes for it to set up.

---

## Step 2 — Run the database schema

This creates all the tables CoachHub needs.

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. Open the file `supabase/schema.sql` from this project on your computer.
4. Copy the entire contents and paste it into the SQL Editor.
5. Click **Run** (the green button, or press Ctrl+Enter / Cmd+Enter).
6. You should see "Success. No rows returned." — that means it worked!

---

## Step 3 — Get your Supabase keys

1. In Supabase, click **Settings** (gear icon) in the left sidebar.
2. Click **API** in the settings menu.
3. You'll see two things you need:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon public** key — a long string of letters and numbers

Keep this page open for the next step.

---

## Step 4 — Create your .env file

This file tells the app how to connect to Supabase.

1. In the project folder, find the file called `.env.example`.
2. Make a copy of it and name the copy `.env` (just `.env`, no `.example`).
3. Open `.env` in a text editor (Notepad works fine on Windows).
4. Replace the placeholder values:

```
VITE_SUPABASE_URL=https://your-actual-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

Save the file. **Never share this file or commit it to git — it's already in .gitignore.**

---

## Step 5 — Install and run locally

You'll need Node.js installed first. If you don't have it:
- Go to **https://nodejs.org** and download the **LTS** version. Install it.

Then open a **Terminal** (Mac: search "Terminal", Windows: search "Command Prompt" or "PowerShell"):

```bash
# Navigate to the project folder
cd path/to/Online-Coaching

# Install dependencies (only needed once, or after package.json changes)
npm install

# Start the development server
npm run dev
```

You'll see something like:
```
  VITE v5.x.x  ready in 500 ms
  ➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173** — you should see the CoachHub login page!

---

## Step 6 — Create your coach account

The first account you create will be your coach (admin) account.

1. Go to Supabase Dashboard > **Authentication** > **Users**.
2. Click **Add user** > **Create new user**.
3. Enter your email and a password. Click **Create user**.
4. Now go to **SQL Editor** and run this query (replace the email with yours):

```sql
update profiles
set role = 'coach', full_name = 'Your Name Here'
where email = 'your@email.com';
```

5. Go back to the app at **http://localhost:5173** and log in with your email and password.
6. You should land on the **Coach Dashboard** — you're in!

---

## Step 7 — Deploy to Vercel (make it live on the internet)

Vercel hosts your app for free.

1. Go to **https://vercel.com** and sign up (use GitHub for easiest setup).
2. Click **Add New > Project**.
3. Connect your GitHub account and find your `Online-Coaching` repository.
   (If the repo isn't there, push your code to GitHub first — see note below.)
4. Vercel will detect it's a Vite project automatically.
5. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` — your Supabase URL from Step 3
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key from Step 3
6. Click **Deploy**. In 1–2 minutes you'll get a live URL like `https://online-coaching-abc.vercel.app`.

**To push to GitHub** (if needed):
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/Online-Coaching.git
git push -u origin main
```

---

## Step 8 — Add a client

Once you're logged in as coach:

1. Click **Clients** in the sidebar.
2. Click **Add Client**.
3. Fill in their name, email, and a temporary password.
4. Set how many weeks of access they get and their start date.
5. Click **Create Client**.
6. Share the app URL and their temporary password with your client.
7. They log in and land on their own Client Dashboard — they can only see their own data.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Login says "Invalid credentials" | Check email/password are correct; make sure you created the user in Supabase Auth |
| Blank page or loading forever | Check .env file has correct URL and key (no extra spaces) |
| "Missing Supabase env vars" in console | .env file not found or values are wrong |
| Coach sees client portal (or vice versa) | Check the `role` column in the `profiles` table in Supabase |

---

## What's built so far (Phase 1)

- ✅ Login page (shared for coach and clients)
- ✅ Coach dashboard with client overview
- ✅ Add / edit / pause / delete clients
- ✅ Access expiry with automatic calculation
- ✅ Client portal with profile view
- ✅ Dark mode support
- ✅ Mobile responsive

**Coming next (Phase 2):** Full client profiles, weight tracking, progress photos, measurements, and trend charts.
