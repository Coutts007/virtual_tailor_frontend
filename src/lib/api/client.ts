import type {
	Account,
	AdminSettings,
	AuditEntry,
	AuditQuery,
	ClientCodeCheck,
	ClientDetail,
	ClientListQuery,
	ClientSummary,
	ConflictPair,
	DeletionRequest,
	IssueCodeInput,
	IssueCodeResponse,
	LoginResponse,
	Me,
	MePatch,
	MeasurementProfile,
	MeasurementProfilePayload,
	MeasurerInput,
	Order,
	OrderCreateInput,
	OrderListQuery,
	OrderPatch,
	OrderSummary,
	Page,
	Participant,
	ParticipantInput,
	ProfileSummary,
	PublicSettings,
	ReferenceReadingInput,
	ReferenceReadingResult,
	RegisterInput,
	SheetResponse,
	ShareVia
} from './types';

/**
 * The single seam between the UI and the backend (Section 20). Screens depend on
 * this interface only. Paths are relative to VITE_API_BASE_URL (/api/v1).
 * Every method maps 1:1 to a row in docs/api-contract.md.
 */
export interface ApiClient {
	// Public and client app (unauthenticated)
	getPublicSettings(): Promise<PublicSettings>;
	checkClientCode(code: string): Promise<ClientCodeCheck>;
	syncProfile(payload: MeasurementProfilePayload): Promise<{ profile_id: string; version: number }>;
	requestDeletion(input: {
		client_code: string;
		profile_ids: string[];
		reason: 'delete' | 'withdraw_consent';
	}): Promise<{ request_id: string }>;

	// Auth and own account
	register(input: RegisterInput): Promise<{ status: 'pending' }>;
	login(email: string, password: string): Promise<LoginResponse>;
	logout(): Promise<void>;
	getMe(): Promise<Me>;
	updateMe(patch: MePatch): Promise<Me>;
	changePassword(current_password: string, new_password: string): Promise<void>;

	// Tailor: clients and profiles
	listClients(q?: ClientListQuery): Promise<Page<ClientSummary>>;
	issueClientCode(input: IssueCodeInput): Promise<IssueCodeResponse>;
	getClient(id: string): Promise<ClientDetail>;
	updateClient(
		id: string,
		patch: { display_name?: string | null; height_mm?: number | null }
	): Promise<ClientDetail>;
	rotateClientCode(id: string): Promise<{ client_code: string }>;
	deleteClient(id: string): Promise<void>;
	listClientProfiles(id: string): Promise<ProfileSummary[]>;
	getProfile(id: string): Promise<MeasurementProfile>;
	listConflicts(): Promise<ConflictPair[]>;
	resolveConflict(profileId: string, keep: 'newer' | 'server'): Promise<void>;

	// Tailor: orders and sheets
	listOrders(q?: OrderListQuery): Promise<Page<OrderSummary> & { counts: Record<string, number> }>;
	createOrder(input: OrderCreateInput): Promise<Order>;
	getOrder(id: string): Promise<Order>;
	updateOrder(id: string, patch: OrderPatch): Promise<Order>;
	deleteOrder(id: string): Promise<void>;
	generateSheet(orderId: string, include_name: boolean): Promise<SheetResponse>;
	logShare(sheetId: string, via: ShareVia): Promise<void>;

	// Audit
	listAudit(q?: AuditQuery): Promise<Page<AuditEntry>>;
	exportAuditCsv(q?: AuditQuery): Promise<string>;

	// Admin
	listAccounts(status?: Account['status']): Promise<Account[]>;
	approveAccount(id: string): Promise<Account>;
	rejectAccount(id: string, reason: string): Promise<Account>;
	disableAccount(id: string): Promise<Account>;
	enableAccount(id: string): Promise<Account>;
	createMeasurer(input: MeasurerInput): Promise<Account>;
	getAdminSettings(): Promise<AdminSettings>;
	putAdminSettings(s: AdminSettings): Promise<AdminSettings>;
	listDeletionRequests(): Promise<DeletionRequest[]>;

	// Study
	listParticipants(): Promise<Participant[]>;
	enrolParticipant(
		input: ParticipantInput
	): Promise<{ participant_id: string; client_code: string }>;
	submitReferenceReading(input: ReferenceReadingInput): Promise<ReferenceReadingResult>;
	exportStudyCsv(kind: 'captures' | 'reference'): Promise<string>;
}
