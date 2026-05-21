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
        <div className="bg-accent-primary/10 rounded-xl p-4 border border-accent-primary/30">
          <p className="text-sm text-accent-primary">Language</p>
          <p className="text-lg font-bold text-foreground capitalize">
            {language}
          </p>
        </div>

        <div className="bg-accent-secondary/10 rounded-xl p-4 border border-accent-secondary/30">
          <p className="text-sm text-accent-secondary">Framework</p>
          <p className="text-lg font-bold text-foreground capitalize">
            {framework}
          </p>
        </div>

        <div className="bg-success/10 rounded-xl p-4 border border-success/30">
          <p className="text-sm text-success">Functions Found</p>
          <p className="text-lg font-bold text-foreground">
            {functionCount}
          </p>
        </div>

        <div className="bg-warning/10 rounded-xl p-4 border border-warning/30">
          <p className="text-sm text-warning">Edge Cases</p>
          <p className="text-lg font-bold text-foreground">
            {edgeCasesCount}
          </p>
        </div>
      </div>

      {/* Test Code Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Generated Tests</h3>
          <CopyButton text={testCode} />
        </div>

        {/* Code Block */}
        <div className="bg-background-tertiary/50 border border-border rounded-xl p-5 overflow-x-auto">
          <pre className="text-foreground text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
            <code>{testCode}</code>
          </pre>
        </div>

        {/* Code Info */}
        <div className="mt-4 text-xs text-foreground-muted flex items-center justify-between">
          <p>
            Total lines: {testCode.split('\n').length} | File extension:{' '}
            <span className="font-mono bg-background-secondary px-1.5 py-0.5 rounded text-foreground">
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
      <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-xl p-5">
        <h4 className="font-semibold text-accent-primary mb-3 flex items-center gap-2">
          <span>💡</span> Tips
        </h4>
        <ul className="text-sm text-foreground-secondary space-y-2 list-disc list-inside leading-relaxed">
          <li>Copy the test code and paste it into your project</li>
          <li>Modify test values as needed for your specific use cases</li>
          <li>
            Run tests with:{' '}
            <span className="font-mono bg-background-secondary text-foreground px-2 py-1 rounded-md ml-1 text-xs border border-border">
              {getTestCommand(framework)}
            </span>
          </li>
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
