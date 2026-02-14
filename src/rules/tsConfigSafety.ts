import path from 'node:path';
import { parse, printParseErrorCode } from 'jsonc-parser';
import { readTextFile } from '../scanner.js';
import type { Finding, ScanContext } from '../types.js';

type CompilerOptions = Record<string, unknown>;

function getCompilerOptions(raw: Record<string, unknown>): CompilerOptions {
	const value = raw.compilerOptions;
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}

	return value as CompilerOptions;
}

function hasFile(context: ScanContext, filePath: string): boolean {
	return context.files.has(filePath);
}

export async function checkTsConfigSafety(context: ScanContext): Promise<Finding[]> {
	const findings: Finding[] = [];
	const tsConfigFile = hasFile(context, 'tsconfig.json') ? 'tsconfig.json' : null;

	if (!tsConfigFile) {
		return [
			{
				ruleId: 'tsconfig-safety',
				severity: 'warning',
				title: 'tsconfig.json not found',
				summary: 'No root TypeScript configuration was found. Type safety defaults may be inconsistent.',
			},
		];
	}

	const tsConfigPath = path.join(context.targetPath, tsConfigFile);
	const tsConfigText = await readTextFile(tsConfigPath);
	if (!tsConfigText) {
		return [
			{
				ruleId: 'tsconfig-safety',
				severity: 'error',
				title: 'Unable to read tsconfig.json',
				summary: 'The file exists but could not be read.',
				files: [tsConfigFile],
			},
		];
	}

	const parseErrors: { error: number; offset: number; length: number }[] = [];
	const parsed = parse(tsConfigText, parseErrors, { allowTrailingComma: true });
	if (parseErrors.length > 0 || !parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return [
			{
				ruleId: 'tsconfig-safety',
				severity: 'error',
				title: 'Invalid tsconfig.json syntax',
				summary: parseErrors
					.map((issue) => printParseErrorCode(issue.error))
					.join(', '),
				files: [tsConfigFile],
			},
		];
	}

	const compilerOptions = getCompilerOptions(parsed as Record<string, unknown>);

	if (compilerOptions.strict !== true) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'error',
			title: 'strict mode is disabled',
			summary: 'Set compilerOptions.strict=true to avoid hidden type issues.',
			files: [tsConfigFile],
		});
	}

	if (compilerOptions.noUncheckedIndexedAccess !== true) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'warning',
			title: 'noUncheckedIndexedAccess is not enabled',
			summary: 'Index access can silently return undefined without explicit handling.',
			files: [tsConfigFile],
		});
	}

	if (compilerOptions.exactOptionalPropertyTypes !== true) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'warning',
			title: 'exactOptionalPropertyTypes is not enabled',
			summary: 'Optional property semantics may be looser than expected.',
			files: [tsConfigFile],
		});
	}

	if (compilerOptions.allowJs === true) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'warning',
			title: 'allowJs is enabled',
			summary: 'Mixed JS/TS projects need explicit boundaries to avoid type-safety blind spots.',
			files: [tsConfigFile],
		});
	}

	if (compilerOptions.skipLibCheck === true) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'info',
			title: 'skipLibCheck is enabled',
			summary: 'Builds are faster, but declaration issues in dependencies are not checked.',
			files: [tsConfigFile],
		});
	}

	if (findings.length === 0) {
		findings.push({
			ruleId: 'tsconfig-safety',
			severity: 'ok',
			title: 'TypeScript safety baseline looks good',
			summary: 'Core strictness flags are enabled in tsconfig.json.',
			files: [tsConfigFile],
		});
	}

	return findings;
}
