import type { SiteCode } from '$lib/api/types';

/** Coordinates in a 300 × 440 view box; the figure sits in x 85–215. */
export const VIEW = { w: 300, h: 440 };

/** Left half of a neutral front outline, top of neck down to the crotch. */
const LEFT: [number, number][] = [
	[143, 54],
	[142, 66],
	[126, 72],
	[116, 80],
	[111, 100],
	[104, 150],
	[97, 196],
	[94, 212],
	[101, 214],
	[106, 198],
	[115, 150],
	[121, 128],
	[124, 160],
	[127, 186],
	[123, 214],
	[121, 238],
	[123, 300],
	[127, 360],
	[128, 410],
	[121, 426],
	[146, 427],
	[147, 408],
	[147, 330],
	[149, 272]
];

function smooth(points: [number, number][]): string {
	let d = `M${points[0]![0]},${points[0]![1]}`;
	for (let i = 1; i < points.length - 1; i++) {
		const [x, y] = points[i]!;
		const [nx, ny] = points[i + 1]!;
		d += ` Q${x},${y} ${(x + nx) / 2},${(y + ny) / 2}`;
	}
	const last = points.at(-1)!;
	return `${d} L${last[0]},${last[1]}`;
}

export function bodyPath(): string {
	const right = [...LEFT].reverse().map(([x, y]) => [VIEW.w - x, y] as [number, number]);
	return `${smooth([...LEFT, ...right])} Z`;
}

export const HEAD = { cx: 150, cy: 33, r: 21 };

export type Side = 'left' | 'right';
/** Where each site sits on the body, and where its label goes (Section 9.10). */
export const ANCHORS: Record<
	Exclude<SiteCode, 'stature'>,
	{ side: Side; at: [number, number]; labelY: number }
> = {
	neck: { side: 'left', at: [143, 60], labelY: 52 },
	chest: { side: 'left', at: [124, 112], labelY: 150 },
	waist: { side: 'left', at: [127, 186], labelY: 250 },
	hip: { side: 'left', at: [122, 232], labelY: 350 },
	shoulder: { side: 'right', at: [174, 72], labelY: 60 },
	sleeve: { side: 'right', at: [197, 160], labelY: 165 },
	outleg: { side: 'right', at: [177, 300], labelY: 275 },
	inleg: { side: 'right', at: [152, 340], labelY: 385 }
};
export const LABEL_EDGE = { left: 84, right: 216 };
