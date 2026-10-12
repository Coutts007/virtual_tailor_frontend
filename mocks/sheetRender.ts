/**
 * Mock rendering of the specification sheet (Figure 5.6). The real backend
 * renders PNG and PDF server-side; this stand-in draws an SVG, rasterises it to
 * PNG in the browser (canvas) and writes a minimal text PDF.
 */
export interface SheetModel {
	title: string;
	lines: string[];
	footer: string;
	qrLabel: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sheetSvg(m: SheetModel): string {
	const W = 1240;
	const H = 1754; // A4 at 150 dpi
	const rows = m.lines
		.map(
			(l, i) =>
				`<text x="100" y="${360 + i * 64}" font-size="34" font-family="sans-serif" fill="#1F1C18">${esc(l)}</text>`
		)
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fff"/>
<rect x="0" y="0" width="${W}" height="140" fill="#2E3A87"/>
<text x="100" y="92" font-size="52" font-weight="700" font-family="sans-serif" fill="#fff">Virtual Tailor · Specification sheet</text>
<text x="100" y="240" font-size="30" font-family="sans-serif" fill="#5C554C">${esc(m.title)}</text>
<line x1="100" y1="290" x2="${W - 100}" y2="290" stroke="#DDD5C8" stroke-width="3"/>
${rows}
<rect x="${W - 340}" y="${H - 400}" width="240" height="240" fill="none" stroke="#1F1C18" stroke-width="4"/>
<text x="${W - 220}" y="${H - 270}" font-size="22" text-anchor="middle" font-family="monospace" fill="#1F1C18">QR</text>
<text x="${W - 220}" y="${H - 240}" font-size="16" text-anchor="middle" font-family="monospace" fill="#5C554C">${esc(m.qrLabel.slice(0, 18))}</text>
<text x="100" y="${H - 80}" font-size="26" font-family="sans-serif" fill="#5C554C">${esc(m.footer)}</text>
</svg>`;
}

/** PNG via canvas when running in a browser; SVG bytes otherwise (node tests). */
export async function sheetPng(
	m: SheetModel
): Promise<{ body: ArrayBuffer | string; type: string }> {
	const svg = sheetSvg(m);
	if (typeof document === 'undefined' || typeof Image === 'undefined') {
		return { body: svg, type: 'image/svg+xml' };
	}
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		img.src = url;
		await img.decode();
		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		canvas.getContext('2d')!.drawImage(img, 0, 0);
		const blob = await new Promise<Blob>((res, rej) =>
			canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png')
		);
		canvas.width = canvas.height = 0;
		return { body: await blob.arrayBuffer(), type: 'image/png' };
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** A minimal single-page A4 PDF with Helvetica text lines. */
export function sheetPdf(m: SheetModel): string {
	const ascii = (s: string) =>
		s
			.replace(/✓/g, 'OK')
			.replace(/▲/g, '^')
			.replace(/—/g, '-')
			.replace(/·/g, '-')
			.replace(/[^\x20-\x7E]/g, '?')
			.replace(/([()\\])/g, '\\$1');
	const lines = ['Virtual Tailor - Specification sheet', m.title, '', ...m.lines, '', m.footer];
	const text = lines
		.map((l, i) => `BT /F1 ${i === 0 ? 18 : 12} Tf 56 ${790 - i * 22} Td (${ascii(l)}) Tj ET`)
		.join('\n');
	const objs = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
		`<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];
	let out = '%PDF-1.4\n';
	const offsets: number[] = [];
	objs.forEach((o, i) => {
		offsets.push(out.length);
		out += `${i + 1} 0 obj\n${o}\nendobj\n`;
	});
	const xref = out.length;
	out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
	out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
	out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return out;
}
