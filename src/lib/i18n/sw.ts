import type { MessageKey } from './en';
import { sw as common } from './messages/common.sw';
import { sw as client } from './messages/client.sw';
import { sw as tailor } from './messages/tailor.sw';
import { sw as admin } from './messages/admin.sw';
import { sw as study } from './messages/study.sw';

/** Kiswahili draft, merged from ./messages (decision 10). */
export const MODULES_SW = { common, client, tailor, admin, study };
export const sw: Record<MessageKey, string> = {
	...common,
	...client,
	...tailor,
	...admin,
	...study
};
