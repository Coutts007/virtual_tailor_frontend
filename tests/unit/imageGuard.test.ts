import { beforeEach, describe, expect, it } from 'vitest';
import {
	assertNoImageData,
	findImageLike,
	ImageDataForbiddenError
} from '../../src/lib/db/imageGuard';
import { VtDatabase, setDb } from '../../src/lib/db/dexie';

describe('no image in local storage (privacy invariant 2.1.1)', () => {
	it('accepts plain numbers, strings and small typed arrays', () => {
		expect(findImageLike({ a: 1, b: 'x', c: [1, 2], d: new Float32Array(33 * 4) })).toBeNull();
	});
	it('rejects Blob and File', () => {
		expect(findImageLike({ x: new Blob(['a']) })).toBe('$.x');
		expect(findImageLike([{ f: new File(['a'], 'a.jpg') }])).toBe('$[0].f');
	});
	it('rejects data:image strings anywhere', () => {
		expect(findImageLike({ nested: { thumb: 'data:image/png;base64,AAAA' } })).toBe(
			'$.nested.thumb'
		);
	});
	it('rejects binary buffers larger than 64 KB', () => {
		expect(findImageLike({ buf: new ArrayBuffer(64 * 1024 + 1) })).toBe('$.buf');
		expect(findImageLike({ mask: new Uint8Array(1080 * 1920) })).toBe('$.mask');
		expect(findImageLike({ ok: new Uint8Array(1024) })).toBeNull();
	});
	it('rejects ImageData-like objects when the global exists', () => {
		class ImageData {}
		(globalThis as Record<string, unknown>).ImageData = ImageData;
		try {
			expect(findImageLike({ img: new ImageData() })).toBe('$.img');
		} finally {
			delete (globalThis as Record<string, unknown>).ImageData;
		}
	});
	it('handles cycles', () => {
		const a: Record<string, unknown> = {};
		a.self = a;
		expect(findImageLike(a)).toBeNull();
	});
	it('assertNoImageData throws a typed error', () => {
		expect(() => assertNoImageData({ b: new Blob([]) })).toThrow(ImageDataForbiddenError);
	});
});

describe('Dexie write hooks enforce the guard', () => {
	let db: VtDatabase;
	beforeEach(async () => {
		db = new VtDatabase(`test-${crypto.randomUUID()}`);
		setDb(db);
		await db.open();
	});

	it('schema v1 has the three tables', () => {
		expect(db.tables.map((t) => t.name).sort()).toEqual(['pending_sync', 'profiles', 'settings']);
	});

	it('allows a normal setting', async () => {
		await db.settings.put({ key: 'language', value: 'sw' });
		expect((await db.settings.get('language'))?.value).toBe('sw');
	});

	it('refuses to create a record with an image', async () => {
		await expect(db.settings.add({ key: 'x', value: new Blob(['jpeg']) })).rejects.toThrow();
		expect(await db.settings.get('x')).toBeUndefined();
	});

	it('refuses to update a record with an image', async () => {
		await db.settings.put({ key: 'y', value: 1 });
		await expect(
			db.settings.update('y', { value: 'data:image/jpeg;base64,/9j/' })
		).rejects.toThrow();
		expect((await db.settings.get('y'))?.value).toBe(1);
	});
});
