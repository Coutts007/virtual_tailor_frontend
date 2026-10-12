/**
 * The measuring-sheet marker (decision 8): ArUco DICT_4X4_50, id 0, printed
 * 150 mm × 150 mm (outer black border), centred on A4. Bits verified against
 * OpenCV 4.10 cv2.aruco.generateImageMarker (1 = white).
 */
export const MARKER = {
	dictionary: 'DICT_4X4_50',
	id: 0,
	sideMm: 150,
	bits: [
		[1, 0, 1, 1],
		[0, 1, 0, 1],
		[0, 0, 1, 1],
		[0, 0, 1, 0]
	] as const
};
