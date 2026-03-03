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
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years} year${years !== 1 ? 's' : ''}`;
  const months = differenceInMonths(new Date(), birth);
  if (months >= 1) return `${months} month${months !== 1 ? 's' : ''}`;
  return 'Newborn';
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
