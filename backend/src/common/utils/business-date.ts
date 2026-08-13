export const DEFAULT_BUSINESS_TIME_ZONE = 'Africa/Tunis';

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseDateKey(dateKey: string): DateParts {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError(`Invalid date key: ${dateKey}`);
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== dateKey) {
    throw new RangeError(`Invalid date key: ${dateKey}`);
  }

  return { year, month, day };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;

  return (
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ) - date.getTime()
  );
}

function zonedMidnightToUtc(dateKey: string, timeZone: string) {
  const { year, month, day } = parseDateKey(dateKey);
  const desiredWallClock = Date.UTC(year, month - 1, day);
  const firstGuess = new Date(desiredWallClock);
  const firstOffset = getTimeZoneOffsetMs(firstGuess, timeZone);
  let candidate = new Date(desiredWallClock - firstOffset);
  const correctedOffset = getTimeZoneOffsetMs(candidate, timeZone);

  if (correctedOffset !== firstOffset) {
    candidate = new Date(desiredWallClock - correctedOffset);
  }

  return candidate;
}

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

export function addDaysToDateKey(dateKey: string, days: number) {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dateKeyToUtcDate(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getUtcRangeForDateKeyInTimeZone(
  dateKey: string,
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
) {
  const start = zonedMidnightToUtc(dateKey, timeZone);
  const end = zonedMidnightToUtc(addDaysToDateKey(dateKey, 1), timeZone);
  return { start, end };
}

export function getBusinessDayRange(
  date = new Date(),
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
) {
  const dateKey = getDateKeyInTimeZone(date, timeZone);
  return { dateKey, ...getUtcRangeForDateKeyInTimeZone(dateKey, timeZone) };
}
