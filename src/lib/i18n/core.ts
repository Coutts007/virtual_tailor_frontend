/**
 * Strings bundled with every surface: shared/component strings and the client
 * app (Section 18 budget). Dashboard, admin and study strings load on demand
 * through loadMessages() in their route-group layouts.
 */
import { en as commonEn } from './messages/common.en';
import { sw as commonSw } from './messages/common.sw';
import { en as clientEn } from './messages/client.en';
import { sw as clientSw } from './messages/client.sw';

export const coreEn: Record<string, string> = { ...commonEn, ...clientEn };
export const coreSw: Record<string, string> = { ...commonSw, ...clientSw };

export type LazyModule = 'tailor' | 'admin' | 'study';

export const LOADERS: Record<
	LazyModule,
	() => Promise<[Record<string, string>, Record<string, string>]>
> = {
	tailor: async () => {
		const [e, s] = await Promise.all([
			import('./messages/tailor.en'),
			import('./messages/tailor.sw')
		]);
		return [e.en, s.sw];
	},
	admin: async () => {
		const [e, s] = await Promise.all([
			import('./messages/admin.en'),
			import('./messages/admin.sw')
		]);
		return [e.en, s.sw];
	},
	study: async () => {
		const [e, s] = await Promise.all([
			import('./messages/study.en'),
			import('./messages/study.sw')
		]);
		return [e.en, s.sw];
	}
};
