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
  if (years >= 1) {
    if (years === 1) return `1 рік`;
    if (years >= 2 && years <= 4) return `${years} роки`;
    return `${years} років`;
  }
  const months = differenceInMonths(new Date(), birth);
  if (months >= 1) {
    if (months === 1) return `1 місяць`;
    if (months >= 2 && months <= 4) return `${months} місяці`;
    return `${months} місяців`;
  }
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
