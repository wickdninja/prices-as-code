import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Config, ConfigSchema } from './types.js';
import { pathToFileURL } from 'url';
import * as esbuild from 'esbuild';

/**
 * Reads configuration from a file (TypeScript or YAML)
 */
export async function readConfigFromFile(configPath: string): Promise<Config> {
  try {
    const extension = path.extname(configPath).toLowerCase();
    
    if (extension === '.ts' || extension === '.js' || extension === '.mjs') {
      // Load from TypeScript/JavaScript module
      console.log(`📦 Loading configuration from TypeScript/JavaScript module: ${configPath}`);
      return await loadTsConfig(configPath);
    } else if (extension === '.yml' || extension === '.yaml') {
      // Load from YAML file
      console.log(`📦 Loading configuration from YAML file: ${configPath}`);
      return loadYamlConfig(configPath);
    } else if (extension === '.json') {
      // Load from JSON file
      console.log(`📦 Loading configuration from JSON file: ${configPath}`);
      return loadJsonConfig(configPath);
    } else {
      throw new Error(`Unsupported file format: ${extension}. Please use .ts, .js, .mjs, .json, .yml, or .yaml`);
    }
  } catch (error) {
    // Improve error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('Cannot find module') && error.message.includes(configPath)) {
        throw new Error(`Configuration file not found or inaccessible: ${configPath}`);
      }
      
      if (error.message.includes('Unexpected token') || error.message.includes('Invalid YAML')) {
        throw new Error(`Invalid syntax in configuration file: ${configPath}. Please check your file format.`);
      }
      
      // Add a hint for schema validation errors
      if (error.message.includes('validation failed')) {
        console.error(`❌ Error loading configuration from ${configPath}:`, error);
        throw error;
      }
    }
    
    // Log the original error and rethrow
    console.error(`❌ Error loading configuration from ${configPath}:`, error);
    throw error;
  }
}

/**
 * Loads a configuration from a TypeScript/JavaScript module
 */
async function loadTsConfig(configPath: string): Promise<Config> {
  try {
    // Check if we're trying to load a TypeScript file directly
    if (configPath.endsWith('.ts')) {
      try {
        // Use esbuild to transpile the TypeScript file to JavaScript
        console.log(`🔄 Transpiling TypeScript file: ${configPath}`);
        
        // Get a temporary file name for the transpiled JavaScript
        const tempJsPath = `${configPath}.temp.js`;
        
        // Read the TypeScript file
        const content = fs.readFileSync(configPath, 'utf8');
        
        // Transpile the TypeScript to JavaScript using esbuild
        const result = await esbuild.transform(content, {
          loader: 'ts',
          target: 'es2020',
          format: 'esm'
        });
        
        // Write the transpiled JavaScript to a temporary file
        fs.writeFileSync(tempJsPath, result.code, 'utf8');
        
        try {
          // Try to import the transpiled JavaScript
          const moduleUrl = pathToFileURL(path.resolve(tempJsPath)).href;
          
          // Dynamically import the transpiled module
          const module = await import(moduleUrl);
          
          // Get the default export or named export 'config'
          const config = module.default || module.config;
          
          if (!config) {
            throw new Error(`TypeScript module does not export a default configuration or 'config' export`);
          }
          
          // Clean up the temporary file
          fs.unlinkSync(tempJsPath);
          
          // Validate with Zod schema
          return ConfigSchema.parse(config);
        } catch (error) {
          // Clean up the temporary file if it exists
          if (fs.existsSync(tempJsPath)) {
            fs.unlinkSync(tempJsPath);
          }
          
          const importError = error as Error;
          console.error(`❌ Error importing transpiled TypeScript module: ${importError}`);
          throw new Error(`Failed to load TypeScript configuration: ${importError.message}`);
        }
      } catch (error) {
        console.error(`❌ Error processing TypeScript file ${configPath}:`, error);
        throw error;
      }
    }
    
    // For JavaScript files, use the regular ES module import approach
    // Convert path to URL for ES modules
    const moduleUrl = pathToFileURL(path.resolve(configPath)).href;
    
    // Dynamically import the module
    const module = await import(moduleUrl);
    
    // Get the default export or named export 'config'
    const config = module.default || module.config;
    
    if (!config) {
      throw new Error(`Module does not export a default configuration or 'config' export`);
    }
    
    // Validate with Zod schema
    return ConfigSchema.parse(config);
  } catch (error) {
    console.error(`❌ Error loading TypeScript/JavaScript config from ${configPath}:`, error);
    throw error;
  }
}

/**
 * Loads a configuration from a JSON file
 */
export function loadJsonConfig(configPath: string): Config {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContents) as Config;
    
    // Ensure products and prices arrays exist
    if (!config.products) config.products = [];
    if (!config.prices) config.prices = [];
    
    // Validate with Zod schema
    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`❌ Error parsing JSON in ${configPath}:`, error.message);
      throw new Error(`Invalid JSON in configuration file: ${configPath}. ${error.message}`);
    }
    
    console.error(`❌ Error loading JSON config from ${configPath}:`, error);
    throw error;
  }
}

/**
 * Loads a configuration from a YAML file
 */
export function loadYamlConfig(configPath: string): Config {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as Config;
    
    // Ensure products and prices arrays exist
    if (!config.products) config.products = [];
    if (!config.prices) config.prices = [];
    
    // Validate with Zod schema
    return ConfigSchema.parse(config);
  } catch (error) {
    // For validation errors, format them nicely before rethrowing
    if (error && 
        typeof error === 'object' && 
        'name' in error && 
        error.name === 'ZodError' &&
        'issues' in error) {
        
      const zodError = error as { issues: Array<{ code: string; message: string; path: (string | number)[] }> };
      const issues = zodError.issues || [];
      
      if (issues.length > 0) {
        // Check for common patterns in validation errors
        if (issues.some(issue => 
          issue.code === 'invalid_union_discriminator' && 
          typeof issue.message === 'string' &&
          issue.message.includes("Expected 'stripe'"))) {
          
          const friendlyError = new Error(
            `Configuration validation failed: Your products and prices are missing the 'provider' field. ` +
            `Each product and price must have a 'provider' field set to 'stripe'. ` +
            `Please update your configuration file to include this field.`
          );
          throw friendlyError;
        }
      }
    }
    
    // For other errors, log and rethrow
    console.error(`❌ Error loading YAML config from ${configPath}:`, error);
    throw error;
  }
}

/**
 * Writes configuration to a file (TypeScript or YAML)
 */
export async function writeConfigToFile(configPath: string, config: Config): Promise<void> {
  try {
    const extension = path.extname(configPath).toLowerCase();
    
    if (extension === '.ts' || extension === '.js' || extension === '.mjs') {
      // Write to TypeScript/JavaScript file
      await writeTsConfig(configPath, config);
    } else if (extension === '.yml' || extension === '.yaml') {
      // Write to YAML file
      saveYamlConfig(configPath, config);
    } else if (extension === '.json') {
      // Write to JSON file
      saveJsonConfig(configPath, config);
    } else {
      throw new Error(`Unsupported file format for writing: ${extension}. Please use .ts, .js, .json, .yml, or .yaml`);
    }
    
    console.log(`✅ Configuration saved to ${configPath}`);
  } catch (error) {
    console.error(`❌ Error saving config to ${configPath}:`, error);
    throw error;
  }
}

/**
 * Writes configuration to a TypeScript or JavaScript file
 */
async function writeTsConfig(configPath: string, config: Config): Promise<void> {
  try {
    // Determine if we're writing to a TypeScript or JavaScript file
    const isTypeScript = configPath.toLowerCase().endsWith('.ts');
    
    // Create a nicely formatted representation
    const content = `/**
 * This file is auto-generated by prices-as-code.
 * Manual changes may be overwritten.
 */
${isTypeScript ? 'import { Config } from \'prices-as-code\';\n\n' : ''}
export const config${isTypeScript ? ': Config' : ''} = ${JSON.stringify(config, null, 2)};

export default config;
`;
    
    fs.writeFileSync(configPath, content, 'utf8');
  } catch (error) {
    console.error(`❌ Error saving ${configPath.toLowerCase().endsWith('.ts') ? 'TypeScript' : 'JavaScript'} config to ${configPath}:`, error);
    throw error;
  }
}

/**
 * Writes configuration to a YAML file
 */
export function saveYamlConfig(configPath: string, config: Config): void {
  try {
    const yamlContent = yaml.dump(config, { noRefs: true });
    fs.writeFileSync(configPath, yamlContent, 'utf8');
  } catch (error) {
    console.error(`❌ Error saving YAML config to ${configPath}:`, error);
    throw error;
  }
}

/**
 * Writes configuration to a JSON file
 */
export function saveJsonConfig(configPath: string, config: Config): void {
  try {
    const jsonContent = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, jsonContent, 'utf8');
  } catch (error) {
    console.error(`❌ Error saving JSON config to ${configPath}:`, error);
    throw error;
  }
}