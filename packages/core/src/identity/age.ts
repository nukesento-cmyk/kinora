/**
 * Age eligibility (idea.md §8, §16): members must be 18 or over.
 * Ages are computed from the calendar date of birth against today's date in UTC,
 * so the answer doesn't depend on the server's time zone.
 */

export const MINIMUM_AGE = 18;
/** Earliest date of birth accepted (matches the profiles_dob_plausible constraint). */
export const EARLIEST_DATE_OF_BIRTH = "1900-01-01";

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse "YYYY-MM-DD" into a real calendar date. Rejects 2023-02-29, 2024-13-01 and so on. */
export function parseCalendarDate(value: string): CalendarDate | null {
  const m = ISO_DATE.exec(value.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** Build "YYYY-MM-DD" from separate day, month and year inputs, or null if they don't form a date. */
export function dateFromParts(day: string, month: string, year: string): string | null {
  const [d, m, y] = [day.trim(), month.trim(), year.trim()];
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return null;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return parseCalendarDate(iso) ? iso : null;
}

/**
 * Whole years between the date of birth and `now` (UTC).
 * Someone born on 29 February turns a year older on 1 March in non-leap years,
 * which is the later, more cautious reading.
 */
export function ageOn(dateOfBirth: CalendarDate, now: Date): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  let age = y - dateOfBirth.year;
  if (m < dateOfBirth.month || (m === dateOfBirth.month && d < dateOfBirth.day)) age -= 1;
  return age;
}

export type DateOfBirthCheck =
  | { status: "ok"; age: number }
  | { status: "invalid" }
  | { status: "in_future" }
  | { status: "too_early" }
  | { status: "under_age"; age: number };

/** Validate a date of birth and check the minimum age, all on the server's clock in UTC. */
export function checkDateOfBirth(
  value: string,
  now: Date,
  minimumAge = MINIMUM_AGE,
): DateOfBirthCheck {
  const dob = parseCalendarDate(value);
  if (!dob) return { status: "invalid" };
  if (value.trim() < EARLIEST_DATE_OF_BIRTH) return { status: "too_early" };
  const today = now.toISOString().slice(0, 10);
  if (value.trim() > today) return { status: "in_future" };
  const age = ageOn(dob, now);
  return age >= minimumAge ? { status: "ok", age } : { status: "under_age", age };
}

export function isOldEnough(value: string, now: Date, minimumAge = MINIMUM_AGE): boolean {
  return checkDateOfBirth(value, now, minimumAge).status === "ok";
}
