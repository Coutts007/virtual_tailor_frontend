import { describe, expect, it } from 'vitest';
import { BearerSessionTransport } from '../../src/lib/auth/transport';
import { guard } from '../../src/lib/auth/guards';
import type { SessionUser } from '../../src/lib/api/types';

class MemStorage implements Storage {
	private m = new Map<string, string>();
	get length() {
		return this.m.size;
	}
	clear() {
		this.m.clear();
	}
	getItem(k: string) {
		return this.m.get(k) ?? null;
	}
	key(i: number) {
		return [...this.m.keys()][i] ?? null;
	}
	removeItem(k: string) {
		this.m.delete(k);
	}
	setItem(k: string, v: string) {
		this.m.set(k, v);
	}
}

const user: SessionUser = {
	user_id: 'u1',
	email: 't@vt.test',
	role: 'tailor',
	status: 'active',
	locale: 'en'
};
const future = () => new Date(Date.now() + 3600_000).toISOString();

describe('BearerSessionTransport (decision 4)', () => {
	it('keeps the token in memory and sessionStorage, never localStorage', () => {
		const ss = new MemStorage();
		const t = new BearerSessionTransport(ss);
		t.save({ access_token: 'abc', expires_at: future(), user });
		expect(t.headers()).toEqual({ Authorization: 'Bearer abc' });
		expect(ss.getItem('vt.session')).toContain('abc');
		// A new tab-scoped instance restores from sessionStorage.
		expect(new BearerSessionTransport(ss).load()?.user.email).toBe('t@vt.test');
	});
	it('drops expired tokens', () => {
		const ss = new MemStorage();
		const t = new BearerSessionTransport(ss);
		t.save({ access_token: 'abc', expires_at: new Date(Date.now() - 1).toISOString(), user });
		expect(t.headers()).toEqual({});
		expect(new BearerSessionTransport(ss).load()).toBeNull();
		expect(ss.getItem('vt.session')).toBeNull();
	});
	it('clear() wipes memory and storage', () => {
		const ss = new MemStorage();
		const t = new BearerSessionTransport(ss);
		t.save({ access_token: 'abc', expires_at: future(), user });
		t.clear();
		expect(t.headers()).toEqual({});
		expect(ss.length).toBe(0);
	});
});

describe('role guards (Section 7.2)', () => {
	it('redirects anonymous users to login with next=', () => {
		expect(guard(null, '/t/orders', ['tailor'])).toEqual({
			ok: false,
			redirect: '/login?next=%2Ft%2Forders'
		});
	});
	it('wrong role → 403', () => {
		expect(guard(user, '/admin/accounts', ['admin'])).toMatchObject({ ok: false, status: 403 });
	});
	it('pending tailors only see /register/pending', () => {
		const p = { ...user, status: 'pending' as const };
		expect(guard(p, '/t/orders', ['tailor'])).toEqual({ ok: false, redirect: '/register/pending' });
		expect(guard(p, '/register/pending', ['tailor'])).toEqual({ ok: true });
	});
	it('disabled accounts get the disabled message', () => {
		expect(guard({ ...user, status: 'disabled' }, '/t/orders', ['tailor'])).toEqual({
			ok: false,
			redirect: '/login?state=disabled'
		});
	});
	it('study routes 404 when study mode is off', () => {
		expect(
			guard(user, '/study/reference', ['measurer'], { studyRoute: true, studyMode: false })
		).toMatchObject({
			status: 404
		});
	});
});
