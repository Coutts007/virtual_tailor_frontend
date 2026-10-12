#!/usr/bin/env node
/**
 * Writes static/marker/vt-measuring-sheet-A4.pdf and a preview SVG (Section 9.5).
 * A4 portrait; ArUco DICT_4X4_50 id 0 at 150 mm (6 modules × 25 mm incl. the
 * black border) with a white quiet zone; a 10 cm print-check line; a credit-card
 * outline (85.6 × 54.0 mm). Vector only, no dependencies. Run: npm run marker
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const BITS = [
	[1, 0, 1, 1],
	[0, 1, 0, 1],
	[0, 0, 1, 1],
	[0, 0, 1, 0]
];
const W = 210,
	H = 297;
const MOD = 25; // mm per module → 150 mm marker
const MX = (W - 6 * MOD) / 2; // 30 mm
const MY = 38;
const LINE_Y = 222,
	LINE_X = (W - 100) / 2;
const CARD = { w: 85.6, h: 54.0, x: (W - 85.6) / 2, y: 236 };

// Black modules (outer border + inner 0-bits), in mm, origin top-left.
const blacks = [];
for (let r = 0; r < 6; r++)
	for (let c = 0; c < 6; c++) {
		const border = r === 0 || c === 0 || r === 5 || c === 5;
		if (border || BITS[r - 1][c - 1] === 0) blacks.push([MX + c * MOD, MY + r * MOD, MOD, MOD]);
	}

const TEXT = [
	{
		y: 16,
		size: 15,
		bold: true,
		s: 'Virtual Tailor measuring sheet — hold flat, square facing camera'
	},
	{
		y: 24,
		size: 10,
		s: 'Karatasi ya kupimia ya Virtual Tailor — ishike sawasawa, mraba utazame kamera'
	},
	{
		y: 30,
		size: 9,
		s: 'Print at 100% / Actual size (not "Fit to page"). Do not fold through the black square. Keep your fingers off it.'
	},
	{
		y: 217,
		size: 9,
		s: 'Check: this line must be exactly 10 cm. / Kagua: mstari huu lazima uwe sentimita 10 kamili.'
	},
	{
		y: CARD.y + CARD.h / 2 - 2,
		size: 9,
		s: 'A bank card should fit exactly in this box.',
		center: true
	},
	{
		y: CARD.y + CARD.h / 2 + 4,
		size: 9,
		s: 'Kadi ya benki inapaswa kutosha sawasawa hapa.',
		center: true
	},
	{ y: 293, size: 7, s: 'ArUco DICT_4X4_50 id 0 · 150 mm · No photo ever leaves your phone.' }
];

/* ---------- PDF ---------- */
const pt = (mm) => (mm * 72) / 25.4;
const y = (mm) => pt(H - mm);
const winAnsi = (s) =>
	s
		.replace(/\\/g, '\\\\')
		.replace(/\(/g, '\\(')
		.replace(/\)/g, '\\)')
		.replace(/—/g, '\\227')
		.replace(/·/g, '\\267');
// Helvetica average glyph width for centring (approximation is fine for labels).
const textW = (s, size) => s.length * size * 0.5;
let ops = '0 g\n';
for (const [x, yy, w, h] of blacks)
	ops += `${pt(x).toFixed(3)} ${y(yy + h).toFixed(3)} ${pt(w).toFixed(3)} ${pt(h).toFixed(3)} re f\n`;
// 10 cm line with cm ticks
ops += `0.6 w ${pt(LINE_X).toFixed(3)} ${y(LINE_Y).toFixed(3)} m ${pt(LINE_X + 100).toFixed(3)} ${y(LINE_Y).toFixed(3)} l S\n`;
for (let i = 0; i <= 10; i++) {
	const h = i % 5 === 0 ? 4 : 2;
	ops += `${pt(LINE_X + i * 10).toFixed(3)} ${y(LINE_Y - h).toFixed(3)} m ${pt(LINE_X + i * 10).toFixed(3)} ${y(LINE_Y + h).toFixed(3)} l S\n`;
}
// Card outline, dashed
ops += `[3 2] 0 d 0.5 w ${pt(CARD.x).toFixed(3)} ${y(CARD.y + CARD.h).toFixed(3)} ${pt(CARD.w).toFixed(3)} ${pt(CARD.h).toFixed(3)} re S [] 0 d\n`;
for (const tx of TEXT) {
	const x = tx.center ? pt(W / 2) - textW(tx.s, tx.size) / 2 : pt(15);
	ops += `BT /${tx.bold ? 'F2' : 'F1'} ${tx.size} Tf ${x.toFixed(2)} ${y(tx.y).toFixed(2)} Td (${winAnsi(tx.s)}) Tj ET\n`;
}
const objs = [
	'<< /Type /Catalog /Pages 2 0 R >>',
	'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
	`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(W).toFixed(2)} ${pt(H).toFixed(2)}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
	`<< /Length ${Buffer.byteLength(ops, 'latin1')} >>\nstream\n${ops}endstream`,
	'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
	'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
];
let pdf = '%PDF-1.4\n';
const offs = [];
objs.forEach((o, i) => {
	offs.push(Buffer.byteLength(pdf, 'latin1'));
	pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

/* ---------- preview SVG ---------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}">
<rect width="${W}" height="${H}" fill="#fff"/>
${blacks.map(([x, yy, w, h]) => `<rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="#000"/>`).join('')}
<line x1="${LINE_X}" y1="${LINE_Y}" x2="${LINE_X + 100}" y2="${LINE_Y}" stroke="#000" stroke-width="0.3"/>
${Array.from({ length: 11 }, (_, i) => `<line x1="${LINE_X + i * 10}" x2="${LINE_X + i * 10}" y1="${LINE_Y - (i % 5 ? 2 : 4)}" y2="${LINE_Y + (i % 5 ? 2 : 4)}" stroke="#000" stroke-width="0.3"/>`).join('')}
<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="3" fill="none" stroke="#000" stroke-width="0.3" stroke-dasharray="3 2"/>
${TEXT.map((tx) => `<text x="${tx.center ? W / 2 : 15}" y="${tx.y}" font-family="Helvetica, Arial, sans-serif" font-size="${(tx.size * 25.4) / 72}" ${tx.bold ? 'font-weight="700"' : ''} ${tx.center ? 'text-anchor="middle"' : ''}>${esc(tx.s)}</text>`).join('\n')}
</svg>
`;

mkdirSync('static/marker', { recursive: true });
writeFileSync('static/marker/vt-measuring-sheet-A4.pdf', pdf, 'latin1');
writeFileSync('static/marker/vt-measuring-sheet-preview.svg', svg);
console.log(`marker sheet: ${Buffer.byteLength(pdf, 'latin1')} bytes PDF, ${svg.length} bytes SVG`);
