# Drama Watch web client

The Angular frontend for Drama Watch, a personal and social watchlist for Korean dramas, films,
and other TV series.

The client is a strict, standalone Angular application. It uses Angular Router with lazy feature
routes, Angular `HttpClient` for API access, RxJS for asynchronous streams, and Angular Signals for
local UI state as features are introduced. Remote data is owned by feature services rather than a
global state store.

## Requirements

- Node.js 22.12 or newer within the Node 22 release line
- npm 10 or newer
- The API running on `http://localhost:8080` for features that make backend requests

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:4200`. The development server proxies `/api` requests to
`http://localhost:8080` using `proxy.conf.json`, so client code always uses the same relative API
base URL used in production.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Unit and component tests run with Vitest through Angular's test builder. End-to-end tests run with
Playwright against a real development server. Install its Chromium browser once on a new machine:

```bash
npx playwright install chromium
```

## Project organization

The application grows in vertical feature slices under `src/app/features`. Cross-cutting API,
authentication, routing guards, interceptors, and layout code belong under `src/app/core`; reusable
presentational code belongs under `src/app/shared`. A folder is added only when a current feature
needs it.

The initial route is implemented at:

```text
src/app/features/home/pages/home-page/
```

Runtime-independent client configuration lives in `src/environments/environment.ts`. Browser code
must never contain MongoDB credentials, Better Auth secrets, or the TMDB access token.

## Deployment

Production builds are written to `dist/drama-watch-web/browser`. `firebase.json` serves that folder,
rewrites `/api/**` to the `drama-watch-api` Cloud Run service in `europe-west1`, and sends all other
unknown routes to Angular's `index.html`.

Select the Firebase project outside source control before deploying; this repository intentionally
does not contain a `.firebaserc` project identifier.
