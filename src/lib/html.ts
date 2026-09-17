/**
 * Escapes a value for safe interpolation into HTML text content or a
 * double-quoted HTML attribute. `dataArray`/`selectedItems` items often
 * originate from a database (item names, group names), so this must run
 * on every dynamic string before it is written into a template.
 *
 * @param value Any value; it is coerced to a string first.
 * @returns The HTML-escaped string.
 */
export function escapeHtml(value: unknown): string {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
