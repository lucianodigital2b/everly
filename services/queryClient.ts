import { QueryClient } from "@tanstack/react-query";

/**
 * The app's single QueryClient.
 *
 * It lives here rather than in `app/_layout.tsx` so non-React code can reach
 * it — the background photo uploader invalidates the event's caches as each
 * shot lands, and it runs outside any component tree.
 */
export const queryClient = new QueryClient();
