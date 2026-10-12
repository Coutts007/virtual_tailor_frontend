/**
 * Capture sound (Section 10.6): Web Audio tones (no files) and spoken prompts
 * via speechSynthesis when a voice exists for the language; otherwise short
 * recorded clips listed in /audio/manifest.json (none shipped yet [CONFIRM]).
 * Unlocked by the start tap (iOS). Every cue has a visual equivalent.
 */
import type { Lang } from '$lib/i18n/t.svelte';

let ctx: AudioContext | null = null;
let muted = false;
let lastSpoken = 0;
let clips: Record<Lang, string[]> | null = null;

export function setMuted(m: boolean) {
	muted = m;
	if (m) globalThis.speechSynthesis?.cancel();
}
export function isMuted() {
	return muted;
}

/** Call from a user gesture. */
export async function unlockAudio(): Promise<void> {
	try {
		const AC =
			globalThis.AudioContext ??
			(globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return;
		ctx ??= new AC();
		if (ctx.state === 'suspended') await ctx.resume();
		// Prime speech on iOS: an empty utterance inside the gesture.
		globalThis.speechSynthesis?.speak(new SpeechSynthesisUtterance(''));
	} catch {
		/* no audio */
	}
	try {
		clips ??= await (await fetch('/audio/manifest.json')).json();
	} catch {
		clips = { en: [], sw: [] };
	}
}

function tone(freq: number, ms: number, at = 0, type: OscillatorType = 'sine', gain = 0.25) {
	if (!ctx || muted) return;
	const t = ctx.currentTime + at / 1000;
	const o = ctx.createOscillator();
	const g = ctx.createGain();
	o.type = type;
	o.frequency.value = freq;
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(gain, t + 0.01);
	g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
	o.connect(g).connect(ctx.destination);
	o.start(t);
	o.stop(t + ms / 1000 + 0.02);
}

export const sounds = {
	tick: () => tone(1320, 60),
	allGreen: () => (tone(660, 120), tone(990, 160, 110)),
	beep: () => tone(880, 120, 0, 'square', 0.15),
	longBeep: () => tone(880, 450, 0, 'square', 0.15),
	stop: () => (tone(330, 180, 0, 'sawtooth', 0.15), tone(220, 260, 170, 'sawtooth', 0.15)),
	done: () => (tone(523, 120), tone(659, 120, 120), tone(784, 220, 240))
};

function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
	const voices = globalThis.speechSynthesis?.getVoices() ?? [];
	return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

/**
 * Speak a prompt. Rate-limited to one every 3 s unless `force` (countdown and
 * state changes the flow requires).
 */
export function speak(
	text: string,
	lang: Lang,
	opts: { key?: string; force?: boolean; minGapMs?: number } = {}
): void {
	if (muted || !text) return;
	const now = Date.now();
	if (!opts.force && now - lastSpoken < (opts.minGapMs ?? 3000)) return;
	lastSpoken = now;
	const voice = voiceFor(lang);
	if (voice && globalThis.speechSynthesis) {
		globalThis.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.voice = voice;
		u.lang = voice.lang;
		u.rate = 0.95;
		globalThis.speechSynthesis.speak(u);
		return;
	}
	if (opts.key && clips?.[lang]?.includes(opts.key)) {
		void new Audio(`/audio/${lang}/${opts.key}.mp3`).play().catch(() => {});
	}
}
