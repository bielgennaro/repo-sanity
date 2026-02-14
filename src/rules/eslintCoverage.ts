import type { Finding, ScanContext } from '../types.js';

const ESLINT_CONFIG_FILES = [
	'eslint.config.js',
	'eslint.config.mjs',
	'eslint.config.cjs',
	'eslint.config.ts',
	'.eslintrc',
	'.eslintrc.js',
	'.eslintrc.cjs',
	'.eslintrc.json',
	'.eslintrc.yaml',
	'.eslintrc.yml',
];

function hasAnyFile(context: ScanContext, candidates: string[]): string | null {
	for (const candidate of candidates) {
		if (context.files.has(candidate)) {
			return candidate;
		}
	}

	return null;
}

function getScript(packageJson: Record<string, unknown> | null, name: string): string | null {
	if (!packageJson) {
		return null;
	}

	const scripts = packageJson.scripts;
	if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
		return null;
	}

	const value = (scripts as Record<string, unknown>)[name];
	return typeof value === 'string' ? value : null;
}

function hasEslintDependency(packageJson: Record<string, unknown> | null): boolean {
	if (!packageJson) {
		return false;
	}

	const deps = packageJson.dependencies;
	const devDeps = packageJson.devDependencies;
	const merged = {
		...(deps && typeof deps === 'object' && !Array.isArray(deps)
			? (deps as Record<string, unknown>)
			: {}),
		...(devDeps && typeof devDeps === 'object' && !Array.isArray(devDeps)
			? (devDeps as Record<string, unknown>)
			: {}),
	};

	return typeof merged.eslint === 'string';
}

export async function checkEslintCoverage(context: ScanContext): Promise<Finding[]> {
	const findings: Finding[] = [];
	const configFile = hasAnyFile(context, ESLINT_CONFIG_FILES);

	if (!configFile) {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'warning',
			title: 'ESLint config not found',
			summary: 'No eslint.config.* or .eslintrc.* file was detected at repository root.',
		});
	} else {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'ok',
			title: 'ESLint config detected',
			summary: `Using ${configFile} as baseline lint configuration.`,
			files: [configFile],
		});
	}

	if (!hasEslintDependency(context.packageJson)) {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'warning',
			title: 'ESLint dependency not declared',
			summary: 'Add eslint to dependencies/devDependencies to keep linting reproducible in CI.',
			files: ['package.json'],
		});
	}

	const lintScript = getScript(context.packageJson, 'lint');
	if (!lintScript) {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'warning',
			title: 'lint script is missing',
			summary: 'Add a lint script in package.json to standardize local and CI usage.',
			files: ['package.json'],
		});
	} else if (!lintScript.includes('eslint')) {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'info',
			title: 'lint script does not call eslint',
			summary: `Current lint script: "${lintScript}". If intentional, keep this message as informational.`,
			files: ['package.json'],
		});
	}

	if (findings.every((finding) => finding.severity === 'ok')) {
		findings.push({
			ruleId: 'eslint-coverage',
			severity: 'ok',
			title: 'ESLint coverage baseline looks good',
			summary: 'Configuration, dependency, and script wiring are present.',
			files: ['package.json'],
		});
	}

	return findings;
}
