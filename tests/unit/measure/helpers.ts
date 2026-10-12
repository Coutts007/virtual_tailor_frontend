import type { Sex } from '../../../src/lib/api/types';
import type { MeasureInput } from '../../../src/lib/measure';
import {
	defaultBody,
	synthesizeView,
	type SynthOptions,
	type SyntheticBody
} from '../../../src/lib/measure/synthetic';

export function synthInput(
	opts: SynthOptions & {
		sex?: Sex;
		height?: number;
		body?: Partial<SyntheticBody>;
		side?: SynthOptions;
	} = {},
	extra: Partial<MeasureInput> = {}
) {
	const sex = opts.sex ?? 'female';
	const body = { ...defaultBody(opts.height ?? 1700, sex), ...opts.body };
	const f = synthesizeView(body, 'front', opts);
	const s = synthesizeView(body, 'side', { ...opts, ...opts.side });
	const input: MeasureInput = {
		front: f.input,
		side: s.input,
		height_mm: body.height_mm,
		sex,
		clothing_fit: 'fitted',
		level_unchecked: false,
		...extra
	};
	return { input, truth: f.truth, body };
}

/** A blank mask with rectangles filled (mask pixels, inclusive). */
export function rectMask(
	w: number,
	h: number,
	rects: [x0: number, y0: number, x1: number, y1: number][]
) {
	const data = new Uint8Array(w * h);
	for (const [x0, y0, x1, y1] of rects)
		for (let y = y0; y <= y1; y++) data.fill(1, y * w + x0, y * w + x1 + 1);
	return { data, width: w, height: h };
}
