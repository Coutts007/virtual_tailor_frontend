/**
 * Promise wrapper for the vision workers (Section 10.5): timeouts (live 1 s,
 * burst 10 s), crash detection (error / messageerror), automatic restart and
 * one retry. Bitmaps are transferred, so a retry asks the caller for fresh args.
 */
import type { Req, Res } from './protocol';
import { transferred } from './imageOps';

type Pending = {
	resolve: (v: unknown) => void;
	reject: (e: Error) => void;
	timer: ReturnType<typeof setTimeout>;
};
type ReqBody = Req extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;

export class WorkerCrashedError extends Error {
	constructor(name: string) {
		super(`${name}_crashed`);
	}
}
export class WorkerTimeoutError extends Error {
	constructor(name: string) {
		super(`${name}_timeout`);
	}
}

export class WorkerClient {
	private worker: Worker | null = null;
	private seq = 0;
	private pending = new Map<number, Pending>();
	private initArgs: ReqBody | null = null;
	restarts = 0;

	constructor(
		private name: string,
		private url: string
	) {}

	private spawn() {
		const w = new Worker(this.url, { type: 'classic', name: this.name });
		w.onmessage = (e: MessageEvent<Res>) => {
			const p = this.pending.get(e.data.id);
			if (!p) return;
			clearTimeout(p.timer);
			this.pending.delete(e.data.id);
			if (e.data.ok) p.resolve(e.data.value);
			else p.reject(new Error(e.data.error));
		};
		const crash = () => this.crashed();
		w.onerror = crash;
		w.onmessageerror = crash;
		this.worker = w;
	}

	private crashed() {
		const err = new WorkerCrashedError(this.name);
		for (const p of this.pending.values()) {
			clearTimeout(p.timer);
			p.reject(err);
		}
		this.pending.clear();
		this.worker?.terminate();
		this.worker = null;
	}

	async init(body: ReqBody, timeoutMs = 60_000): Promise<unknown> {
		this.initArgs = body;
		return this.call(body, [], timeoutMs);
	}

	call<T>(body: ReqBody, transfer: Transferable[] = [], timeoutMs = 1000): Promise<T> {
		if (!this.worker) {
			this.spawn();
			if (this.initArgs && body.op !== 'init') {
				this.restarts++;
				void this.call(this.initArgs, [], 60_000).catch(() => {});
			}
		}
		const id = ++this.seq;
		for (const t of transfer) if (t instanceof ImageBitmap) transferred();
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(new WorkerTimeoutError(this.name));
			}, timeoutMs);
			this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
			this.worker!.postMessage({ ...body, id }, transfer);
		});
	}

	/** One retry after a crash or timeout; `make` builds fresh (non-transferred) args. */
	async callWithRetry<T>(
		make: () => Promise<{ body: ReqBody; transfer: Transferable[] }>,
		timeoutMs: number
	): Promise<T> {
		for (let attempt = 0; ; attempt++) {
			const { body, transfer } = await make();
			try {
				return await this.call<T>(body, transfer, timeoutMs);
			} catch (e) {
				if (attempt >= 1 || !(e instanceof WorkerCrashedError || e instanceof WorkerTimeoutError))
					throw e;
				if (e instanceof WorkerTimeoutError) this.crashed();
			}
		}
	}

	terminate() {
		this.crashed();
		this.initArgs = null;
	}
}
