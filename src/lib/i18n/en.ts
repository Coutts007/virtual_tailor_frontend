/**
 * English source dictionary, merged from per-area modules in ./messages so that
 * each surface owns its strings. Every user-visible string goes through t()
 * (Section 16). Placeholders use {name}; plurals use ICU
 * {count, plural, one {# thing} other {# things}}.
 */
import { en as common } from './messages/common.en';
import { en as client } from './messages/client.en';
import { en as tailor } from './messages/tailor.en';
import { en as admin } from './messages/admin.en';
import { en as study } from './messages/study.en';

export const MODULES_EN = { common, client, tailor, admin, study };
export const en = { ...common, ...client, ...tailor, ...admin, ...study } as const;

export type MessageKey = keyof typeof en;
