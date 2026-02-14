import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import fg from 'fast-glob';
import { checkEslintCoverage } from './rules/eslintCoverage.js';
import { checkTsConfigSafety } from './rules/tsConfigSafety.js';
import type { Finding, Report, Rule, ScanContext, Severity } from './types.js';

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function readTextFile(filePath: string): Promise<string | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return content;
	} catch {
		return null;
	}
}

export function resolveTargetPath(targetPath: string): string {
	return path.resolve(process.cwd(), targetPath);
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
	const text = await readTextFile(filePath);
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function normalizeFilePath(filePath: string): string {
	return filePath.replaceAll('\\', '/');
}

function scorePenalty(severity: Severity): number {
	switch (severity) {
		case 'fatal':
			return 40;
		case 'error':
			return 20;
		case 'warning':
			return 10;
		default:
			return 0;
	}
}

function scoreReport(findings: Finding[]): number {
	const penalty = findings.reduce((total, finding) => total + scorePenalty(finding.severity), 0);
	return Math.max(0, 100 - penalty);
}

function sortFindings(findings: Finding[]): Finding[] {
	const rank: Record<Severity, number> = {
		fatal: 0,
		error: 1,
		warning: 2,
		info: 3,
		ok: 4,
	};

	return findings.toSorted((a, b) => rank[a.severity] - rank[b.severity]);
}

async function loadContext(targetPath: string): Promise<ScanContext> {
	const files = await fg(['**/*'], {
		cwd: targetPath,
		onlyFiles: true,
		dot: true,
		ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
	});

	const packageJsonPath = path.join(targetPath, 'package.json');
	const packageJson = await readJsonFile(packageJsonPath);

	return {
		targetPath,
		files: new Set(files.map(normalizeFilePath)),
		packageJson,
	};
}

export async function scanRepository(targetInput = '.'): Promise<Report> {
	const targetPath = resolveTargetPath(targetInput);
	const stat = await fs.stat(targetPath).catch(() => null);
	if (!stat || !stat.isDirectory()) {
		throw new Error(`Invalid target path "${targetPath}". Please provide an existing directory.`);
	}

	const context = await loadContext(targetPath);
	const rules: Rule[] = [checkTsConfigSafety, checkEslintCoverage];
	const findings = (
		await Promise.all(rules.map(async (rule) => rule(context)))
	).flat();

	const sorted = sortFindings(findings);

	return {
		targetPath,
		generatedAt: new Date().toISOString(),
		score: scoreReport(sorted),
		findings: sorted,
	};
}
