import type { PublicSettings } from './types';

/**
 * The single seam between the UI and the backend (Section 20). Screens depend on
 * this interface only. Phase 1 extends it to every endpoint in the contract.
 */
export interface ApiClient {
	getPublicSettings(): Promise<PublicSettings>;
}
