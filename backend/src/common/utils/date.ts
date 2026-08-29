import { BadRequestException } from '@nestjs/common';

export const dateOnly = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE || 'Africa/Tunis',
  }).format(new Date());
export const utcDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException('Date must be YYYY-MM-DD');
  return new Date(`${value}T00:00:00.000Z`);
};
export const dayBounds = (value: string) => {
  const start = utcDate(value);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};
