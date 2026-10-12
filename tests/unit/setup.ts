import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../../mocks/node';
import { resetMockDb, setLatency } from '../../mocks/handlers';

beforeAll(() => {
	setLatency(0, 0);
	server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
	server.resetHandlers();
	resetMockDb();
});
afterAll(() => server.close());
