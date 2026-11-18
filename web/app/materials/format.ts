const priceFormat = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const dateFormat = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' });
const countFormat = new Intl.NumberFormat('en-AU');

/** The API sends the price as a decimal string; it is only turned into a number to display it. */
export function formatPrice(price: string): string {
  return priceFormat.format(Number(price));
}

/** Timestamps arrive as ISO strings in UTC and are shown in the viewer's own time zone. */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}

export function formatCount(value: number): string {
  return countFormat.format(value);
}
