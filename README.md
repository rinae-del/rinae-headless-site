# Rinae Headless React Site

A sleek React frontend wired for Squareflo's headless CMS API.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Add local environment variables:

```bash
cp .env.example .env.local
```

For production on Vercel, Squareflo automatically provisions the server-side variables used by `api/squareflo.js`:

```bash
SQUAREFLO_API_URL=https://squareflo.com/api/v1
SQUAREFLO_API_KEY=sqf_live_your_key_here
SQUAREFLO_DRAFT_KEY=sqf_draft_your_key_here
```

For local direct API testing, you can set:

```bash
VITE_SQUAREFLO_API_URL=https://squareflo.com/api/v1
VITE_SQUAREFLO_API_KEY=sqf_live_your_key_here
VITE_SQUAREFLO_CONTACT_FORM_ID=optional_squareflo_form_id
```

3. Start the frontend:

```bash
npm run dev
```

The app falls back to CMS-shaped agency content when no CMS key is configured, then uses Squareflo pages, section blocks, navigation, settings/design tokens, FAQs, reviews, feed entries, and forms when credentials are present.

## Deploying with Squareflo

This project is set up for Squareflo's Vercel-connected deployment flow:

1. Push this project to a Git repository.
2. In Squareflo, connect your Vercel project under `Integrations > Vercel Connection`.
3. In Squareflo, create your API key under `Settings > API Keys`.
4. Squareflo will automatically provision these server-side Vercel environment variables:

```bash
SQUAREFLO_API_URL=https://squareflo.com/api/v1
SQUAREFLO_API_KEY=sqf_live_your_key_here
SQUAREFLO_DRAFT_KEY=sqf_draft_your_key_here
```

5. In Vercel, add `VITE_SQUAREFLO_CONTACT_FORM_ID` only if you want the contact form to submit into a specific Squareflo form.
6. Import the Git repository into the connected Vercel project, or point the existing Vercel project at this repo.
7. Deploy.

### Why this works

- `api/squareflo.js` keeps the Squareflo API key server-side on Vercel.
- `vercel.json` serves the built Vite app from `dist` and rewrites frontend routes back to `index.html`.
- The React app uses `/api/squareflo` in production, so the browser never needs the live Squareflo key.
