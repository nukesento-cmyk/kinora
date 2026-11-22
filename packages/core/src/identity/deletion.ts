/**
 * Account deletion (idea.md §8, §22). A request deactivates the account at once
 * (sessions revoked, profile marked) and starts a grace period. Signing in again
 * during the grace period cancels the request. After it, the purge job hard-deletes
 * the account and everything that belongs to it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function assertGraceDays(graceDays: number): void {
  if (!Number.isInteger(graceDays) || graceDays < 1) {
    throw new RangeError("graceDays must be a whole number of days, at least 1");
  }
}

/** When an account whose deletion was requested at `requestedAt` becomes due for purging. */
export function deletionDueAt(requestedAt: Date, graceDays: number): Date {
  assertGraceDays(graceDays);
  return new Date(requestedAt.getTime() + graceDays * DAY_MS);
}

/** True once the full grace period has passed. */
export function isDeletionDue(requestedAt: Date, now: Date, graceDays: number): boolean {
  return now.getTime() >= deletionDueAt(requestedAt, graceDays).getTime();
}

/** Requests made at or before this instant are due for purging at `now`. */
export function purgeCutoff(now: Date, graceDays: number): Date {
  assertGraceDays(graceDays);
  return new Date(now.getTime() - graceDays * DAY_MS);
}
