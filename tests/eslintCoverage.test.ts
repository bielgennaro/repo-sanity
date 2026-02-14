import { describe, expect, it } from 'vitest';
import { checkEslintCoverage } from '../src/rules/eslintCoverage.js';
import type { ScanContext } from '../src/types.js';

describe('checkEslintCoverage', () => {
	it('flags missing config and script', async () => {
		const context: ScanContext = {
			targetPath: '.',
			files: new Set(),
			packageJson: null,
		};

		const findings = await checkEslintCoverage(context);
		expect(findings.some((finding) => finding.title.includes('config not found'))).toBe(true);
		expect(findings.some((finding) => finding.title.includes('lint script is missing'))).toBe(true);
	});

	it('returns ok for healthy baseline', async () => {
		const context: ScanContext = {
			targetPath: '.',
			files: new Set(['eslint.config.js']),
			packageJson: {
				devDependencies: {
					eslint: '^8.0.0',
				},
				scripts: {
					lint: 'eslint .',
				},
			},
		};

		const findings = await checkEslintCoverage(context);
		expect(findings.some((finding) => finding.severity === 'warning')).toBe(false);
		expect(findings.some((finding) => finding.title.includes('baseline looks good'))).toBe(true);
	});
});
