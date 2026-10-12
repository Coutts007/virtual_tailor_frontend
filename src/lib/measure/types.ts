import type { ClothingFit, Landmark, MarkerObs, Measurement, Sex } from '$lib/api/types';
import type { RulesConfig } from './rules';

export type { RulesConfig };

/** 1 = person, row-major. */
export interface BinaryMask {
	data: Uint8Array;
	width: number;
	height: number;
}

export interface ViewInput {
	/** 33 landmarks, normalised 0..1 to the working frame. */
	landmarks: Landmark[];
	/** May be lower resolution than the frame; mapped by normalised coordinates. */
	mask: BinaryMask;
	/** Corners in px of an image of size image_w × image_h (may differ from the frame). */
	marker: MarkerObs | null;
	/** Working frame size in px. */
	frame: { width: number; height: number };
}

export interface MeasureInput {
	front: ViewInput;
	side: ViewInput;
	height_mm: number;
	sex: Sex;
	clothing_fit: ClothingFit;
	level_unchecked: boolean;
	config?: Partial<RulesConfig>;
}

export type ViewName = 'front' | 'side';

export interface MeasureResult {
	/** 9 rows in ALL_SITES order including the stature check row. */
	measurements: Measurement[];
	/** mm per working-frame pixel; 0 when the view failed. */
	scale_front_mm_px: number;
	scale_side_mm_px: number;
	scale_stature_mm_px: number;
	/** 0 when the front marker scale is unavailable. */
	scale_disagreement_pct: number;
	retake_view: ViewName | null;
	failed_views: ViewName[];
	stature_estimated_mm: number | null;
	rules_version: string;
	config_hash: string;
}
