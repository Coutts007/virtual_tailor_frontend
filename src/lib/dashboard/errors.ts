import { ApiError } from '$lib/api/errors';
import type { MessageKey } from '$lib/i18n/en';

/** Maps a stable problem `code` to an i18n key for user-facing messages. */
export function problemKey(e: unknown): MessageKey {
	if (!(e instanceof ApiError)) return 'error.generic.body';
	switch (e.code) {
		case 'network_error':
			return 'error.offline';
		case 'invalid_credentials':
			return 'auth.error.invalid';
		case 'account_pending':
			return 'auth.error.pending';
		case 'account_disabled':
			return 'auth.error.disabled';
		case 'rate_limited':
			return 'auth.error.rateLimited';
		case 'forbidden':
			return 'error.forbidden.body';
		case 'not_found':
			return 'error.notFound.body';
		case 'client_has_orders':
			return 'tailor.client.deleteHasOrders';
		case 'due_date_past':
			return 'validate.duePast';
		case 'ease_out_of_range':
			return 'validate.ease';
		case 'study_mode_off':
			return 'study.off';
		case 'reading_locked':
			return 'study.ref.locked';
		default:
			return 'error.generic.body';
	}
}
