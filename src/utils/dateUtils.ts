import { format, parseISO, differenceInYears, differenceInMonths, isPast, isToday, isFuture, addDays } from 'date-fns';

export function formatDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch {
    return isoDate;
  }
}

export function formatAge(birthDate: string): string {
  const birth = parseISO(birthDate);
  const now = new Date();

  const years = differenceInYears(now, birth);
  // Remaining months after full years
  const birthPlusYears = new Date(birth);
  birthPlusYears.setFullYear(birthPlusYears.getFullYear() + years);
  const months = differenceInMonths(now, birthPlusYears);

  const yearStr = (y: number) => {
    if (y === 1) return '1 рік';
    if (y >= 2 && y <= 4) return `${y} роки`;
    return `${y} років`;
  };

  const monthStr = (m: number) => {
    if (m === 1) return '1 місяць';
    if (m >= 2 && m <= 4) return `${m} місяці`;
    return `${m} місяців`;
  };

  if (years >= 1 && months > 0) return `${yearStr(years)} ${monthStr(months)}`;
  if (years >= 1) return yearStr(years);

  const totalMonths = differenceInMonths(now, birth);
  if (totalMonths >= 1) return monthStr(totalMonths);

  return 'Новонароджений';
}

export function isOverdue(date: string): boolean {
  return isPast(parseISO(date)) && !isToday(parseISO(date));
}

export function isDueToday(date: string): boolean {
  return isToday(parseISO(date));
}

export function isDueSoon(date: string, days = 7): boolean {
  const d = parseISO(date);
  return isFuture(d) && d <= addDays(new Date(), days);
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
