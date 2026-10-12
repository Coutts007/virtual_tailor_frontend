/**
 * Study image vault (Section 15.6, correction C5). Encrypts the study frames
 * with AES-GCM using a key derived from a researcher passphrase (PBKDF2-SHA-256,
 * ≥ 310,000 iterations) and returns ONE local file for download. Nothing is
 * uploaded and nothing is written to IndexedDB.
 *
 * Saving is behind VITE_FEATURE_STUDY_IMAGES (default false). Until the owner
 * and the MKU ethics committee (IERC) approve it (decision 1), saveVault throws
 * VaultDisabledError and the UI says "Disabled pending ethics approval".
 *
 * File format (.vtimg): "VTIMG1" | salt(16) | iv(12) | AES-GCM ciphertext of
 *   u32 header length | header JSON | frame bytes…
 */
export const PBKDF2_ITERATIONS = 310_000;
const MAGIC = new TextEncoder().encode('VTIMG1');

export function vaultEnabled(): boolean {
	return import.meta.env.VITE_FEATURE_STUDY_IMAGES === 'true';
}

export class VaultDisabledError extends Error {
	constructor() {
		super('Study image saving is disabled pending ethics approval');
		this.name = 'VaultDisabledError';
	}
}

export interface VaultFrame {
	width: number;
	height: number;
	/** e.g. 'rgba8' or 'gray8' or 'image/jpeg' */
	format: string;
	bytes: Uint8Array;
}
export interface VaultMeta {
	participant_code: string;
	set_no: 1 | 2 | 3;
	view: 'front' | 'side' | 'both';
	created_at: string;
}

export function vaultFileName(participant: string, set: number): string {
	// Only the participant code and set number (Section 15.6).
	return `${participant}-set${set}.vtimg`;
}

async function deriveKey(
	passphrase: string,
	salt: Uint8Array,
	iterations = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
	const base = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(passphrase),
		'PBKDF2',
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		base,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export function validatePassphrase(p: string): boolean {
	return p.length >= 12;
}

/** Pure encryption (testable); does not check the feature flag. */
export async function encryptVault(
	frames: VaultFrame[],
	meta: VaultMeta,
	passphrase: string,
	iterations = PBKDF2_ITERATIONS
): Promise<Uint8Array> {
	if (iterations < PBKDF2_ITERATIONS)
		throw new Error('PBKDF2 iterations below the 310,000 minimum');
	const header = new TextEncoder().encode(
		JSON.stringify({
			...meta,
			frames: frames.map(({ width, height, format, bytes }) => ({
				width,
				height,
				format,
				length: bytes.length
			}))
		})
	);
	const total = 4 + header.length + frames.reduce((n, f) => n + f.bytes.length, 0);
	const plain = new Uint8Array(total);
	new DataView(plain.buffer).setUint32(0, header.length);
	plain.set(header, 4);
	let o = 4 + header.length;
	for (const f of frames) {
		plain.set(f.bytes, o);
		o += f.bytes.length;
	}
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(passphrase, salt, iterations);
	const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
	plain.fill(0);
	const out = new Uint8Array(MAGIC.length + 16 + 12 + cipher.length);
	out.set(MAGIC, 0);
	out.set(salt, MAGIC.length);
	out.set(iv, MAGIC.length + 16);
	out.set(cipher, MAGIC.length + 28);
	return out;
}

/** For the study laptop tooling and tests. */
export async function decryptVault(
	file: Uint8Array,
	passphrase: string,
	iterations = PBKDF2_ITERATIONS
): Promise<{ meta: VaultMeta & { frames: Omit<VaultFrame, 'bytes'>[] }; frames: Uint8Array[] }> {
	const magic = new TextDecoder().decode(file.slice(0, MAGIC.length));
	if (magic !== 'VTIMG1') throw new Error('Not a VT image vault file');
	const salt = file.slice(MAGIC.length, MAGIC.length + 16);
	const iv = file.slice(MAGIC.length + 16, MAGIC.length + 28);
	const key = await deriveKey(passphrase, salt, iterations);
	const plain = new Uint8Array(
		await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, file.slice(MAGIC.length + 28))
	);
	const hlen = new DataView(plain.buffer).getUint32(0);
	const meta = JSON.parse(new TextDecoder().decode(plain.slice(4, 4 + hlen)));
	const frames: Uint8Array[] = [];
	let o = 4 + hlen;
	for (const f of meta.frames as { length: number }[]) {
		frames.push(plain.slice(o, o + f.length));
		o += f.length;
	}
	return { meta, frames };
}

/** Encrypts and returns a Blob for a local download, only when the flag is on. */
export async function saveVault(
	frames: VaultFrame[],
	meta: VaultMeta,
	passphrase: string
): Promise<{ blob: Blob; filename: string }> {
	if (!vaultEnabled()) throw new VaultDisabledError();
	const bytes = await encryptVault(frames, meta, passphrase);
	return {
		blob: new Blob([bytes as BlobPart], { type: 'application/octet-stream' }),
		filename: vaultFileName(meta.participant_code, meta.set_no)
	};
}
