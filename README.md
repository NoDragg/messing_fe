# Messing FE

Frontend of **Messing**, a real-time chat application inspired by Discord.
Built with **Vue 3**, **Vite**, **Pinia**, **Vue Router**, **Axios**, and **STOMP over SockJS** for realtime features.

## Overview

This frontend handles:

- user authentication
- server and channel navigation
- realtime chat messages
- invite acceptance flow
- voice / presence UI state
- user settings and profile updates
- image upload and avatar cropping

The app connects to the backend through REST APIs and websocket/STOMP channels.

## Tech stack

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- @stomp/stompjs
- SockJS
- lucide-vue-next

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- npm

## Project setup

Install dependencies:

```sh
npm install
```

## Runtime configuration

The app loads runtime configuration from `/config.json`.

Example:

```json
{
  "API_BASE_URL": "http://localhost:8080",
  "WS_BASE_URL": "http://localhost:8080"
}
```

If the file is missing or invalid, the app falls back to `/` for both API and websocket base URLs.

## Development

Run the development server:

```sh
npm run dev
```

By default Vite starts on the local dev URL shown in the terminal.

## Production build

Create a production build:

```sh
npm run build
```

## Preview production build

Preview the built app locally:

```sh
npm run preview
```

## Authentication

The API client automatically attaches the JWT token stored in `localStorage` under `token`.

For authenticated requests:

- login and register requests are sent without the bearer token
- all other requests include `Authorization: Bearer <token>` when available
- if a `401 Unauthorized` response is returned, the client clears stored auth data and triggers the unauthorized handler

## Realtime features

Messing FE uses websocket/STOMP for realtime updates such as:

- chat messages
- voice / presence state
- call signaling

The websocket base URL is loaded from runtime config so the app can be deployed in different environments without rebuilding.

## Suggested repo structure

- `src/views` — route-level screens
- `src/layouts` — shared layout shells
- `src/components` — reusable UI components
- `src/stores` — Pinia state modules
- `src/services` — API and integration layer
- `src/router` — navigation and route guards
- `src/composables` — shared composition logic
- `public/config.json` — runtime config for deployment

## Useful docs

If you want to understand the project faster, read these files in order:

1. `../PROJECT_README_ROADMAP.md`
2. `../ARCHITECTURE_SUMMARY.md`
3. `../DETAILED_FILE_INDEX.md`
4. `../MODULE_GUIDE.md`
5. `../FLOW_GUIDE.md`

## Notes for deployment

Make sure the deployed frontend can reach the backend API and websocket endpoint defined in `config.json`.

If you change the backend location, update runtime config instead of hardcoding URLs in the source.
