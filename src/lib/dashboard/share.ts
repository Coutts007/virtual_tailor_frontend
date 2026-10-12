/** wa.me link with prefilled text (Section 13.3, 13.9). No phone number: the tailor picks the chat. */
export function waLink(text: string): string {
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Opens a URL in a new tab without giving it access to this window. */
export function openExternal(url: string): void {
	window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
