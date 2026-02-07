import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		console.info(`File exists: ${filePath}`);
		return true;
	} catch (error) {
		console.error(`File does not exist: ${filePath}`, error);
		return false;
	}
}

export async function readTextFile(filePath: string): Promise<string | null> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		return content;
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		return null;
	}
}

export function resolveTargetPath(targetPath: string): string {
	try {
		const resolvedPath = path.resolve(process.cwd(), targetPath);
		console.info(`Resolved target path: ${resolvedPath}`);
		return resolvedPath;
	} catch (error) {
		console.error(`Error resolving target path ${targetPath}:`, error);
		return targetPath;
	}
}
