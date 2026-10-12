/** Install prompt (9.14): captured early, offered only on Saved after a first success. */
type BIPEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };

export const install = $state<{ event: BIPEvent | null; installed: boolean }>({
	event: null,
	installed: false
});

export function captureInstallPrompt(): () => void {
	const onPrompt = (e: Event) => {
		e.preventDefault();
		install.event = e as BIPEvent;
	};
	const onInstalled = () => (install.installed = true);
	addEventListener('beforeinstallprompt', onPrompt);
	addEventListener('appinstalled', onInstalled);
	return () => {
		removeEventListener('beforeinstallprompt', onPrompt);
		removeEventListener('appinstalled', onInstalled);
	};
}

export async function promptInstall(): Promise<void> {
	const e = install.event;
	if (!e) return;
	install.event = null;
	await e.prompt();
}

export function isIos(): boolean {
	return (
		/iPhone|iPad|iPod/.test(navigator.userAgent) &&
		!(navigator as Navigator & { standalone?: boolean }).standalone
	);
}
