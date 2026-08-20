# Young Executive School Complex Portal

A role-based school portal (Student / Teacher / Administration / Parent / Account) built with React, Vite, Tailwind CSS, and Supabase (auth + database).

## 1. Create your Supabase project (free)1. Go to https://supabase.com and create a free account and a new project.
2. Once it's ready, open **SQL Editor** in the sidebar, paste in the contents of `supabase/schema.sql` from this project, and run it. This creates all the tables, security rules, and the trigger that sets up a profile automatically when someone signs up.
3. Go to **Settings > API** and copy your **Project URL** and **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Paste your Project URL and anon key into `.env`.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL. Click **Sign up**, create an account (pick your role), then sign in.

Note: by default Supabase requires email confirmation before you can sign in — check the inbox you signed up with. You can turn this off in Supabase under **Authentication > Providers > Email** for easier testing.

## 4. Add real data

Right now, sign-up creates a person's account and profile, but classes, enrollments, grades, and attendance start empty. To populate them:
- Use the **Table Editor** in the Supabase dashboard to add rows directly (quickest way to test), or
- Have an admin/teacher add classes and enroll students through the Supabase dashboard for now — a proper "add class" screen in the app itself is a natural next step.
- To link a parent to their child, add a row to `parent_links` with the parent's and student's IDs (found in the `profiles` table).

## 5. Deploy it live

**Vercel (recommended)**
1. Push this folder to a GitHub repo:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/school-portal.git
   git push -u origin main
   ```
2. In Vercel, **Add New → Project**, pick the repo, and before deploying add your two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under Project Settings → Environment Variables.
3. Deploy. You'll get a live URL like `school-portal.vercel.app`.

**Netlify (alternative)**
Same steps — import from GitHub, set the same two environment variables, build command `npm run build`, publish directory `dist`.

## Before using this with real students

This starter sets up reasonable data-access rules (students see only their own grades/attendance, parents see only their linked child's, teachers/admins see more), but it has not been reviewed for FERPA or your school district's specific compliance requirements. Have your school's IT or compliance lead review the policies in `supabase/schema.sql` before putting real student records in it.

## Updating an already-deployed project (registration numbers, new name, crest)

If your Supabase database was already set up before this update, don't re-run `supabase/schema.sql` — run `supabase/migration_002_registration_numbers.sql` instead (same SQL Editor). It only adds what's new: registration-number sign-in for students, the school's new name, and the crest.

## Password reset

The Login screen has a "Forgot your password?" link that emails a reset link via Supabase. Clicking it brings the person back to the app, which detects the reset link and shows a "choose a new password" screen automatically.

One setup step: in Supabase, go to **Authentication > URL Configuration** and add your app's URL (e.g. `http://localhost:5173` for local testing, and your live Vercel/Netlify URL once deployed) to the **Redirect URLs** list — otherwise the reset link will fail.

## What's still missing

- No file attachments, messaging between users, or notifications beyond the announcements board.
- The admin "Manage" tab can create, edit, and delete classes; enroll and remove students from a class roster; link parents; and post announcements. Teachers can save or clear grades from their "Post Grades" panel.
- Deleting a user account (not just their data) still needs the Supabase dashboard.
