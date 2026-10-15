/**
 * Observes the requests the console already makes (no new endpoints, no new
 * polling) so the live terminal can log their real status and duration.
 */
export interface ApiEvent {
  method: 'GET';
  /** Path without the query string, e.g. /api/v1/telemetry/recent */
  path: string;
  /** HTTP status, or 0 when the request never reached the gateway. */
  status: number;
  ok: boolean;
  durationMs: number;
  at: number;
}

type Listener = (event: ApiEvent) => void;

const listeners = new Set<Listener>();

export function onApiEvent(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitApiEvent(event: ApiEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // A failing observer must never break data fetching.
    }
  });
}
