/**
 * The site rules of Table 3.1 (Section 11.2). Each function works in
 * working-frame pixels and returns a value in mm plus any site-specific issues.
 */
import type { Sex, SiteCode } from '$lib/api/types';
import type { Issue } from './flags';
import { visibilityIssues } from './flags';
import { girth } from './girth';
import { at } from './mask';
import { mapLevel, torsoCentreX, xOnSegment, type Point, type RowWidth, type View } from './levels';
import type { RulesConfig } from './rules';

export interface SiteContext {
	front: View;
	side: View;
	/** mm per frame px; 0 when the view failed. */
	sf: number;
	ss: number;
	rules: RulesConfig;
	sex: Sex;
}

export interface SiteResult {
	value: number | null;
	issues: Issue[];
	level_fraction?: number;
	half_width_mm?: number;
	half_depth_mm?: number;
	correction_factor?: number;
}

const minVis = (v: View, idx: number[]) => Math.min(...idx.map((i) => v.lm(i).v));
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Shoulder/hip midpoints and span (vertical shoulder-mid → hip-mid distance). */
export function torsoFrame(front: View) {
	const shoulder = front.mid(11, 12);
	const hip = front.mid(23, 24);
	return { shoulder, hip, span: hip.y - shoulder.y };
}

function frontClip(front: View, y: number): [number, number] {
	// Arms masked out (13–16): clip the torso run at the arm centre lines.
	const xr = [
		xOnSegment(front.lm(11), front.lm(13), y),
		xOnSegment(front.lm(13), front.lm(15), y)
	].find(Number.isFinite);
	const xl = [
		xOnSegment(front.lm(12), front.lm(14), y),
		xOnSegment(front.lm(14), front.lm(16), y)
	].find(Number.isFinite);
	const lo = Math.min(xl ?? Infinity, xr ?? Infinity);
	const hi = Math.max(xl ?? -Infinity, xr ?? -Infinity);
	return [
		Number.isFinite(lo) && lo < hi ? lo : -Infinity,
		Number.isFinite(hi) && lo < hi ? hi : Infinity
	];
}

function frontWidth(c: SiteContext, y: number): RowWidth {
	const t = torsoFrame(c.front);
	const [l, r] = frontClip(c.front, y);
	return c.front.widthAt(y, torsoCentreX(t.shoulder, t.hip, y), l, r);
}

function sideDepth(c: SiteContext, ySide: number): RowWidth {
	const cx = torsoCentreX(c.side.lm(12), c.side.lm(24), ySide);
	return c.side.widthAt(ySide, cx);
}

function runIssues(w: RowWidth, rules: RulesConfig): Issue[] {
	return !w.run || w.runPx < rules.min_run_px ? [{ reason: 'mask_gap', severity: 'fail' }] : [];
}

function ellipseSite(
	c: SiteContext,
	yFront: number,
	cf: number,
	frac: number,
	extra: Issue[] = []
): SiteResult {
	const fw = frontWidth(c, yFront);
	const sd = sideDepth(c, mapLevel(c.front, c.side, yFront));
	const issues = [...extra, ...runIssues(fw, c.rules), ...runIssues(sd, c.rules)];
	const a = (fw.width / 2) * c.sf;
	const b = (sd.width / 2) * c.ss;
	return {
		value: issues.some((i) => i.severity === 'fail') ? null : girth(a, b, cf),
		issues,
		level_fraction: +frac.toFixed(3),
		half_width_mm: Math.round(a),
		half_depth_mm: Math.round(b),
		correction_factor: cf
	};
}

const TORSO = [11, 12, 23, 24];

export function stature(c: SiteContext): SiteResult {
	return { value: c.front.heightPx * c.sf, issues: [] };
}

export function shoulder(c: SiteContext): SiteResult {
	const issues = visibilityIssues(minVis(c.front, [11, 12]), c.rules);
	const a = c.front.lm(11);
	const b = c.front.lm(12);
	// Cross-check: mask width at the shoulder row is recorded as provenance.
	const w = frontWidth(c, (a.y + b.y) / 2);
	return {
		value: dist(a, b) * c.sf + 2 * c.rules.acromion_offset_mm,
		issues,
		half_width_mm: Math.round((w.width / 2) * c.sf)
	};
}

export function chest(c: SiteContext): SiteResult {
	const issues = [
		...visibilityIssues(minVis(c.front, TORSO), c.rules),
		...visibilityIssues(minVis(c.side, [12, 24]), c.rules)
	];
	const t = torsoFrame(c.front);
	let frac = c.rules.chest_level[c.sex];
	if (c.sex === 'female') {
		// Bust: the most-forward torso point in the side mask within the search band.
		const [lo, hi] = c.rules.bust_search;
		let best = -1;
		for (
			let r = c.front.row(t.shoulder.y + lo * t.span);
			r <= c.front.row(t.shoulder.y + hi * t.span);
			r++
		) {
			const y = c.front.rowCentreY(r);
			const d = sideDepth(c, mapLevel(c.front, c.side, y)).width;
			if (d > best) {
				best = d;
				frac = (y - t.shoulder.y) / t.span;
			}
		}
	}
	return ellipseSite(c, t.shoulder.y + frac * t.span, c.rules.cf.chest, frac, issues);
}

export function waistLevel(c: SiteContext): { y: number; frac: number } {
	const t = torsoFrame(c.front);
	return { y: t.shoulder.y + c.rules.waist_level * t.span, frac: c.rules.waist_level };
}

export function waist(c: SiteContext): SiteResult {
	const issues = [
		...visibilityIssues(minVis(c.front, TORSO), c.rules),
		...visibilityIssues(minVis(c.side, [12, 24]), c.rules)
	];
	const t = torsoFrame(c.front);
	const { y, frac } = waistLevel(c);
	// The narrowest front width in 0.5–0.7 span is a check only (Appendix I.3).
	const [lo, hi] = c.rules.waist_search;
	let narrowFrac = frac;
	let narrow = Infinity;
	for (
		let r = c.front.row(t.shoulder.y + lo * t.span);
		r <= c.front.row(t.shoulder.y + hi * t.span);
		r++
	) {
		const yy = c.front.rowCentreY(r);
		const w = frontWidth(c, yy);
		const f = (yy - t.shoulder.y) / t.span;
		if (!w.run || w.runPx < c.rules.min_run_px) continue;
		// Ties (common on coarse masks) resolve to the row nearest the waist level.
		if (
			w.width < narrow ||
			(w.width === narrow && Math.abs(f - frac) < Math.abs(narrowFrac - frac))
		) {
			narrow = w.width;
			narrowFrac = f;
		}
	}
	if (Math.abs(narrowFrac - frac) > c.rules.waist_mismatch)
		issues.push({ reason: 'waist_level_mismatch', severity: 'check' });
	return ellipseSite(c, y, c.rules.cf.waist, frac, issues);
}

export function hip(c: SiteContext): SiteResult {
	const issues = [
		...visibilityIssues(minVis(c.front, [23, 24, 25, 26]), c.rules),
		...visibilityIssues(minVis(c.side, [12, 24]), c.rules)
	];
	const t = torsoFrame(c.front);
	const knee = c.front.mid(25, 26);
	const yTop = t.hip.y;
	const yBot = t.hip.y + c.rules.hip_band_knee_fraction * (knee.y - t.hip.y);
	// Level = greatest side-mask depth in the band; front width at the same level.
	let bestY = yTop;
	let best = -1;
	for (let r = c.front.row(yTop); r <= c.front.row(yBot); r++) {
		const y = c.front.rowCentreY(r);
		const d = sideDepth(c, mapLevel(c.front, c.side, y)).width;
		if (d > best) {
			best = d;
			bestY = y;
		}
	}
	return ellipseSite(c, bestY, c.rules.cf.hip, (bestY - t.shoulder.y) / t.span, issues);
}

export function sleeve(c: SiteContext): SiteResult {
	const left = [11, 13, 15];
	const right = [12, 14, 16];
	const mean = (idx: number[]) => idx.reduce((s, i) => s + c.front.lm(i).v, 0) / idx.length;
	const chain = mean(left) >= mean(right) ? left : right;
	const [s, e, w] = chain.map((i) => c.front.lm(i)) as [Point, Point, Point];
	return {
		value: (dist(s, e) + dist(e, w)) * c.sf + c.rules.acromion_offset_mm,
		issues: visibilityIssues(minVis(c.front, chain), c.rules)
	};
}

export function outleg(c: SiteContext): SiteResult {
	const issues = [
		...visibilityIssues(minVis(c.front, TORSO), c.rules),
		...visibilityIssues(minVis(c.side, [12, 24]), c.rules)
	];
	const ySide = mapLevel(c.front, c.side, waistLevel(c).y);
	return { value: (c.side.bottomY - ySide) * c.ss, issues };
}

/**
 * Crotch: scan upward from the ankles along the column midway between them.
 * First find the gap between the legs (feet may touch at the floor), then the
 * first row above it where the gap closes. Null when there is no gap below the
 * hips (legs together) or it never closes.
 */
export function crotchRow(front: View): number | null {
	const a = front.lm(27);
	const b = front.lm(28);
	const col = Math.round((a.x + b.x) / 2 / front.fx - 0.5);
	const start = front.row(Math.max(a.y, b.y));
	const stop = front.row(front.mid(23, 24).y);
	const mask = front.input.mask;
	let r = start;
	while (r >= stop && at(mask, col, r)) r--;
	if (r < stop) return null;
	for (; r >= stop; r--) if (at(mask, col, r)) return r;
	return null;
}

export function inleg(c: SiteContext): SiteResult {
	const issues = visibilityIssues(minVis(c.front, [27, 28]), c.rules);
	const r = crotchRow(c.front);
	if (r == null)
		return { value: null, issues: [...issues, { reason: 'crotch_not_found', severity: 'fail' }] };
	return { value: (c.front.bottomY - (r + 1) * c.front.fy) * c.sf, issues };
}

export function neck(c: SiteContext): SiteResult {
	const issues = [
		...visibilityIssues(minVis(c.front, [9, 10, 11, 12]), c.rules),
		...visibilityIssues(minVis(c.side, [12]), c.rules)
	];
	const t = torsoFrame(c.front);
	const mouth = c.front.mid(9, 10);
	const from = mouth.y + c.rules.neck_search_from * (t.shoulder.y - mouth.y);
	// Narrowest front width just above the shoulder line.
	let bestY = from;
	let best = Infinity;
	for (let r = c.front.row(from); r <= c.front.row(t.shoulder.y); r++) {
		const y = c.front.rowCentreY(r);
		const w = c.front.widthAt(y, t.shoulder.x);
		if (w.run && w.runPx >= c.rules.min_run_px && w.width < best) {
			best = w.width;
			bestY = y;
		}
	}
	const fw = c.front.widthAt(bestY, t.shoulder.x);
	const sd = sideDepth(c, mapLevel(c.front, c.side, bestY));
	issues.push(...runIssues(fw, c.rules), ...runIssues(sd, c.rules));
	const a = (fw.width / 2) * c.sf;
	const b = (sd.width / 2) * c.ss;
	return {
		value: issues.some((i) => i.severity === 'fail') ? null : girth(a, b, c.rules.cf.neck),
		issues,
		level_fraction: +((bestY - t.shoulder.y) / t.span).toFixed(3),
		half_width_mm: Math.round(a),
		half_depth_mm: Math.round(b),
		correction_factor: c.rules.cf.neck
	};
}

export const SITE_RULES: Record<SiteCode, (c: SiteContext) => SiteResult> = {
	stature,
	neck,
	shoulder,
	chest,
	waist,
	hip,
	sleeve,
	outleg,
	inleg
};
