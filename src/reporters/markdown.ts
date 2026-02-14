import type { Finding, Report, Severity } from '../types.js';

const BADGE: Record<Severity, string> = {
	fatal: 'FATAL',
	error: 'ERROR',
	warning: 'WARNING',
	info: 'INFO',
	ok: 'OK',
};

function renderFiles(finding: Finding): string {
	if (!finding.files || finding.files.length === 0) {
		return '-';
	}

	return finding.files.join(', ');
}

export function renderMarkdownReport(report: Report): string {
	const lines: string[] = [
		'# Repo Sanity Report',
		'',
		`- Target: \`${report.targetPath}\``,
		`- Generated at: \`${report.generatedAt}\``,
		`- Score: **${report.score}/100**`,
		`- Findings: **${report.findings.length}**`,
		'',
		'## Findings',
		'',
		'| Severity | Rule | Title | Summary | Files |',
		'| --- | --- | --- | --- | --- |',
	];

	if (report.findings.length === 0) {
		lines.push('| OK | - | No findings | No issues detected | - |');
	} else {
		for (const finding of report.findings) {
			lines.push(
				`| ${BADGE[finding.severity]} | ${finding.ruleId} | ${finding.title} | ${finding.summary} | ${renderFiles(finding)} |`,
			);
		}
	}

	lines.push('');
	return lines.join('\n');
}
