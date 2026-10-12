/**
 * Capture flow state machine (Section 10.7), hand-written and typed. Pure
 * reducer: transition(state, event) → state. Unknown events leave the state
 * unchanged, so the UI can send events freely.
 */
import type { View } from './checks';

export type ErrorKind =
	| 'camera_denied'
	| 'camera_unavailable'
	| 'motion_denied'
	| 'models_missing'
	| 'worker_crash'
	| 'burst_failed';

export type CaptureState =
	| { name: 'idle' }
	| { name: 'permissions' }
	| { name: 'leveling' }
	| { name: 'walkAway'; view: View }
	| { name: 'checking'; view: View }
	| { name: 'countdown'; view: View; n: number }
	| { name: 'burst'; view: View }
	| { name: 'viewDone'; view: View }
	| { name: 'computing' }
	| { name: 'scaleCheck' }
	| { name: 'review'; retake: View | null }
	| { name: 'retake'; view: View }
	| { name: 'saved' }
	| { name: 'discarded' }
	| { name: 'error'; kind: ErrorKind; from: CaptureState['name'] };

export type CaptureEvent =
	| { type: 'START' }
	| { type: 'PERMISSIONS_OK' }
	| { type: 'PERMISSIONS_FAILED'; kind: ErrorKind }
	| { type: 'LEVEL_OK' }
	| { type: 'WALK_DONE' }
	| { type: 'ALL_GREEN' }
	| { type: 'CHECK_FAILED' }
	| { type: 'TICK' }
	| { type: 'BURST_OK' }
	| { type: 'BURST_BAD' }
	| { type: 'NEXT' }
	| { type: 'COMPUTED' }
	| { type: 'SCALE_OK' }
	| { type: 'SCALE_RETAKE'; view: View }
	| { type: 'RETAKE'; view: View }
	| { type: 'SAVE' }
	| { type: 'DISCARD' }
	| { type: 'ERROR'; kind: ErrorKind }
	| { type: 'RESET' };

export const COUNTDOWN_FROM = 3;

/** Views still to capture after a retake: only the retaken view (UX principle 6). */
export function transition(
	s: CaptureState,
	e: CaptureEvent,
	ctx: { retaking?: View | null } = {}
): CaptureState {
	if (e.type === 'RESET') return { name: 'idle' };
	if (e.type === 'ERROR')
		return s.name === 'error' ? s : { name: 'error', kind: e.kind, from: s.name };

	switch (s.name) {
		case 'idle':
			return e.type === 'START' ? { name: 'permissions' } : s;
		case 'permissions':
			if (e.type === 'PERMISSIONS_OK') return { name: 'leveling' };
			if (e.type === 'PERMISSIONS_FAILED')
				return { name: 'error', kind: e.kind, from: 'permissions' };
			return s;
		case 'leveling':
			return e.type === 'LEVEL_OK' ? { name: 'walkAway', view: 'front' } : s;
		case 'walkAway':
			return e.type === 'WALK_DONE' ? { name: 'checking', view: s.view } : s;
		case 'checking':
			return e.type === 'ALL_GREEN' ? { name: 'countdown', view: s.view, n: COUNTDOWN_FROM } : s;
		case 'countdown':
			if (e.type === 'CHECK_FAILED') return { name: 'checking', view: s.view };
			if (e.type === 'TICK')
				return s.n > 1 ? { ...s, n: s.n - 1 } : { name: 'burst', view: s.view };
			return s;
		case 'burst':
			if (e.type === 'BURST_OK') return { name: 'viewDone', view: s.view };
			if (e.type === 'BURST_BAD') return { name: 'checking', view: s.view };
			return s;
		case 'viewDone':
			if (e.type !== 'NEXT') return s;
			if (ctx.retaking) return { name: 'computing' };
			return s.view === 'front' ? { name: 'walkAway', view: 'side' } : { name: 'computing' };
		case 'computing':
			return e.type === 'COMPUTED' ? { name: 'scaleCheck' } : s;
		case 'scaleCheck':
			if (e.type === 'SCALE_OK') return { name: 'review', retake: null };
			if (e.type === 'SCALE_RETAKE') return { name: 'review', retake: e.view };
			return s;
		case 'review':
			if (e.type === 'RETAKE') return { name: 'retake', view: e.view };
			if (e.type === 'SAVE') return { name: 'saved' };
			if (e.type === 'DISCARD') return { name: 'discarded' };
			return s;
		case 'retake':
			return e.type === 'START' ? { name: 'walkAway', view: s.view } : s;
		case 'error':
			if (e.type === 'START')
				return s.kind === 'burst_failed'
					? { name: 'checking', view: 'front' }
					: { name: 'permissions' };
			return s;
		default:
			return s;
	}
}
