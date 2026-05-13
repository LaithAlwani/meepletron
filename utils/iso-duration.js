// Convert a duration in minutes to ISO 8601 (e.g. 60 -> "PT60M", 90 -> "PT1H30M").
// Schema.org's `playTime` and similar properties expect ISO 8601 duration format.
export function minutesToISO8601(minutes) {
  if (minutes == null || isNaN(minutes)) return undefined;
  const total = Math.round(Number(minutes));
  if (total <= 0) return undefined;

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `PT${hours}H${mins}M`;
  if (hours) return `PT${hours}H`;
  return `PT${mins}M`;
}
