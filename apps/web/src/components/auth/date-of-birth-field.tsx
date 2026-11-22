import { Input } from "@kinora/ui";

interface Props {
  idPrefix: string;
  legend: string;
  hint: string;
  labels: { day: string; month: string; year: string };
  defaults: { day: string; month: string; year: string };
  error?: string | undefined;
}

/**
 * Date of birth as three numeric inputs (day, month, year). Easier to get right than a
 * calendar picker for a date decades ago, and it works with autofill (bday-*).
 */
export function DateOfBirthField({ idPrefix, legend, hint, labels, defaults, error }: Props) {
  const hintId = `${idPrefix}-hint`;
  const errorId = `${idPrefix}-error`;
  const describedBy = error ? `${hintId} ${errorId}` : hintId;
  const part = (
    key: "day" | "month" | "year",
    name: string,
    autoComplete: string,
    maxLength: number,
    width: string,
  ) => (
    <div className={`flex flex-col gap-1.5 ${width}`}>
      <label htmlFor={`${idPrefix}-${key}`} className="text-sm font-medium text-ink">
        {labels[key]}
      </label>
      <Input
        id={`${idPrefix}-${key}`}
        name={name}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        maxLength={maxLength}
        defaultValue={defaults[key]}
        required
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />
    </div>
  );
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      <legend className="mb-1.5 text-sm font-semibold text-ink">{legend}</legend>
      <p id={hintId} className="text-sm text-ink-muted">
        {hint}
      </p>
      <div className="flex gap-3">
        {part("day", "dobDay", "bday-day", 2, "w-16")}
        {part("month", "dobMonth", "bday-month", 2, "w-16")}
        {part("year", "dobYear", "bday-year", 4, "w-24")}
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
