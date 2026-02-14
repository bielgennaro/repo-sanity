#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import chalk from 'chalk';
import { Command } from 'commander';
import { renderJsonReport } from './reporters/json.js';
import { renderMarkdownReport } from './reporters/markdown.js';
import { renderTerminalReport } from './reporters/terminal.js';
import { scanRepository } from './scanner.js';
import type { OutputFormat, Report, Severity } from './types.js';

const OUTPUT_FORMATS: OutputFormat[] = ['terminal', 'markdown', 'json'];
const FAIL_SEVERITIES: Severity[] = ['info', 'warning', 'error', 'fatal'];

const severityRank: Record<Severity, number> = {
	ok: 0,
	info: 1,
	warning: 2,
	error: 3,
	fatal: 4,
};

function renderByFormat(report: Report, format: OutputFormat): string {
	switch (format) {
		case 'json':
			return renderJsonReport(report);
		case 'markdown':
			return renderMarkdownReport(report);
		case 'terminal':
			return renderTerminalReport(report);
	}
}

function highestSeverity(report: Report): Severity {
	return report.findings.reduce<Severity>((highest, finding) => {
		if (severityRank[finding.severity] > severityRank[highest]) {
			return finding.severity;
		}

		return highest;
	}, 'ok');
}

async function writeOutput(filePath: string, contents: string): Promise<void> {
	const target = path.resolve(process.cwd(), filePath);
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.writeFile(target, contents, 'utf-8');
}

function parseOutputFormat(value: string): OutputFormat {
	if (OUTPUT_FORMATS.includes(value as OutputFormat)) {
		return value as OutputFormat;
	}

	throw new Error(`Invalid format "${value}". Use: ${OUTPUT_FORMATS.join(', ')}`);
}

function parseFailSeverity(value: string): Severity {
	if (FAIL_SEVERITIES.includes(value as Severity)) {
		return value as Severity;
	}

	throw new Error(`Invalid --fail-on severity "${value}". Use: ${FAIL_SEVERITIES.join(', ')}`);
}

type ScanOptions = {
	format: OutputFormat;
	output?: string;
	failOn?: Severity;
};

function h1(text: string): string {
	return chalk.bold.cyan(text);
}

function dim(text: string): string {
	return chalk.gray(text);
}

async function runScan(target: string, options: ScanOptions): Promise<void> {
	const report = await scanRepository(target);
	const result = renderByFormat(report, options.format);

	if (options.output) {
		await writeOutput(options.output, result);
		if (options.format === 'terminal') {
			process.stdout.write(`Report written to ${path.resolve(process.cwd(), options.output)}\n`);
		}
	} else {
		process.stdout.write(result);
	}

	if (options.failOn) {
		const highest = highestSeverity(report);
		if (severityRank[highest] >= severityRank[options.failOn]) {
			process.exitCode = 1;
		}
	}
}

async function main(): Promise<void> {
	const program = new Command();
	program
		.name('repo-sanity')
		.description('Fast technical sanity audit for JavaScript/TypeScript repositories')
		.showHelpAfterError()
		.addHelpText(
			'beforeAll',
			[
				h1('Repo Sanity CLI'),
				dim('Readable checks for config quality, structure, and obvious technical risks.'),
				'',
			].join('\n'),
		)
		.addHelpText(
			'after',
			[
				'',
				h1('Quick Start'),
				'  repo-sanity scan',
				'',
				h1('Examples'),
				'  repo-sanity scan . --format markdown --output reports/sanity.md',
				'  repo-sanity scan ../my-project --format json --fail-on error',
				'  repo-sanity scan . --fail-on warning',
				'',
				dim('Tip: running `repo-sanity` without a command is equivalent to `repo-sanity scan .`.'),
			].join('\n'),
		);

	program
		.command('scan [target]')
		.description('Run sanity checks against a repository path')
		.option(
			'-f, --format <format>',
			'Output format: terminal | markdown | json',
			parseOutputFormat,
			'terminal',
		)
		.option('-o, --output <file>', 'Write report to file instead of stdout')
		.option(
			'--fail-on <severity>',
			'Exit with code 1 when highest finding is >= this severity (info|warning|error|fatal)',
			parseFailSeverity,
		)
		.addHelpText(
			'after',
			[
				'',
				h1('Output Formats'),
				'  terminal  Human-friendly colored report',
				'  markdown  Shareable report for PRs/docs',
				'  json      Machine-readable output for automation',
				'',
				h1('Exit Behavior'),
				'  --fail-on info|warning|error|fatal',
				'  Sets exit code to 1 when a finding reaches the selected severity.',
			].join('\n'),
		)
		.action(async (target: string | undefined, options: ScanOptions) => {
			await runScan(target ?? '.', options);
		});

	// Keep v1 DX simple: running without a subcommand behaves like `scan .`.
	program.action(async () => {
		await runScan('.', { format: 'terminal' });
	});

	await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`Failed to run repo-sanity: ${message}\n`);
	process.stderr.write('Tip: run "repo-sanity scan --help" to see available commands.\n');
	process.exitCode = 1;
});
