import { format } from 'date-fns';

export function formatPkr(value: number | null | undefined): string {
  const amount = value ?? 0;
  return `PKR ${amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, 'dd MMM yyyy');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, 'dd MMM yyyy, HH:mm');
}

export function nextOrderNo(orderNumbers: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `ZS-ORD-${year}-`;
  let max = 0;
  for (const orderNo of orderNumbers) {
    if (!orderNo.startsWith(prefix)) {
      continue;
    }
    const sequence = Number(orderNo.slice(prefix.length));
    if (Number.isInteger(sequence)) {
      max = Math.max(max, sequence);
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}
