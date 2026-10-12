import type { ApiClient } from './client';
import { ApiError, type Problem } from './errors';
import type * as T from './types';

export interface HttpOptions {
	baseUrl: string;
	/** Returns extra headers (e.g. Authorization) per request. */
	authHeaders?: () => Record<string, string>;
	/** Called on 401 from an authenticated endpoint (sign out, go to /login?next=). */
	onUnauthorized?: (problem: Problem) => void;
	fetchImpl?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined | null | string[]>;

function qs(q: Query = {}): string {
	const p = new URLSearchParams();
	for (const [k, v] of Object.entries(q)) {
		if (v == null || v === '') continue;
		if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
		else p.set(k, String(v));
	}
	const s = p.toString();
	return s ? `?${s}` : '';
}

const enc = encodeURIComponent;

export class HttpApiClient implements ApiClient {
	constructor(private opts: HttpOptions) {}

	protected async request<R>(
		method: string,
		path: string,
		body?: unknown,
		headers: Record<string, string> = {}
	): Promise<R> {
		const f = this.opts.fetchImpl ?? fetch;
		let res: Response;
		try {
			res = await f(`${this.opts.baseUrl}${path}`, {
				method,
				headers: {
					Accept: 'application/json',
					...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
					...(this.opts.authHeaders?.() ?? {}),
					...headers
				},
				body: body !== undefined ? JSON.stringify(body) : undefined,
				credentials: 'same-origin',
				cache: 'no-store'
			});
		} catch {
			throw new ApiError({ status: 0, code: 'network_error', title: 'Network error' });
		}
		if (res.status === 204 || (res.status === 202 && res.headers.get('Content-Length') === '0')) {
			return undefined as R;
		}
		const type = res.headers.get('Content-Type') ?? '';
		if (!res.ok) {
			let problem: Problem = { status: res.status, code: 'unknown' };
			if (type.includes('json')) {
				try {
					problem = { ...problem, ...(await res.json()) };
				} catch {
					/* not JSON after all */
				}
			}
			const ra = res.headers.get('Retry-After');
			if (ra) problem.retry_after_s = Number(ra);
			if (res.status === 401 && !path.startsWith('/auth/login'))
				this.opts.onUnauthorized?.(problem);
			throw new ApiError(problem);
		}
		if (type.includes('json')) return (await res.json()) as R;
		return (await res.text()) as R;
	}

	// Public and client app
	getPublicSettings() {
		return this.request<T.PublicSettings>('GET', '/settings/public');
	}
	checkClientCode(code: string) {
		return this.request<T.ClientCodeCheck>('GET', `/client-codes/${enc(code)}`);
	}
	syncProfile(payload: T.MeasurementProfilePayload) {
		return this.request<{ profile_id: string; version: number }>('POST', '/profiles', payload, {
			'Idempotency-Key': payload.profile_id
		});
	}
	requestDeletion(input: Parameters<ApiClient['requestDeletion']>[0]) {
		return this.request<{ request_id: string }>('POST', '/deletion-requests', input);
	}

	// Auth
	register(input: T.RegisterInput) {
		return this.request<{ status: 'pending' }>('POST', '/auth/register', input);
	}
	login(email: string, password: string) {
		return this.request<T.LoginResponse>('POST', '/auth/login', { email, password });
	}
	logout() {
		return this.request<void>('POST', '/auth/logout');
	}
	getMe() {
		return this.request<T.Me>('GET', '/me');
	}
	updateMe(patch: T.MePatch) {
		return this.request<T.Me>('PATCH', '/me', patch);
	}
	changePassword(current_password: string, new_password: string) {
		return this.request<void>('POST', '/me/password', { current_password, new_password });
	}

	// Clients and profiles
	listClients(q: T.ClientListQuery = {}) {
		return this.request<T.Page<T.ClientSummary>>('GET', `/clients${qs({ ...q })}`);
	}
	issueClientCode(input: T.IssueCodeInput) {
		return this.request<T.IssueCodeResponse>('POST', '/clients', input);
	}
	getClient(id: string) {
		return this.request<T.ClientDetail>('GET', `/clients/${enc(id)}`);
	}
	updateClient(id: string, patch: { display_name?: string | null; height_mm?: number | null }) {
		return this.request<T.ClientDetail>('PATCH', `/clients/${enc(id)}`, patch);
	}
	rotateClientCode(id: string) {
		return this.request<{ client_code: string }>('POST', `/clients/${enc(id)}/rotate-code`);
	}
	deleteClient(id: string) {
		return this.request<void>('DELETE', `/clients/${enc(id)}`);
	}
	listClientProfiles(id: string) {
		return this.request<T.ProfileSummary[]>('GET', `/clients/${enc(id)}/profiles`);
	}
	getProfile(id: string) {
		return this.request<T.MeasurementProfile>('GET', `/profiles/${enc(id)}`);
	}
	listConflicts() {
		return this.request<T.ConflictPair[]>('GET', '/conflicts');
	}
	resolveConflict(profileId: string, keep: 'newer' | 'server') {
		return this.request<void>('POST', `/conflicts/${enc(profileId)}/resolve`, { keep });
	}

	// Orders and sheets
	listOrders(q: T.OrderListQuery = {}) {
		return this.request<T.Page<T.OrderSummary> & { counts: Record<string, number> }>(
			'GET',
			`/orders${qs({ ...q, status: q.status as string | string[] | undefined })}`
		);
	}
	createOrder(input: T.OrderCreateInput) {
		return this.request<T.Order>('POST', '/orders', input);
	}
	getOrder(id: string) {
		return this.request<T.Order>('GET', `/orders/${enc(id)}`);
	}
	updateOrder(id: string, patch: T.OrderPatch) {
		return this.request<T.Order>('PATCH', `/orders/${enc(id)}`, patch);
	}
	deleteOrder(id: string) {
		return this.request<void>('DELETE', `/orders/${enc(id)}`);
	}
	generateSheet(orderId: string, include_name: boolean) {
		return this.request<T.SheetResponse>('POST', `/orders/${enc(orderId)}/sheets`, {
			include_name
		});
	}
	logShare(sheetId: string, via: T.ShareVia) {
		return this.request<void>('POST', `/sheets/${enc(sheetId)}/shares`, { via });
	}

	// Audit
	listAudit(q: T.AuditQuery = {}) {
		return this.request<T.Page<T.AuditEntry>>('GET', `/audit${qs({ ...q })}`);
	}
	exportAuditCsv(q: T.AuditQuery = {}) {
		return this.request<string>('GET', `/admin/audit.csv${qs({ ...q })}`, undefined, {
			Accept: 'text/csv'
		});
	}

	// Admin
	listAccounts(status?: T.AccountStatus) {
		return this.request<T.Account[]>('GET', `/admin/accounts${qs({ status })}`);
	}
	approveAccount(id: string) {
		return this.request<T.Account>('POST', `/admin/accounts/${enc(id)}/approve`);
	}
	rejectAccount(id: string, reason: string) {
		return this.request<T.Account>('POST', `/admin/accounts/${enc(id)}/reject`, { reason });
	}
	disableAccount(id: string) {
		return this.request<T.Account>('POST', `/admin/accounts/${enc(id)}/disable`);
	}
	enableAccount(id: string) {
		return this.request<T.Account>('POST', `/admin/accounts/${enc(id)}/enable`);
	}
	createMeasurer(input: T.MeasurerInput) {
		return this.request<T.Account>('POST', '/admin/measurers', input);
	}
	getAdminSettings() {
		return this.request<T.AdminSettings>('GET', '/admin/settings');
	}
	putAdminSettings(s: T.AdminSettings) {
		return this.request<T.AdminSettings>('PUT', '/admin/settings', s);
	}
	listDeletionRequests() {
		return this.request<T.DeletionRequest[]>('GET', '/admin/deletion-requests');
	}

	// Study
	listParticipants() {
		return this.request<T.Participant[]>('GET', '/study/participants');
	}
	enrolParticipant(input: T.ParticipantInput) {
		return this.request<{ participant_id: string; client_code: string }>(
			'POST',
			'/study/participants',
			input
		);
	}
	submitReferenceReading(input: T.ReferenceReadingInput) {
		return this.request<T.ReferenceReadingResult>('POST', '/study/reference-readings', input);
	}
	exportStudyCsv(kind: 'captures' | 'reference') {
		return this.request<string>('GET', `/study/export/${kind}.csv`, undefined, {
			Accept: 'text/csv'
		});
	}
}
