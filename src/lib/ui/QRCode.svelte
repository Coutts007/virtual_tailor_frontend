<script lang="ts">
	import QR from 'qrcode';
	import { t } from '$lib/i18n/t.svelte';

	/** QR drawn as SVG from the module matrix, generated in the browser (Section 5). */
	let { text, size = 200, label }: { text: string; size?: number; label?: string } = $props();

	const matrix = $derived.by(() => {
		const q = QR.create(text, { errorCorrectionLevel: 'M' });
		return { n: q.modules.size, data: q.modules.data };
	});
	const path = $derived.by(() => {
		let d = '';
		for (let y = 0; y < matrix.n; y++)
			for (let x = 0; x < matrix.n; x++)
				if (matrix.data[y * matrix.n + x]) d += `M${x + 4},${y + 4}h1v1h-1z`;
		return d;
	});
</script>

<svg
	class="qr"
	width={size}
	height={size}
	viewBox="0 0 {matrix.n + 8} {matrix.n + 8}"
	role="img"
	aria-label={label ?? t('qr.label', { text })}
	shape-rendering="crispEdges"
>
	<rect width="100%" height="100%" fill="#fff" />
	<path d={path} fill="#000" />
</svg>

<style>
	.qr {
		border-radius: 8px;
	}
</style>
