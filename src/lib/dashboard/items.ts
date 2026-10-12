import type {
	Flag,
	Measurement,
	OrderItem,
	OrderItemInput,
	SiteCode,
	UnitPref
} from '$lib/api/types';
import { mmToUnit, unitToMm } from '$lib/domain/units';
import { validateEaseCm } from '$lib/domain/validate';

/** One editable order row (Section 13.6). Values in mm; `ease` in the tailor's unit. */
export interface EditRow {
	site_code: SiteCode;
	auto_mm: number | null;
	body_mm: number | null;
	ease: number | null;
	overridden: boolean;
	override_reason?: string;
	flag_confirmed: boolean;
	pending_fitting: boolean;
	flag: Flag;
	reasons: Measurement['flag_reasons'];
}

export function rowsFromProfile(
	sites: SiteCode[],
	ms: Measurement[],
	presets: Partial<Record<SiteCode, number>> = {},
	unit: UnitPref = 'cm'
): EditRow[] {
	return sites.map((site) => {
		const m = ms.find((x) => x.site_code === site);
		const preset = presets[site];
		return {
			site_code: site,
			auto_mm: m?.value_mm ?? null,
			body_mm: m?.value_mm ?? null,
			ease: preset ? mmToUnit(preset, unit) : null,
			overridden: false,
			flag_confirmed: false,
			pending_fitting: false,
			flag: m?.confidence_flag ?? 'pass',
			reasons: m?.flag_reasons ?? []
		};
	});
}

export function rowsFromOrder(items: OrderItem[], ms: Measurement[], unit: UnitPref): EditRow[] {
	return items.map((it) => {
		const m = ms.find((x) => x.site_code === it.site_code);
		return {
			site_code: it.site_code,
			auto_mm: m?.value_mm ?? null,
			body_mm: it.body_mm,
			ease: it.ease_mm ? mmToUnit(it.ease_mm, unit) : null,
			overridden: it.overridden,
			override_reason: it.override_reason,
			flag_confirmed: !!it.flag_confirmed,
			pending_fitting: !!it.pending_fitting,
			flag: it.confidence_flag,
			reasons: m?.flag_reasons ?? []
		};
	});
}

export function easeMm(r: EditRow, unit: UnitPref): number {
	return r.ease == null ? 0 : unitToMm(r.ease, unit);
}

export function easeError(r: EditRow, unit: UnitPref): boolean {
	if (r.ease == null) return false;
	if (unit === 'cm') return validateEaseCm(r.ease) != null;
	const mm = unitToMm(r.ease, unit);
	return !(mm >= 0 && mm <= 300);
}

export function finishedMm(r: EditRow, unit: UnitPref): number | null {
	return r.body_mm == null ? null : r.body_mm + easeMm(r, unit);
}

/** A flagged row is resolved when confirmed, overridden or left for the fitting; a failed row cannot simply be confirmed. */
export function isResolved(r: EditRow): boolean {
	if (r.overridden || r.pending_fitting) return true;
	if (r.flag === 'pass' && r.body_mm != null) return true;
	if (r.body_mm == null) return false;
	return r.flag_confirmed;
}

export function unresolved(rows: EditRow[]): EditRow[] {
	return rows.filter((r) => !isResolved(r));
}

export function toItemInputs(rows: EditRow[], unit: UnitPref): OrderItemInput[] {
	return rows.map((r) => ({
		site_code: r.site_code,
		body_mm: r.pending_fitting && !r.overridden ? null : r.body_mm,
		ease_mm: easeMm(r, unit),
		overridden: r.overridden,
		override_reason: r.overridden ? r.override_reason || undefined : undefined,
		flag_confirmed: r.flag !== 'pass' && !r.overridden ? r.flag_confirmed || undefined : undefined,
		pending_fitting: r.pending_fitting || undefined
	}));
}
