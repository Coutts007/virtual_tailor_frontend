/**
 * Device facts copied into each capture session (Section 9.4). No fingerprinting
 * beyond what the session record needs; nothing here is personal data.
 */
export interface DeviceInfo {
	device_model: string;
	os: string;
	browser: string;
	browser_name: 'chrome' | 'samsung' | 'safari' | 'firefox' | 'other';
	browser_major: number;
	os_name: 'android' | 'ios' | 'other';
	os_major: number;
	memory_gb: number | null;
}

type UAData = {
	brands?: { brand: string; version: string }[];
	platform?: string;
	getHighEntropyValues?: (h: string[]) => Promise<{ model?: string; platformVersion?: string }>;
};

export function parseUserAgent(ua: string): Omit<DeviceInfo, 'memory_gb'> {
	const num = (re: RegExp) => Number(ua.match(re)?.[1] ?? 0);
	const ios = /iPhone|iPad|iPod/.test(ua);
	const android = /Android/.test(ua);
	let browser_name: DeviceInfo['browser_name'] = 'other';
	let browser_major = 0;
	if (/SamsungBrowser\/(\d+)/.test(ua)) {
		browser_name = 'samsung';
		browser_major = num(/SamsungBrowser\/(\d+)/);
	} else if (/CriOS\/(\d+)/.test(ua)) {
		browser_name = 'chrome';
		browser_major = num(/CriOS\/(\d+)/);
	} else if (/Chrome\/(\d+)/.test(ua) && !/Edg\//.test(ua)) {
		browser_name = 'chrome';
		browser_major = num(/Chrome\/(\d+)/);
	} else if (/Firefox\/(\d+)/.test(ua)) {
		browser_name = 'firefox';
		browser_major = num(/Firefox\/(\d+)/);
	} else if (/Version\/(\d+)(?:\.(\d+))?.*Safari/.test(ua)) {
		browser_name = 'safari';
		const m = ua.match(/Version\/(\d+)(?:\.(\d+))?/);
		browser_major = Number(m?.[1] ?? 0) + Number(m?.[2] ?? 0) / 100;
	}
	const os_name: DeviceInfo['os_name'] = ios ? 'ios' : android ? 'android' : 'other';
	const iosV = ua.match(/OS (\d+)_(\d+)/);
	// Versions are compared as major + minor / 100 (16.4 → 16.04, 16.10 → 16.1).
	const os_major = ios
		? Number(iosV?.[1] ?? 0) + Number(iosV?.[2] ?? 0) / 100
		: android
			? num(/Android (\d+)/)
			: 0;
	const model = ios
		? 'iPhone'
		: android
			? (ua.match(/Android [\d.]+; ([^;)]+)/)?.[1]?.trim() ?? 'Android')
			: 'Desktop';
	return {
		device_model: model === 'K' ? 'Android' : model,
		os: ios
			? `iOS ${iosV?.[1] ?? '?'}.${iosV?.[2] ?? 0}`
			: android
				? `Android ${os_major}`
				: 'other',
		browser: `${browser_name === 'samsung' ? 'Samsung Internet' : browser_name[0]!.toUpperCase() + browser_name.slice(1)} ${
			browser_name === 'safari'
				? (ua.match(/Version\/([\d.]+)/)?.[1] ?? '')
				: Math.floor(browser_major)
		}`,
		browser_name,
		browser_major,
		os_name,
		os_major
	};
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
	const base = parseUserAgent(navigator.userAgent);
	const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
	const uad = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
	if (uad?.getHighEntropyValues) {
		try {
			// UA reduction hides the model; UA-CH gives it on Chromium (9.4).
			const h = await uad.getHighEntropyValues(['model', 'platformVersion']);
			if (h.model) base.device_model = h.model;
			if (base.os_name === 'android' && h.platformVersion) {
				base.os_major = Number(h.platformVersion.split('.')[0]);
				base.os = `Android ${base.os_major}`;
			}
		} catch {
			/* not granted */
		}
	}
	return { ...base, memory_gb: memory };
}
