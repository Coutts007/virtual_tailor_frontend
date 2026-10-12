/** Screen Wake Lock during capture (9.7); re-acquired when the tab is visible again. */
type Sentinel = { release(): Promise<void> };

export function keepAwake(): () => void {
	let sentinel: Sentinel | null = null;
	let active = true;
	const nav = navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<Sentinel> } };
	const acquire = async () => {
		if (!active || !nav.wakeLock || document.visibilityState !== 'visible') return;
		try {
			sentinel = await nav.wakeLock.request('screen');
		} catch {
			/* battery saver or unsupported: capture still works */
		}
	};
	const onVis = () => void acquire();
	document.addEventListener('visibilitychange', onVis);
	void acquire();
	return () => {
		active = false;
		document.removeEventListener('visibilitychange', onVis);
		void sentinel?.release().catch(() => {});
		sentinel = null;
	};
}

/** Fullscreen on Android, requested from the start tap (9.7). */
export async function enterFullscreen(): Promise<void> {
	try {
		if (!document.fullscreenElement && document.documentElement.requestFullscreen)
			await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
	} catch {
		/* iOS Safari or denied */
	}
}
export async function exitFullscreen(): Promise<void> {
	try {
		if (document.fullscreenElement) await document.exitFullscreen();
	} catch {
		/* ignore */
	}
}
