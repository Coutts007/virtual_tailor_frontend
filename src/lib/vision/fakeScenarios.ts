/**
 * Scripted check sequences for the FakeVisionEngine (Section 20.4), so every
 * capture-screen state can be designed and tested without a camera.
 * Each step lasts `ms` (scaled by timeScale) and overrides the "good" frame.
 */
export type FakeIssue =
	| 'noPerson'
	| 'headCut'
	| 'tooFar'
	| 'tooClose'
	| 'turned'
	| 'armsIn'
	| 'noMarker'
	| 'fingers'
	| 'dark'
	| 'bright'
	| 'blur'
	| 'shaky'
	| 'tilted';

export interface FakeStep {
	ms: number;
	issues: FakeIssue[];
}

export interface FakeScenario {
	id: string;
	label: string;
	front: FakeStep[];
	side: FakeStep[];
	/** Burst options passed to the synthetic body. */
	burst?: { legGap?: boolean; scaleError?: number; markerConfidence?: number; failFrames?: number };
}

export const SCENARIOS: FakeScenario[] = [
	{
		id: 'happy',
		label: 'Happy path: a few corrections, then all green',
		front: [
			{ ms: 1500, issues: ['noPerson'] },
			{ ms: 1800, issues: ['tooFar'] },
			{ ms: 1500, issues: ['armsIn'] },
			{ ms: 1500, issues: ['noMarker'] }
		],
		side: [
			{ ms: 1500, issues: ['turned'] },
			{ ms: 1200, issues: ['armsIn'] }
		]
	},
	{ id: 'perfect', label: 'All green straight away', front: [], side: [] },
	{
		id: 'every-check',
		label: 'Walk through every correction in priority order',
		front: [
			{ ms: 1800, issues: ['tilted'] },
			{ ms: 1800, issues: ['noPerson'] },
			{ ms: 1800, issues: ['headCut'] },
			{ ms: 1800, issues: ['tooClose'] },
			{ ms: 1800, issues: ['tooFar'] },
			{ ms: 1800, issues: ['turned'] },
			{ ms: 1800, issues: ['armsIn'] },
			{ ms: 1800, issues: ['fingers'] },
			{ ms: 1800, issues: ['noMarker'] },
			{ ms: 1800, issues: ['dark'] },
			{ ms: 1800, issues: ['bright'] },
			{ ms: 1800, issues: ['blur'] },
			{ ms: 1800, issues: ['shaky'] }
		],
		side: [{ ms: 1500, issues: ['turned'] }]
	},
	{
		id: 'cancel-countdown',
		label: 'Countdown cancelled by movement, then recovers',
		front: [
			{ ms: 2600, issues: [] },
			{ ms: 1500, issues: ['armsIn'] }
		],
		side: []
	},
	{
		id: 'dark-room',
		label: 'Too dark for a long time',
		front: [{ ms: 9000, issues: ['dark'] }],
		side: []
	},
	{
		id: 'scale-disagree',
		label: 'Sheet and height disagree (> 4%) → retake',
		front: [],
		side: [],
		burst: { scaleError: 0.06, markerConfidence: 0.7 }
	},
	{
		id: 'inleg-fail',
		label: 'Feet together: inside leg not measured',
		front: [],
		side: [],
		burst: { legGap: false }
	},
	{
		id: 'bad-burst',
		label: 'Burst without a sheet in 3 of 5 frames',
		front: [],
		side: [],
		burst: { failFrames: 3 }
	}
];

export function scenario(id: string): FakeScenario {
	return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
}
