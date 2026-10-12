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

/* ------------------------------------------------------------------ */
/* Dashboard, admin and study types (Section 20.2). Derived from the   */
/* endpoint table; field names follow the Chapter 5 entities.          */
/* ------------------------------------------------------------------ */

export type Role = 'tailor' | 'admin' | 'measurer';
export type AccountStatus = 'pending' | 'active' | 'disabled' | 'rejected';
export type UnitPref = 'cm' | 'in';
export type Locale = 'en' | 'sw';

export interface SessionUser {
	user_id: string;
	email: string;
	role: Role;
	status: AccountStatus;
	locale: Locale;
	measurer_code?: string;
}
export interface LoginResponse {
	access_token: string;
	/** ISO 8601 UTC. */
	expires_at: string;
	user: SessionUser;
}
export interface RegisterInput {
	email: string;
	password: string;
	business_name: string;
	/** E.164, e.g. +254712345678. */
	phone: string;
	area: string;
	locale: Locale;
}
export interface EasePresets {
	/** Ease in mm per garment and site. */
	[garment: string]: Partial<Record<SiteCode, number>>;
}
export interface Me extends SessionUser {
	business_name?: string;
	phone?: string;
	area?: string;
	unit_pref: UnitPref;
	include_name_default: boolean;
	ease_presets: EasePresets;
}
export type MePatch = Partial<
	Pick<
		Me,
		| 'business_name'
		| 'phone'
		| 'area'
		| 'locale'
		| 'unit_pref'
		| 'include_name_default'
		| 'ease_presets'
	>
>;

export interface ClientCodeCheck {
	valid: true;
	tailor_business_name: string;
	height_mm: number | null;
}

export interface FlagSummary {
	pass: number;
	check: number;
	fail: number;
}
export interface ClientSummary {
	client_id: string;
	client_code: string;
	display_name: string | null;
	height_mm: number | null;
	created_at: string;
	last_capture_at: string | null;
	latest_profile_id: string | null;
	latest_sync_status: SyncStatus | null;
	flags: FlagSummary | null;
	open_orders: number;
	has_new: boolean;
}
export type ClientSort = 'last_capture' | 'code' | 'name';
export type ClientFilter = 'new' | 'flags' | 'none';
export interface ClientListQuery {
	search?: string;
	sort?: ClientSort;
	filter?: ClientFilter;
	page?: number;
	page_size?: number;
}
export interface ProfileSummary {
	profile_id: string;
	version: number;
	captured_at: string;
	capture_mode: 'self' | 'assisted';
	flags: FlagSummary;
	sync_status: SyncStatus;
	has_conflict: boolean;
}
export interface ClientDetail extends ClientSummary {
	deep_link: string;
	profiles: ProfileSummary[];
	orders: OrderSummary[];
}
export interface IssueCodeInput {
	display_name?: string;
	height_mm?: number;
}
export interface IssueCodeResponse {
	client_id: string;
	client_code: string;
	deep_link: string;
}

export interface OrderSummary {
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
	created_at: string;
	flagged_sites: number;
	has_conflict: boolean;
}
export interface OrderListQuery {
	status?: OrderStatus | OrderStatus[];
	sort?: 'due' | 'created';
	page?: number;
	page_size?: number;
}
export interface OrderCreateInput {
	client_id: string;
	profile_id: string;
	garment_type: GarmentType;
	/** YYYY-MM-DD (Nairobi date). */
	due_date: string;
	notes: string;
	items: OrderItemInput[];
}
export type OrderPatch = Partial<Pick<Order, 'status' | 'due_date' | 'notes'>> & {
	items?: OrderItemInput[];
};

export interface SheetResponse {
	sheet_id: string;
	png_url: string;
	pdf_url: string;
	share_text: string;
	generated_at: string;
}
export type ShareVia = 'whatsapp_share' | 'wa_link' | 'download' | 'print';

export interface ConflictPair {
	profile_id: string;
	client_id: string;
	client_code: string;
	display_name?: string;
	server: MeasurementProfile;
	device: MeasurementProfile;
}

export interface AuditQuery {
	user?: string;
	role?: Role;
	action?: AuditAction;
	entity_type?: string;
	/** YYYY-MM-DD inclusive. */
	from?: string;
	to?: string;
	page?: number;
	page_size?: number;
}

export interface Account {
	user_id: string;
	email: string;
	role: Role;
	status: AccountStatus;
	business_name?: string;
	phone?: string;
	area?: string;
	registered_at: string;
	measurer_code?: string;
	trained_on?: string;
	reject_reason?: string;
}
export interface MeasurerInput {
	email: string;
	password: string;
	measurer_code: string;
	/** YYYY-MM-DD. */
	trained_on: string;
}
export interface AdminSettings {
	retention_months: number;
	study_mode: boolean;
}
export interface DeletionRequest {
	request_id: string;
	client_code: string;
	profile_ids: string[];
	reason: 'delete' | 'withdraw_consent';
	received_at: string;
	status: 'received' | 'completed' | 'rejected';
	completed_at?: string;
}

export type AgeBand = '18-24' | '25-34' | '35-44' | '45-54' | '55+';
export interface ParticipantInput {
	participant_code: string;
	sex: 'female' | 'male';
	age_band: AgeBand;
	venue: string;
}
export interface Participant extends ParticipantInput {
	participant_id: string;
	client_code: string;
	enrolled_at: string;
	/** 0–3 capture sets saved. */
	sets_captured: number;
	/** Readings entered per site, 0–4 (2 measurers × 2 readings). */
	readings: Partial<Record<SiteCode, number>>;
}
export interface ReferenceReadingInput {
	participant_code: string;
	reading_no: 1 | 2;
	/** Millimetres per site. */
	values: Partial<Record<SiteCode, number>>;
	taken_at: string;
}
export interface ReferenceReadingResult {
	reading_id: string;
	participant_code: string;
	reading_no: 1 | 2;
	measurer_code: string;
	locked: true;
	out_of_order: boolean;
}
