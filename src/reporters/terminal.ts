import chalk from 'chalk';
import type { Finding, Report, Severity } from '../types.js';

const labelBySeverity: Record<Severity, string> = {
	fatal: 'FATAL',
	error: 'ERROR',
	warning: 'WARN',
	info: 'INFO',
	ok: 'OK',
};

function colorizeSeverity(severity: Severity): (value: string) => string {
	switch (severity) {
		case 'fatal':
			return chalk.bgRed.white.bold;
		case 'error':
			return chalk.redBright.bold;
		case 'warning':
			return chalk.yellowBright.bold;
		case 'info':
			return chalk.cyanBright.bold;
		case 'ok':
			return chalk.greenBright.bold;
	}
}

function renderFinding(finding: Finding): string {
	const paint = colorizeSeverity(finding.severity);
	const severity = paint(`[${labelBySeverity[finding.severity].padEnd(5)}]`);
	const files = finding.files && finding.files.length > 0 ? `\n  files: ${finding.files.join(', ')}` : '';
	return `${severity} ${chalk.whiteBright(finding.title)}\n  ${chalk.gray(finding.summary)}${files}`;
}

function renderBrandHeader(): string {
	const title = `${chalk.bgBlue.white.bold(' REPO ')}${chalk.bgCyan.white.bold(' SANITY ')}`;
	const subtitle = chalk.gray('fast technical audit for JS/TS repositories');
	return `${title}\n${subtitle}`;
}

function scoreReportColors(score: number): (value: string) => string {
	switch(score) {
		case 90:
		case 100:
			return chalk.greenBright.bold;
		case 80:
			return chalk.yellowBright.bold;
		default:
			return chalk.redBright.bold;
	}
}

export function renderTerminalReport(report: Report): string {
	const findingsText =
		report.findings.length === 0
			? `${chalk.greenBright.bold('[OK]')} No findings.`
			: report.findings.map(renderFinding).join('\n');

	return [
		renderBrandHeader(),
		'',
		`${chalk.bold('Target:')} ${report.targetPath}`,
		`${chalk.bold('Generated:')} ${report.generatedAt}`,
		`${chalk.bold('Score:')} ${scoreReportColors(report.score)(String(report.score))}/100`,
		`${chalk.bold('Findings:')} ${report.findings.length}`,
		'',
		findingsText,
		'',
	].join('\n');
}
