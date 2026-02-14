import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanRepository } from '../src/scanner.js';

const tempDirs: string[] = [];

async function createRepo(files: Record<string, string>): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'repo-sanity-scan-'));
	tempDirs.push(dir);

	await Promise.all(
		Object.entries(files).map(async ([name, content]) => {
			await writeFile(path.join(dir, name), content, 'utf-8');
		}),
	);

	return dir;
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('scanRepository', () => {
	it('returns a report with score and findings', async () => {
		const dir = await createRepo({
			'tsconfig.json': JSON.stringify({
				compilerOptions: {
					strict: true,
					noUncheckedIndexedAccess: true,
					exactOptionalPropertyTypes: true,
				},
			}),
			'package.json': JSON.stringify({
				scripts: { lint: 'eslint .' },
				devDependencies: { eslint: '^8.0.0' },
			}),
			'eslint.config.js': 'export default [];',
		});

		const report = await scanRepository(dir);

		expect(report.score).toBeGreaterThanOrEqual(0);
		expect(report.score).toBeLessThanOrEqual(100);
		expect(report.findings.length).toBeGreaterThan(0);
	});
});
