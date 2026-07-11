/** `YYYY-MM-DD` in the device's local timezone — matches `rounds.local_date`
 *  and `my_streak()`'s calendar entries, which are plain SQL dates. */
export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
