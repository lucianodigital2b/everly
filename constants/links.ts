// Single source of truth for the guest join link. The QR code and the "Copy link"
// button must always agree — scan.tsx pulls the token back out with /upload\/(…)/,
// and the `everly` scheme is registered in app.json.
//
// NOTE: this is a deep link, so it only opens for someone who already has the app.
// A web fallback (https://<domain>/upload/<token>, redirecting to the store) still
// needs a domain before guests without Everly can join.
export const joinLink = (token: string) => `everly://upload/${token}`;
