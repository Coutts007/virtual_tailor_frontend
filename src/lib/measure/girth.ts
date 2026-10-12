/** Ramanujan's approximation of an ellipse perimeter (Section 11.2). */
export function ellipsePerimeter(a: number, b: number): number {
	return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** Girth from half-width a and half-depth b with a correction factor. */
export function girth(a: number, b: number, cf = 1): number {
	return ellipsePerimeter(a, b) * cf;
}
