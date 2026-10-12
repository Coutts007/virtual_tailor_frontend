import { PARTICIPANT_CODE_RE } from '$lib/domain/validate';

/** Next free participant code, P001… (Section 15.3). */
export function nextParticipantCode(codes: string[]): string {
	const nums = codes.filter((c) => PARTICIPANT_CODE_RE.test(c)).map((c) => Number(c.slice(1)));
	return `P${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
}
