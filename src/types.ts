export type Severity = 'error' | 'warning' | 'info' | 'ok' | 'fatal';

export type Finding = {
    ruleId: string;
    severity: Severity;
    title: string;
    summary: string;
    details?: string;
    impact?: string;
    files?: string[];
}

export type Report = {
    targetPath: string;
    generatedAt: string;
    score: number; // 0...100
    findings: Finding[];
}

export type OutputFormat = 'json' | 'markdown' | 'terminal';