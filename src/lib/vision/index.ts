/**
 * Chooses the vision engine. Production always uses the real camera pipeline
 * (Phase 3). Development defaults to the FakeVisionEngine unless /dev/capture-tuning
 * selects "real". Fake code is loaded lazily so it never weighs on the client flow.
 */
import { dev } from '$app/environment';
import type { Sex } from '$lib/api/types';
import type { VisionEngine } from './types';

export interface VisionPrefs {
	mode: 'fake' | 'real';
	scenario: string;
	timeScale: number;
}
const KEY = 'vt.vision';

export function visionPrefs(): VisionPrefs {
	const def: VisionPrefs = { mode: dev ? 'fake' : 'real', scenario: 'happy', timeScale: 1 };
	if (!dev) return def;
	try {
		return { ...def, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<VisionPrefs>) };
	} catch {
		return def;
	}
}

export function setVisionPrefs(p: Partial<VisionPrefs>) {
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...visionPrefs(), ...p }));
	} catch {
		/* ignore */
	}
}

export function isSimulated(): boolean {
	return visionPrefs().mode === 'fake';
}

export async function createEngine(body: { height_mm: number; sex: Sex }): Promise<VisionEngine> {
	const p = visionPrefs();
	if (p.mode === 'fake') {
		const { FakeVisionEngine } = await import('./fake');
		return new FakeVisionEngine({ scenarioId: p.scenario, timeScale: p.timeScale, ...body });
	}
	const { RealVisionEngine } = await import('./real');
	return new RealVisionEngine();
}
