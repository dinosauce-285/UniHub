import type { Workshop } from '../types/registration';

export function formatSchedule(startTime: string, endTime: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `${formatter.format(new Date(startTime))} - ${formatter.format(
    new Date(endTime),
  )}`;
}

export function formatPrice(workshop: Pick<Workshop, 'isPaid' | 'price'>) {
  if (!workshop.isPaid) {
    return 'Free';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(workshop.price);
}
