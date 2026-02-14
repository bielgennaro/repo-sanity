import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkTsConfigSafety } from '../src/rules/tsConfigSafety.js';
import type { ScanContext } from '../src/types.js';

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'repo-sanity-tsconfig-'));
	tempDirs.push(dir);
	return dir;
}

afterEach(async () => {
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe('checkTsConfigSafety', () => {
	it('returns warning when tsconfig.json is missing', async () => {
		const dir = await createTempDir();
		const context: ScanContext = { targetPath: dir, files: new Set(), packageJson: null };

		const findings = await checkTsConfigSafety(context);
		expect(findings.some((finding) => finding.severity === 'warning')).toBe(true);
	});

	it('returns ok when safety baseline is enabled', async () => {
		const dir = await createTempDir();
		const tsconfigPath = path.join(dir, 'tsconfig.json');
		await writeFile(
			tsconfigPath,
			JSON.stringify({
				compilerOptions: {
					strict: true,
					noUncheckedIndexedAccess: true,
					exactOptionalPropertyTypes: true,
				},
			}),
			'utf-8',
		);

		const context: ScanContext = {
			targetPath: dir,
			files: new Set(['tsconfig.json']),
			packageJson: null,
		};
		const findings = await checkTsConfigSafety(context);

		expect(findings.some((finding) => finding.severity === 'ok')).toBe(true);
		expect(findings.some((finding) => finding.severity === 'error')).toBe(false);
	});
});
