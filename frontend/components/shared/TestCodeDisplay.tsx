'use client';

import { CopyButton } from './CopyButton';

interface TestCodeDisplayProps {
  testCode: string;
  language: string;
  framework: string;
  functionCount: number;
  edgeCasesCount: number;
}

export function TestCodeDisplay({
  testCode,
  language,
  framework,
  functionCount,
  edgeCasesCount,
}: TestCodeDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Language</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100 capitalize">
            {language}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Framework</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100 capitalize">
            {framework}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Functions Found</p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {functionCount}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">Edge Cases</p>
          <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
            {edgeCasesCount}
          </p>
        </div>
      </div>

      {/* Test Code Display */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Tests</h3>
          <CopyButton text={testCode} />
        </div>

        {/* Code Block with Syntax Highlighting */}
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
          <pre className="text-gray-100 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
            <code>{testCode}</code>
          </pre>
        </div>

        {/* Code Info */}
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <p>
            Total lines: {testCode.split('\n').length} | File extension:{' '}
            <span className="font-mono">
              .
              {language === 'python'
                ? 'py'
                : language === 'java'
                  ? 'java'
                  : language === 'typescript'
                    ? 'ts'
                    : 'js'}
            </span>
          </p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Copy the test code and paste it into your project</li>
          <li>Modify test values as needed for your specific use cases</li>
          <li>Run tests with: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">{getTestCommand(framework)}</span></li>
          <li>Add more test cases for better coverage</li>
        </ul>
      </div>
    </div>
  );
}

function getTestCommand(framework: string): string {
  const commands: Record<string, string> = {
    pytest: 'pytest test_*.py',
    unittest: 'python -m unittest',
    jest: 'npm test',
    vitest: 'vitest',
    mocha: 'mocha test/*.js',
    junit4: 'mvn test',
    junit5: 'mvn test',
  };
  return commands[framework] || 'npm test';
}
