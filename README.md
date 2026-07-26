# Drama Watch web client

The Angular frontend for Drama Watch, a personal and social watchlist for Korean dramas, films,
and other TV series.

The client is a strict, standalone Angular application. It uses Angular Router with lazy feature
routes, Angular `HttpClient` for API access, RxJS for asynchronous streams, and Angular Signals for
local UI state as features are introduced. Remote data is owned by feature services rather than a
global state store.

Authentication uses Better Auth's framework-agnostic client. An injectable Angular service exposes
session state through read-only Signals, route guards protect the application by default, and
standalone pages provide registration, email verification and resend, login, password recovery,
password reset, and username onboarding.

The TMDB search slice adds protected `/search` and `/media/:mediaType/:tmdbId` routes. A feature data
service calls the same-origin NestJS API with Angular `HttpClient`, while Signals own loading, error,
pagination, and result state. The K-drama shortcut searches TV titles with the `KR` origin-country
filter. The browser receives normalized media data and image URLs, never the TMDB access token.

The protected `/` route is a K-drama discovery portal rather than a generic product introduction.
It loads one shared response from `/api/discovery/home` and presents a featured title plus
responsive shelves for popular, currently airing, top-rated, and newly released K-dramas and
popular movies. Shelf data is non-personal and cached by the backend for 24 hours.

The personal library slice adds protected status views at `/library/to-watch`, `/library/watching`,
and `/library/watched`. Search results and media details provide quick status actions backed by the
owner-scoped library API. The client receives one shared media snapshot inside each personal entry;
it does not store or submit user IDs. TV entries provide episode increment/decrement, season
completion, manual correction, and one-step client undo. Media details also support half-point
ratings, private descriptions, and optional audio and subtitle preferences.

Custom categories can be created, renamed, and deleted from the library screen. Each personal entry
can belong to multiple categories from either the library or media-details view, and status library
pages can be filtered by one category. Category assignment always sends category IDs; ownership is
verified by the API.

The protected `/priority` route provides an Angular CDK drag-and-drop board. Users can create,
rename, delete, and reorder lanes; reorder titles within a lane; move titles between lanes or back
to unassigned; and randomly pick from one lane. Only `to_watch` entries appear on the board, and
every drag sends all affected lane orders in one API request.

Private wheels are available at `/wheels` and `/wheels/:wheelId`. Users can create wheels, add
library titles, reorder or disable candidates, adjust weights, avoid the immediately previous
winner, and review or reset spin history. The backend selects the winner first; the Angular wheel
then animates to that exact result and respects reduced-motion preferences.

Share cards are rendered entirely in the browser from personal media details or a server-selected
wheel winner. Users can choose square, story, or landscape output and light, dark, or poster themes,
then download a full-size PNG. Rating, progress, and username fields are configurable. Private
descriptions are excluded unless the user explicitly enables them for that card.

Phase 2 begins with public profiles at `/users/:username`, the signed-in user's `/profile` shortcut,
and a protected friendship hub at `/friends`. The hub separates incoming requests, accepted friends,
and sent requests while also providing weighted name/username discovery, typo-tolerant similar
results, and contextual request controls.
Users can send, accept, decline, cancel, and remove relationships without the browser supplying an
owner ID. Public profile and friendship UI use only the public API contract and never receive email
addresses or other Better Auth internals.

At mobile widths, authenticated users receive a persistent five-destination bottom navigation for
Home, Search, Library, Priority, and Wheels. Dense media and library cards adapt for narrow screens,
and primary controls use touch-friendly targets while desktop navigation and layouts remain intact.

## Requirements

- Node.js 22.12 or newer within the Node 22 release line
- npm 10 or newer
- The API running on `http://localhost:8080` for features that make backend requests
- Docker Compose 2.22 or newer when running the complete containerized stack

## Local development

To run MongoDB, the API, and this client together, use the Compose file in the sibling server
repository:

```bash
docker compose --file ../k-drama-watchlist-server/compose.yaml up --build --watch
```

The client is then available at `http://localhost:4200`. Compose Watch synchronizes changes under
`src` and `public`, while `proxy.compose.conf.json` sends `/api` requests to the internal `api`
service. Stop the stack with `docker compose down`.

To add repeatable local demo data, run this after the stack is healthy:

```bash
docker compose --file ../k-drama-watchlist-server/compose.yaml exec api npm run seed:dev
```

Sign in with `demo@drama-watch.local` and password `DramaWatch1!`. The guarded seed is local-only,
does not erase existing data, and can be run again safely.

To run only the client directly on the host, follow the steps below.

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
```

Unit and component tests run with Vitest through Angular's test builder. Browser end-to-end
automation is intentionally deferred.

## Project organization

The application grows in vertical feature slices under `src/app/features`. Cross-cutting API,
authentication, routing guards, interceptors, and layout code belong under `src/app/core`; reusable
presentational code belongs under `src/app/shared`. A folder is added only when a current feature
needs it.

The initial route is implemented at:

```text
src/app/features/home/pages/home-page/
```

Authentication code is organized under:

```text
src/app/core/auth/
src/app/features/auth/
```

TMDB search code is organized under:

```text
src/app/features/search/data-access/
src/app/features/search/models/
src/app/features/search/pages/
```

Personal library code is organized under:

```text
src/app/features/library/data-access/
src/app/features/library/components/
src/app/features/library/models/
src/app/features/library/pages/
src/app/features/library/utils/
```

Custom category code is organized under:

```text
src/app/features/categories/components/
src/app/features/categories/data-access/
src/app/features/categories/models/
```

Priority-board code is organized under:

```text
src/app/features/priority/data-access/
src/app/features/priority/models/
src/app/features/priority/pages/
```

The priority board supports whole-card and whole-lane drag interactions. Random lane picks use a
preselected-winner case-opening reel that can be skipped and respects reduced-motion preferences.

Private-wheel code is organized under:

```text
src/app/features/wheels/data-access/
src/app/features/wheels/models/
src/app/features/wheels/pages/
```

Share-card preview and PNG export code is organized under:

```text
src/app/features/share-cards/components/
src/app/features/share-cards/data-access/
src/app/features/share-cards/models/
```

Anonymous users are redirected to `/login`. New accounts first continue to `/verify-email`; the
verification link returns them to `/onboarding` to choose a unique username. Login can resend a
verification message for an unverified account. `/forgot-password` always displays a neutral result
to avoid revealing whether an account exists, and emailed reset links open `/reset-password`.
Browser requests use same-origin `/api/auth/*` routes through the Angular proxy; the client never
receives the Better Auth secret, Resend API key, or MongoDB credentials.

Runtime-independent client configuration lives in `src/environments/environment.ts`. Browser code
must never contain MongoDB credentials, Better Auth secrets, or the TMDB access token.

## Deployment

Production builds are written to `dist/drama-watch-web/browser`. `firebase.json` serves that folder,
rewrites `/api/**` to the `k-drama-watchlist` Cloud Run service in `europe-west1`, and sends all other
unknown routes to Angular's `index.html`.

Select the Firebase project outside source control before deploying; this repository intentionally
does not contain a `.firebaserc` project identifier.

### GitHub Actions deployment

`.github/workflows/deploy-frontend.yml` runs linting, type-checking, unit tests, and the production
build for pull requests targeting `main` and pushes to `main`. Pull requests from branches in this
repository deploy to a seven-day Firebase Hosting preview channel. Pull requests from forks run
verification but skip deployment. Successful pushes to `main` deploy the same verified build
artifact to the live channel. The live job uses the `firebase-hosting-production` GitHub environment
so deployment protection rules can be enabled in the repository settings.

Configure these GitHub Actions values before enabling deployment:

| Type                | Name                             | Value                                              |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| Repository variable | `FIREBASE_PROJECT_ID`            | The Firebase project containing the Hosting site.  |
| Repository variable | `GCP_WORKLOAD_IDENTITY_PROVIDER` | The full Workload Identity Provider resource name. |
| Repository variable | `GCP_FIREBASE_SERVICE_ACCOUNT`   | The dedicated deployment service-account email.    |

Deployment uses GitHub OIDC and Google Cloud Workload Identity Federation. It does not require or
permit a long-lived service-account key. Follow [the Workload Identity setup guide](docs/firebase-github-actions.md)
to create the provider, grant the deployment roles, and configure the repository variables.

Preview channels use the real Firebase project and the configured Cloud Run backend. Treat preview
URLs as public, temporary application deployments rather than isolated test environments.
