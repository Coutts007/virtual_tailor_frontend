import { formatLength } from '$lib/domain/units';
import { INTL_LOCALE, locale } from '$lib/i18n/t.svelte';
import { unit } from './me.svelte';

/** Length in the tailor's unit and language (mm in, "98.5 cm" / "38 ¾ in" out). */
export function len(mm: number | null | undefined): string {
	return formatLength(mm ?? null, unit(), INTL_LOCALE[locale.lang]);
}

/** Today in Nairobi vs a YYYY-MM-DD due date. */
export function isOverdue(due: string, status: string, today: string): boolean {
	return status !== 'collected' && due < today;
}

/** Download text or a blob as a file without leaving the page. */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
