/** RFC 9457 problem details with a stable `code` the UI maps to i18n (Section 20.1). */
export type ProblemCode =
	| 'invalid_credentials'
	| 'account_pending'
	| 'account_disabled'
	| 'rate_limited'
	| 'token_expired'
	| 'forbidden'
	| 'not_found'
	| 'code_not_found'
	| 'validation_failed'
	| 'profile_version_conflict'
	| 'client_has_orders'
	| 'due_date_past'
	| 'ease_out_of_range'
	| 'study_mode_off'
	| 'reading_locked'
	| 'network_error'
	| 'unknown';

export interface Problem {
	type?: string;
	title?: string;
	status: number;
	code: ProblemCode;
	detail?: string;
	errors?: { field: string; code: string }[];
	server_version?: number;
	retry_after_s?: number;
	[extra: string]: unknown;
}

export class ApiError extends Error {
	constructor(public problem: Problem) {
		super(problem.title ?? problem.code);
		this.name = 'ApiError';
	}
	get status() {
		return this.problem.status;
	}
	get code() {
		return this.problem.code;
	}
}

export function isApiError(e: unknown, code?: ProblemCode): e is ApiError {
	return e instanceof ApiError && (code === undefined || e.code === code);
}
