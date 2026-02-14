# CLI Commands and Flags

## Binary
- Command name: `repo-sanity`
- Entrypoint: `dist/index.js`

## Main Command
- `repo-sanity`
  - Runs the default action for v1 (`scan .`) in `terminal` format.

## Subcommands
### `scan [target]`
Run sanity checks for a repository path.

- `target` (optional): path to analyze.
- Default: current directory (`.`).

### Flags
- `-f, --format <format>`
  - Output format.
  - Allowed values: `terminal`, `markdown`, `json`.
  - Default: `terminal`.
- `-o, --output <file>`
  - Writes the report to a file instead of stdout.
  - Example: `--output reports/sanity.md`
- `--fail-on <severity>`
  - Sets process exit code to `1` if highest finding is equal or above this severity.
  - Allowed values: `info`, `warning`, `error`, `fatal`.
  - Useful for CI pipelines.

## Examples
- `repo-sanity scan`
- `repo-sanity scan . --format markdown --output reports/sanity.md`
- `repo-sanity scan ../my-project --format json --fail-on error`
- `repo-sanity` (same as scanning current folder with terminal output)

## Help
- `repo-sanity --help`
- `repo-sanity scan --help`

## Project NPM Scripts
- `npm run dev`: run CLI from source (`tsx src/index.ts`).
- `npm run build`: build `dist/` with `tsup`.
- `npm run lint`: run ESLint.
- `npm test`: run tests once with Vitest.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run release`: publish with Changesets.
