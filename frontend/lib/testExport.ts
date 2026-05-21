/**
 * Test file export utilities
 */

export interface TestFileExport {
  filename: string;
  content: string;
  mimeType: string;
}

/**
 * Generate filename for test file based on framework and language
 */
export function generateTestFilename(framework: string, language: string, timestamp = true): string {
  const date = new Date();
  const dateStr = timestamp
    ? `_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';

  const extensionMap: Record<string, string> = {
    pytest: '.py',
    unittest: '.py',
    jest: '.test.js',
    vitest: '.test.ts',
    mocha: '.test.js',
    junit4: 'Test.java',
    junit5: 'Test.java',
  };

  const extension = extensionMap[framework] || '.test.js';

  if (framework === 'pytest' || framework === 'unittest') {
    return `test_${framework}${dateStr}.py`;
  } else if (framework === 'jest') {
    return `function${dateStr}.test.js`;
  } else if (framework === 'vitest') {
    return `function${dateStr}.test.ts`;
  } else if (framework === 'mocha') {
    return `test${dateStr}.js`;
  } else if (framework === 'junit4' || framework === 'junit5') {
    return `FunctionTest${dateStr}.java`;
  }

  return `test${dateStr}${extension}`;
}

/**
 * Get MIME type for file
 */
export function getFileMimeType(filename: string): string {
  if (filename.endsWith('.py')) return 'text/plain';
  if (filename.endsWith('.java')) return 'text/plain';
  if (filename.endsWith('.js')) return 'text/javascript';
  if (filename.endsWith('.ts')) return 'text/typescript';
  return 'text/plain';
}

/**
 * Export test code as file
 */
export function exportTestCode(
  testCode: string,
  framework: string,
  language: string
): TestFileExport {
  const filename = generateTestFilename(framework, language);
  const mimeType = getFileMimeType(filename);

  return {
    filename,
    content: testCode,
    mimeType,
  };
}

/**
 * Download test file to user's computer
 */
export function downloadTestFile(
  testCode: string,
  framework: string,
  language: string
): void {
  const { filename, content, mimeType } = exportTestCode(testCode, framework, language);

  // Create blob
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Copy test code to clipboard
 */
export async function copyTestCodeToClipboard(testCode: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(testCode);
    return true;
  } catch {
    return false;
  }
}
