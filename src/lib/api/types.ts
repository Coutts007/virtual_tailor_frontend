/**
 * Wire types shared with the backend (Section 20.3). Mirrored in docs/openapi.yaml.
 * Lengths are integer millimetres on the wire; timestamps are ISO 8601 UTC.
 */
export type SiteCode =
	'stature' | 'shoulder' | 'chest' | 'waist' | 'hip' | 'sleeve' | 'outleg' | 'inleg' | 'neck';
export type Flag = 'pass' | 'check' | 'fail';
export type FlagReason =
	| 'scale_disagree'
	| 'level_unchecked'
	| 'loose_clothing'
	| 'landmark_low'
	| 'mask_gap'
	| 'out_of_range'
	| 'crotch_not_found'
	| 'marker_weak'
	| 'waist_level_mismatch'
	| 'view_failed';
export type CheckState = 'pass' | 'fail' | 'skipped';

/** Normalised 0..1 image coordinates. */
export interface Landmark {
	x: number;
	y: number;
	z: number;
	visibility: number;
}
export interface MarkerObs {
	corners: [number, number][];
	image_w: number;
	image_h: number;
	side_px: number;
	confidence: number;
}
export interface ViewChecks {
	level: CheckState;
	frame: CheckState;
	distance: CheckState;
	symmetry: CheckState;
	arms: CheckState;
	marker: CheckState;
	light: CheckState;
	sharpness: CheckState;
}
export interface StudyBlock {
	participant_code: string;
	set_no: 1 | 2 | 3;
	lighting: 'window' | 'lamp' | 'outdoor';
	distance_m: number;
	clothing_fit_observed: 'fitted' | 'loose';
	lux?: number;
}
export interface CaptureSession {
	session_id: string;
	started_at: string;
	capture_mode: 'self' | 'assisted';
	device_model: string;
	os: string;
	browser: string;
	memory_gb: number | null;
	model_variant: 'lite' | 'full' | 'heavy';
	stream_w: number;
	stream_h: number;
	still_source: 'imagecapture' | 'canvas' | 'file';
	level_unchecked: boolean;
	capture_fallback: boolean;
	front_checks: ViewChecks;
	side_checks: ViewChecks;
	scale_front_mm_px: number;
	scale_side_mm_px: number;
	scale_stature_mm_px: number;
	scale_disagreement_pct: number;
	processing_ms: number;
	retake_count: number;
	config_hash: string;
	/** C6: study covariates. */
	study?: StudyBlock;
}
export interface Measurement {
	site_code: SiteCode;
	/** C4: null when confidence_flag = 'fail'. */
	value_mm: number | null;
	method: 'auto' | 'override';
	confidence_flag: Flag;
	flag_reasons: FlagReason[];
	correction_factor?: number;
	level_fraction?: number;
	half_width_mm?: number;
	half_depth_mm?: number;
}
export type ConsentScope = 'measure' | 'measurements_only' | 'retention' | 'study_paper';
export interface ConsentRecord {
	consent_version: string;
	language: 'en' | 'sw';
	scope: ConsentScope[];
	given_at: string;
	withdrawn_at?: string;
}
export type Sex = 'female' | 'male' | 'unspecified';
export type ClothingFit = 'fitted' | 'loose';
export interface MeasurementProfilePayload {
	profile_id: string;
	client_code: string;
	version: number;
	captured_at: string;
	status: 'final';
	rules_version: string;
	covariates: {
		height_mm_entered: number;
		sex: Sex;
		clothing_fit: ClothingFit;
		code_verified: boolean;
	};
	consent: ConsentRecord;
	session: CaptureSession;
	/** 33 each. */
	landmarks_front: Landmark[];
	landmarks_side: Landmark[];
	marker_front: MarkerObs;
	marker_side: MarkerObs;
	/** 9 rows including the stature check. */
	measurements: Measurement[];
}
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'rejected';
export interface MeasurementProfile extends MeasurementProfilePayload {
	client_id?: string;
	sync_status: SyncStatus;
	created_at?: string;
}
export type GarmentType = 'shirt' | 'dress' | 'trousers' | 'suit_jacket' | 'skirt' | 'other';
export type OrderStatus = 'new' | 'cutting' | 'fitting' | 'ready' | 'collected';
export interface OrderItemInput {
	site_code: SiteCode;
	body_mm: number | null;
	ease_mm: number;
	overridden: boolean;
	override_reason?: string;
	flag_confirmed?: boolean;
	pending_fitting?: boolean;
}
export interface OrderItem extends OrderItemInput {
	finished_mm: number | null;
	confidence_flag: Flag;
}
export interface Order {
	order_id: string;
	order_no: string;
	client_id: string;
	client_code: string;
	display_name?: string;
	profile_id: string;
	profile_version: number;
	garment_type: GarmentType;
	status: OrderStatus;
	due_date: string;
	notes: string;
	items: OrderItem[];
	created_at: string;
	updated_at: string;
	status_history: { status: OrderStatus; at: string }[];
}
export type AuditAction =
	| 'login'
	| 'profile_view'
	| 'export'
	| 'share'
	| 'override'
	| 'deletion'
	| 'status_change'
	| 'code_issue'
	| 'approve'
	| 'settings_change';
export interface AuditEntry {
	log_id: string;
	occurred_at: string;
	user_email: string;
	role: string;
	action: AuditAction;
	entity_type: string;
	entity_id: string;
	summary: string;
}

export interface Page<T> {
	items: T[];
	page: number;
	page_size: number;
	total: number;
}

export interface PublicSettings {
	study_mode: boolean;
	consent_version: string;
	min_app_version: string;
}
