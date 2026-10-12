/**
 * WhatsApp share text (Section 13.9). The server builds the canonical text; the
 * mock uses this same builder so the two match. No link to the profile.
 */
import type { Flag, SiteCode } from '$lib/api/types';
import { formatLength, type DisplayUnit } from './units';

export interface ShareTextInput {
	client_code: string;
	display_name?: string | null;
	include_name: boolean;
	profile_version: number;
	/** ISO timestamp of the capture. */
	captured_at: string;
	garment_label: string;
	/** YYYY-MM-DD. */
	due_date: string;
	lines: { label: string; site_code: SiteCode; value_mm: number | null; flag: Flag }[];
	unit?: DisplayUnit;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'Africa/Nairobi'
});

export function formatSheetDate(iso: string): string {
	const d = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
	return dateFmt.format(d);
}

export function buildShareText(i: ShareTextInput): string {
	const name = i.include_name && i.display_name ? ` · ${i.display_name}` : '';
	const head = `Virtual Tailor · Client ${i.client_code}${name} · Profile v${i.profile_version} (${formatSheetDate(
		i.captured_at
	)}) · ${i.garment_label} · Due ${formatSheetDate(i.due_date)}`;
	const body = i.lines.map((l) => {
		if (l.flag === 'fail' || l.value_mm == null) return `${l.label} — not measured`;
		const v = formatLength(l.value_mm, i.unit ?? 'cm');
		return l.flag === 'check' ? `${l.label} ${v} ▲ check` : `${l.label} ${v} ✓`;
	});
	return [head, ...body, 'No photo is stored.'].join('\n');
}
