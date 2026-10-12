import { describe, expect, it } from 'vitest';
import { parseUserAgent } from '../../src/lib/device/deviceInfo';
import {
	browserStatus,
	memoryStatus,
	resolutionStatus,
	verdict
} from '../../src/lib/device/preflight';

const UA = {
	tecno:
		'Mozilla/5.0 (Linux; Android 14; TECNO KL8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
	oldChrome:
		'Mozilla/5.0 (Linux; Android 11; SM-A105F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.0 Mobile Safari/537.36',
	chrome100:
		'Mozilla/5.0 (Linux; Android 12; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36',
	android10:
		'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
	samsung:
		'Mozilla/5.0 (Linux; Android 13; SM-A165F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
	iphone:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
	ios165:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
	ios164:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
	oldIphone:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1'
};

describe('device parsing and platform floor (2.2, C3)', () => {
	it('parses Android/Chrome, Samsung Internet and iOS Safari', () => {
		expect(parseUserAgent(UA.tecno)).toMatchObject({
			device_model: 'TECNO KL8',
			os_name: 'android',
			os_major: 14,
			browser_name: 'chrome',
			browser_major: 128
		});
		expect(parseUserAgent(UA.samsung)).toMatchObject({
			browser_name: 'samsung',
			browser_major: 23,
			browser: 'Samsung Internet 23'
		});
		expect(parseUserAgent(UA.iphone)).toMatchObject({
			device_model: 'iPhone',
			os_name: 'ios',
			browser_name: 'safari',
			os: 'iOS 17.5',
			browser: 'Safari 17.5'
		});
	});

	it.each([
		['tecno', 'pass'],
		['chrome100', 'caution'],
		['oldChrome', 'fail'],
		['android10', 'fail'],
		['samsung', 'pass'],
		['iphone', 'pass'],
		['ios165', 'pass'],
		['ios164', 'pass'],
		['oldIphone', 'fail']
	] as const)('%s → %s', (k, expected) => {
		expect(browserStatus({ ...parseUserAgent(UA[k]), memory_gb: 4 })).toBe(expected);
	});

	it('memory: ≤ 2 GB fail, 3 GB caution, unknown skipped', () => {
		expect([memoryStatus(2), memoryStatus(3), memoryStatus(4), memoryStatus(null)]).toEqual([
			'fail',
			'caution',
			'pass',
			'skip'
		]);
	});

	it('camera resolution: < 1280 fail, < 1920 caution', () => {
		expect([
			resolutionStatus(1280),
			resolutionStatus(1279),
			resolutionStatus(1920),
			resolutionStatus(null)
		]).toEqual(['caution', 'fail', 'pass', 'pending']);
	});

	it('verdict: any fail → cannot; any caution → slower', () => {
		expect(
			verdict([
				{ id: 'secure', status: 'pass' },
				{ id: 'memory', status: 'caution' }
			])
		).toBe('slower');
		expect(
			verdict([
				{ id: 'simd', status: 'fail' },
				{ id: 'memory', status: 'caution' }
			])
		).toBe('cannot');
		expect(
			verdict([
				{ id: 'secure', status: 'pass' },
				{ id: 'memory', status: 'skip' }
			])
		).toBe('ready');
	});
});
