import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { StripePacConfig } from './types';

/**
 * Loads a configuration from a YAML file
 * @param configPath Path to the YAML config file
 * @returns The loaded configuration
 */
export function loadYamlConfig(configPath: string): StripePacConfig {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as StripePacConfig;
    
    // Ensure products and prices arrays exist
    if (!config.products) config.products = [];
    if (!config.prices) config.prices = [];
    
    return config;
  } catch (error) {
    console.error(`❌ Error loading YAML config from ${configPath}:`, error);
    throw error;
  }
}

/**
 * Save a configuration back to a YAML file
 * @param configPath Path to save the YAML config
 * @param config The configuration to save
 */
export function saveYamlConfig(configPath: string, config: StripePacConfig): void {
  try {
    const yamlContent = yaml.dump(config, { noRefs: true });
    fs.writeFileSync(configPath, yamlContent, 'utf8');
    console.log(`✅ Configuration saved to ${configPath}`);
  } catch (error) {
    console.error(`❌ Error saving YAML config to ${configPath}:`, error);
    throw error;
  }
}