/** Reactive online/offline state for banners and sync triggers. */
export const network = $state({
	online: typeof navigator === 'undefined' ? true : navigator.onLine
});

export function watchNetwork(): () => void {
	const on = () => (network.online = true);
	const off = () => (network.online = false);
	addEventListener('online', on);
	addEventListener('offline', off);
	network.online = navigator.onLine;
	return () => {
		removeEventListener('online', on);
		removeEventListener('offline', off);
	};
}
