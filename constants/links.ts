import { API_BASE_URL } from "../services/api";

// Single source of truth for the guest join links. The QR code and the "Copy
// link" button must always agree — scan.tsx pulls the token back out with
// /upload\/(…)/, and the `everly` scheme is registered in app.json.

/** The deep link. Only opens for someone who already has the app installed —
 *  a phone without Everly does nothing at all with an `everly://` URL, which is
 *  why anything shared *outside* the app should use `webJoinLink` instead. */
export const joinLink = (token: string) => `everly://upload/${token}`;

/** Where the invite page lives: the API host with the `/api` prefix dropped.
 *
 *  Derived rather than hardcoded so it can't drift. The page is a route on the
 *  backend itself (`routes/web.php` → `JoinController`, view `join.blade.php`),
 *  so it is by definition on the same host the app is already talking to — and
 *  a restarted ngrok tunnel only has to be pasted into `DEV_BASE_URL` once. */
const WEB_BASE = API_BASE_URL.replace(/\/api\/?$/, "");

/** The shareable link. Lands on the server-rendered invite page, which shows
 *  the event and hands off to the app — or to the App Store for a guest who
 *  doesn't have it. Use this everywhere a link leaves the app: share sheets,
 *  messages, anywhere a guest without Everly might tap it. */
export const webJoinLink = (token: string) => `${WEB_BASE}/upload/${token}`;
