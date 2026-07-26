# Margin — Secure Note-Taking (Frontend)

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui client for the [note-taking API](https://github.com/RuhulAmin3/note-taking-application-server). JWT auth held in `localStorage`, role-aware routing for `user` and `admin`, light and dark themes.

**Live:** https://note-application-client-six.vercel.app
**API:** https://note-application-server.vercel.app ([repo](https://github.com/RuhulAmin3/note-taking-application-server))

Sign up for a regular account, or sign in as `admin@test.com` / `adminpass123` to see the admin views.

## Features

**Everyone**

- Sign up and sign in, with client-side validation and field-level errors from the API
- Session survives a refresh; an expired or invalid token clears itself and returns you to sign-in
- Light/dark theme, applied before first paint so there is no flash, and remembered

**Signed-in users**

- Notes: create, edit, delete, paginated, private to your account
- Posts: create, edit, delete, paginated, shown with your name
- Deletes ask for confirmation; forms disable while saving; lists have loading and empty states

**Admins**

- All notes and all posts across every account, grouped by owner — read-only, no create forms
- Users: create, edit (name, email, role, interests) and delete
- New accounts are always created as regular users; role is only adjustable when editing an existing one
- Users grouped by interest, from the API's aggregation
- Cannot delete their own account

## Setup

**Requires** Node >= 20.9 and the API running on port 4001. Start the backend first — this app is a pure client and will show errors on every page without it.

```bash
npm install
cp .env.local.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4001/api
npm run dev                         # http://localhost:3000
```

Seed an admin from the backend repo with `npm run seed`, then sign in as `admin@test.com` / `adminpass123`. Any account created through sign-up is a regular user.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :3000 (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Deploy (Vercel)

```bash
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # https://<your-api>.vercel.app/api
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` **before the first build**. `NEXT_PUBLIC_*` values are inlined into the bundle at build time, so changing it in the dashboard afterwards does nothing until you redeploy — and a build that ran without it ships pointing at `localhost`.

The API's `CORS_ORIGIN` has to name this app's deployed origin, so the order is: deploy the API, deploy this against it, then set `CORS_ORIGIN` on the API and redeploy it. Only the production aliases are allowlisted — preview deployments get a different URL and their API calls will be blocked by the browser.

To confirm a build picked up the right API URL, grep the served bundle for `localhost`; there should be no matches.

## Structure

```
src/
  app/
    layout.tsx            fonts, metadata template, theme bootstrap script
    globals.css           design tokens, margin-rule and ruled-paper utilities
    page.tsx              sends you to /notes or /login by session
    login/ register/      auth screens
    notes/ posts/         per-role pages
    admin/users/          user management
    */layout.tsx          per-route <title>, one server component each
  components/
    app-shell.tsx         header, nav, gutters, auth + admin guard
    auth-layout.tsx       frame for sign-in and sign-up
    entry-card.tsx        note/post card, owner grouping
    entry-editor.tsx      edit dialog shared by notes and posts
    user-form.tsx         create/edit user
    field.tsx pager.tsx empty-state.tsx confirm-delete.tsx theme-toggle.tsx
    ui/                   shadcn primitives (generated, not hand-written)
  lib/
    api.ts                axios instance, token header, 401 handling
    auth.tsx              AuthProvider, session hydration
    errors.ts             unpacks the API error envelope into field errors
    theme.ts              theme as an external store over the DOM
```

Pages are client components because auth lives in `localStorage`. Since `export const metadata` only works in server components, each route has a small server `layout.tsx` that supplies its title.

## Design

Geist for body text, Bricolage Grotesque for the wordmark and headings, Geist Mono for emails, counts and dates. A deep pine accent, held away from the red destructive colour so the two never read alike. Notes and posts carry a notebook margin rule down the left edge; the auth screens echo it as ruled paper.

Tokens live in `globals.css` as CSS variables consumed by shadcn, so changing the palette is a matter of editing `:root` and `.dark`.

## Notes

- `components.json` pins the shadcn style (`base-nova` on `@base-ui/react`, neutral base, lucide icons). Add primitives with `npx shadcn@latest add <name>` so they match; do not hand-write them.
- This is Next.js **16** — see `AGENTS.md`. Its APIs and conventions differ from older versions, and the bundled docs in `node_modules/next/dist/docs/` are the authority.
