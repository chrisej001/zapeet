/** Guards against implausible dates of birth (e.g. a mistyped year like
 * "0003-06-30") slipping through a native date input and later breaking
 * an insurance purchase with a confusing upstream error. */
export function isPlausibleDateOfBirth(value: string): boolean {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 110 && year <= currentYear - 5;
}
