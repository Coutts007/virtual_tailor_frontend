import { describe, expect, it } from 'vitest';
import {
	transition,
	type CaptureEvent,
	type CaptureState
} from '../../../src/lib/capture/stateMachine';

const run = (events: CaptureEvent[], s: CaptureState = { name: 'idle' }, ctx = {}) =>
	events.reduce((acc, e) => transition(acc, e, ctx), s);

describe('capture state machine (Section 10.7)', () => {
	it('happy path: idle → … → review → saved', () => {
		const s = run([
			{ type: 'START' },
			{ type: 'PERMISSIONS_OK' },
			{ type: 'LEVEL_OK' },
			{ type: 'WALK_DONE' },
			{ type: 'ALL_GREEN' },
			{ type: 'TICK' },
			{ type: 'TICK' },
			{ type: 'TICK' },
			{ type: 'BURST_OK' },
			{ type: 'NEXT' },
			{ type: 'WALK_DONE' },
			{ type: 'ALL_GREEN' },
			{ type: 'TICK' },
			{ type: 'TICK' },
			{ type: 'TICK' },
			{ type: 'BURST_OK' },
			{ type: 'NEXT' },
			{ type: 'COMPUTED' },
			{ type: 'SCALE_OK' }
		]);
		expect(s).toEqual({ name: 'review', retake: null });
		expect(transition(s, { type: 'SAVE' })).toEqual({ name: 'saved' });
		expect(transition(s, { type: 'DISCARD' })).toEqual({ name: 'discarded' });
	});

	it('countdown counts 3 → 2 → 1 → burst', () => {
		let s = run([{ type: 'ALL_GREEN' }], { name: 'checking', view: 'front' });
		expect(s).toEqual({ name: 'countdown', view: 'front', n: 3 });
		s = transition(s, { type: 'TICK' });
		expect(s).toMatchObject({ n: 2 });
		s = run([{ type: 'TICK' }, { type: 'TICK' }], s);
		expect(s).toEqual({ name: 'burst', view: 'front' });
	});

	it('a failing check during the countdown cancels it', () => {
		expect(
			run([{ type: 'ALL_GREEN' }, { type: 'TICK' }, { type: 'CHECK_FAILED' }], {
				name: 'checking',
				view: 'side'
			})
		).toEqual({
			name: 'checking',
			view: 'side'
		});
	});

	it('a bad burst returns to checking the same view', () => {
		expect(transition({ name: 'burst', view: 'side' }, { type: 'BURST_BAD' })).toEqual({
			name: 'checking',
			view: 'side'
		});
	});

	it('front done → side walk-away; side done → computing', () => {
		expect(transition({ name: 'viewDone', view: 'front' }, { type: 'NEXT' })).toEqual({
			name: 'walkAway',
			view: 'side'
		});
		expect(transition({ name: 'viewDone', view: 'side' }, { type: 'NEXT' })).toEqual({
			name: 'computing'
		});
	});

	it('scale disagreement → review with a retake request', () => {
		expect(transition({ name: 'scaleCheck' }, { type: 'SCALE_RETAKE', view: 'side' })).toEqual({
			name: 'review',
			retake: 'side'
		});
	});

	it('retake replaces only that view, then recomputes', () => {
		let s = transition({ name: 'review', retake: null }, { type: 'RETAKE', view: 'front' });
		expect(s).toEqual({ name: 'retake', view: 'front' });
		s = transition(s, { type: 'START' });
		expect(s).toEqual({ name: 'walkAway', view: 'front' });
		s = run(
			[
				{ type: 'WALK_DONE' },
				{ type: 'ALL_GREEN' },
				{ type: 'TICK' },
				{ type: 'TICK' },
				{ type: 'TICK' },
				{ type: 'BURST_OK' },
				{ type: 'NEXT' }
			],
			s,
			{
				retaking: 'front'
			}
		);
		expect(s).toEqual({ name: 'computing' });
	});

	it('permission failure and errors', () => {
		expect(
			transition({ name: 'permissions' }, { type: 'PERMISSIONS_FAILED', kind: 'camera_denied' })
		).toEqual({
			name: 'error',
			kind: 'camera_denied',
			from: 'permissions'
		});
		const e = transition({ name: 'computing' }, { type: 'ERROR', kind: 'worker_crash' });
		expect(e).toEqual({ name: 'error', kind: 'worker_crash', from: 'computing' });
		expect(transition(e, { type: 'START' })).toEqual({ name: 'permissions' });
		expect(
			transition({ name: 'error', kind: 'burst_failed', from: 'burst' }, { type: 'START' })
		).toEqual({ name: 'checking', view: 'front' });
	});

	it('RESET always returns to idle; unknown events are ignored', () => {
		expect(transition({ name: 'review', retake: null }, { type: 'RESET' })).toEqual({
			name: 'idle'
		});
		const s: CaptureState = { name: 'leveling' };
		expect(transition(s, { type: 'TICK' })).toBe(s);
	});
});
