/**
 * Writes a portrait 1080×1920 Y4M clip for Chromium's fake camera: a wall-grey
 * background with the ArUco DICT_4X4_50 id 0 marker (white quiet zone) at chest
 * height. Generated at test time; never committed.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { MARKER } from '../../../src/lib/vision/marker';

export const Y4M_PATH = 'test-results/fixtures/marker-1080x1920.y4m';

export function makeY4m(path = Y4M_PATH, frames = 2): string {
	if (existsSync(path)) return path;
	const W = 1080,
		H = 1920,
		MOD = 30; // 180 px marker
	const Y = new Uint8Array(W * H).fill(150);
	const x0 = (W - 6 * MOD) / 2,
		y0 = 640;
	for (let y = y0 - MOD; y < y0 + 7 * MOD; y++)
		for (let x = x0 - MOD; x < x0 + 7 * MOD; x++) Y[y * W + x] = 255;
	for (let r = 0; r < 6; r++)
		for (let c = 0; c < 6; c++) {
			const black = r === 0 || c === 0 || r === 5 || c === 5 || MARKER.bits[r - 1]![c - 1] === 0;
			if (!black) continue;
			for (let y = 0; y < MOD; y++)
				Y.fill(
					10,
					(y0 + r * MOD + y) * W + x0 + c * MOD,
					(y0 + r * MOD + y) * W + x0 + c * MOD + MOD
				);
		}
	const UV = new Uint8Array((W / 2) * (H / 2)).fill(128);
	const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F15:1 Ip A1:1 C420jpeg\n`);
	const parts: Buffer[] = [header];
	for (let f = 0; f < frames; f++)
		parts.push(Buffer.from('FRAME\n'), Buffer.from(Y), Buffer.from(UV), Buffer.from(UV));
	mkdirSync('test-results/fixtures', { recursive: true });
	writeFileSync(path, Buffer.concat(parts));
	return path;
}
