# Repo Sanity Report

- Target: `C:\Users\ziron\Projects\repo-sanity`
- Generated at: `2026-02-14T01:36:55.839Z`
- Score: **90/100**
- Findings: **2**

## Findings

| Severity | Rule | Title | Summary | Files |
| --- | --- | --- | --- | --- |
| WARNING | eslint-coverage | ESLint config not found | No eslint.config.* or .eslintrc.* file was detected at repository root. | - |
| INFO | tsconfig-safety | skipLibCheck is enabled | Builds are faster, but declaration issues in dependencies are not checked. | tsconfig.json |
