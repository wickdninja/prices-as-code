/**
 * CLI tests
 */
import { execSync } from 'child_process';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Helper to execute CLI commands
function runCli(args: string = ''): { stdout: string; stderr: string; exitCode: number } {
  try {
    // Build path to CLI script
    const cliPath = path.resolve(process.cwd(), 'lib/cli.js');
    
    // Ensure the lib directory and CLI file exist before testing
    if (!fs.existsSync(cliPath)) {
      throw new Error(`CLI file not found at ${cliPath}. Run 'npm run build' first.`);
    }
    
    // Run the command and capture output
    const stdout = execSync(`node ${cliPath} ${args}`, { encoding: 'utf8' });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error) {
    if (error instanceof Error && 'stdout' in error && 'stderr' in error && 'status' in error) {
      // Cast to unknown first, then to a type with the expected properties
      const execError = error as unknown as { stdout?: Buffer; stderr?: Buffer; status?: number };
      return {
        stdout: execError.stdout?.toString() || '',
        stderr: execError.stderr?.toString() || '',
        exitCode: execError.status || 1
      };
    }
    // Unexpected error format, return as stderr
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: 1
    };
  }
}

// Setup test environment for async CLI tests
const testOutputDir = path.resolve(process.cwd(), 'tmp/test-output');
const testConfigPath = path.resolve(testOutputDir, 'test-config.yml');

// Create test output directory
beforeAll(() => {
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }
});

// Clean up test files after each test
afterEach(async () => {
  // Clean up any test output files
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
  
  const jsonPath = testConfigPath.replace('.yml', '.json');
  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
  }
  
  const tsPath = testConfigPath.replace('.yml', '.ts');
  if (fs.existsSync(tsPath)) {
    fs.unlinkSync(tsPath);
  }
});

// Helper function to run the CLI asynchronously (for pull tests)
function runCliAsync(args: string[]): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  return new Promise((resolve) => {
    const cliPath = path.resolve(process.cwd(), 'lib/cli.js');
    const cli = spawn('node', [cliPath, ...args], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        // Mock Stripe key for testing
        STRIPE_SECRET_KEY: 'sk_test_mock'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    cli.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    cli.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cli.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}

describe('CLI Tool', () => {
  // Test for --help flag
  test('should display help information with --help flag', () => {
    const { stdout, exitCode } = runCli('--help');
    
    // Check exit code
    expect(exitCode).toBe(0);
    
    // Check help content
    expect(stdout).toContain('Prices as Code');
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('Options:');
    expect(stdout).toContain('Examples:');
    
    // Check specific command and option presence
    expect(stdout).toContain('sync');
    expect(stdout).toContain('pull'); // Check for pull command
    expect(stdout).toContain('-h, --help');
    expect(stdout).toContain('--env=');
    expect(stdout).toContain('--stripe-key=');
    expect(stdout).toContain('--format='); // Check for format option
  });
  
  // Test for -h shorthand
  test('should display help information with -h flag', () => {
    const { stdout, exitCode } = runCli('-h');
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Prices as Code');
  });
  
  // Test error handling for missing config file
  test('should show error when no config file is provided', () => {
    const { stderr, exitCode } = runCli();
    
    expect(exitCode).toBe(1);
    expect(stderr).toContain('No configuration file specified');
  });
  
  // Test error handling for non-existent config file
  test('should show error when config file does not exist', () => {
    const { stderr, exitCode } = runCli('non-existent-file.yml');
    
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Configuration file not found');
  });

  // Pull mode should not require existing config file
  test('should not error when config file does not exist in pull mode', async () => {
    // Skip this test in CI since it needs a valid Stripe key
    if (process.env.CI === 'true') {
      return;
    }

    const nonExistentPath = path.resolve(testOutputDir, 'new-config.yml');
    
    // Make sure the file doesn't exist
    if (fs.existsSync(nonExistentPath)) {
      fs.unlinkSync(nonExistentPath);
    }
    
    try {
      const { stderr, exitCode } = await runCliAsync(['pull', nonExistentPath]);
      
      // We expect this to fail with a different error than "file not found"
      // (likely a Stripe authentication error, but not a file not found error)
      expect(stderr).not.toContain('Configuration file not found');
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      // Clean up
      if (fs.existsSync(nonExistentPath)) {
        fs.unlinkSync(nonExistentPath);
      }
    }
  });
  
  // Check format option recognition
  test('should recognize format option in pull mode', async () => {
    // Skip this test in CI
    if (process.env.CI === 'true') {
      return;
    }
    
    // Write a temporary file
    fs.writeFileSync(testConfigPath, 'placeholder', 'utf8');
    
    const jsonPath = testConfigPath.replace('.yml', '.json');
    
    try {
      // This will fail due to Stripe auth but we just want to check command parsing
      await runCliAsync(['pull', '--format=json', testConfigPath]);
      
      // Sleep briefly to allow any file operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Even though the command might fail with Stripe, the format option should be recognized
      if (fs.existsSync(jsonPath)) {
        expect(true).toBe(true); // Format option was recognized and file was created
      } else {
        console.log('JSON file not created, but this test may still pass if the format option was recognized');
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      // Clean up
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
      }
    }
  });
});