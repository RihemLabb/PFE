export const DEFAULT_BUSINESS_TIME_ZONE = 'Africa/Tunis';

export function getDateKeyInTimeZone(
  date = new Date(),
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${values.year}-${values.month}-${values.day}`;
}
