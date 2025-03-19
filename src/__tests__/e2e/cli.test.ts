/**
 * CLI tests
 */
import { execSync } from 'child_process';
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
    expect(stdout).toContain('validate');
    expect(stdout).toContain('-h, --help');
    expect(stdout).toContain('--env=');
    expect(stdout).toContain('--stripe-key=');
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
});