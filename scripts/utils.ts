import * as fs from 'fs/promises';
import type { RawCaseData } from '../src/types/index.types';
import { isRawCaseData } from '../src/types/guards';

/**
 * Ensures a directory exists, creating it recursively if necessary
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
}

/**
 * Reads a JSON file and validates it as RawCaseData
 * @returns The parsed RawCaseData or null if invalid or error
 */
export async function readJsonFile(filePath: string): Promise<RawCaseData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!isRawCaseData(data)) {
      console.error(`Invalid case data structure in file ${filePath}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}