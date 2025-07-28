import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Config, AppError, ErrorType } from './types.js';

export interface ConfigManager {
  getDefaultRepo(): Promise<string | null>;
  setDefaultRepo(repo: string): Promise<void>;
  getConfig(): Promise<Config>;
  updateConfig(config: Partial<Config>): Promise<void>;
}

export class FileConfigManager implements ConfigManager {
  private configDir: string;
  private configFile: string;

  constructor() {
    this.configDir = join(homedir(), '.github-discussions');
    this.configFile = join(this.configDir, 'config.json');
  }

  async getDefaultRepo(): Promise<string | null> {
    const config = await this.getConfig();
    return config.defaultRepo || null;
  }

  async setDefaultRepo(repo: string): Promise<void> {
    await this.updateConfig({ defaultRepo: repo });
  }

  async getConfig(): Promise<Config> {
    try {
      const configData = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      return this.validateConfig(config);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return this.getDefaultConfig();
      }
      if (error instanceof SyntaxError) {
        throw this.createError(
          ErrorType.CONFIGURATION_ERROR,
          'Invalid JSON in config file',
          error
        );
      }
      throw this.createError(
        ErrorType.CONFIGURATION_ERROR,
        'Failed to read config file',
        error
      );
    }
  }

  async updateConfig(partialConfig: Partial<Config>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...partialConfig };
      
      await this.ensureConfigDir();
      await fs.writeFile(
        this.configFile,
        JSON.stringify(newConfig, null, 2),
        'utf8'
      );
    } catch (error) {
      throw this.createError(
        ErrorType.CONFIGURATION_ERROR,
        'Failed to update config file',
        error
      );
    }
  }

  private validateConfig(config: any): Config {
    const validatedConfig: Config = {};

    if (config.defaultRepo && typeof config.defaultRepo === 'string') {
      if (this.isValidRepoFormat(config.defaultRepo)) {
        validatedConfig.defaultRepo = config.defaultRepo;
      }
    }

    if (config.token && typeof config.token === 'string') {
      validatedConfig.token = config.token;
    }

    if (config.outputFormat && typeof config.outputFormat === 'string') {
      if (['table', 'json', 'markdown'].includes(config.outputFormat)) {
        validatedConfig.outputFormat = config.outputFormat as 'table' | 'json' | 'markdown';
      }
    }

    return validatedConfig;
  }

  private isValidRepoFormat(repo: string): boolean {
    const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    return repoPattern.test(repo);
  }

  private getDefaultConfig(): Config {
    return {
      outputFormat: 'table',
    };
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 });
    } catch (error) {
      throw this.createError(
        ErrorType.CONFIGURATION_ERROR,
        'Failed to create config directory',
        error
      );
    }
  }

  private createError(
    type: ErrorType,
    message: string,
    originalError?: any
  ): AppError {
    return {
      type,
      message,
      details: originalError,
      suggestions: this.getSuggestions(type),
    };
  }

  private getSuggestions(type: ErrorType): string[] {
    switch (type) {
      case ErrorType.CONFIGURATION_ERROR:
        return [
          'Check the config file at ~/.github-discussions/config.json',
          'Ensure the JSON format is valid',
          'Delete the config file to reset to defaults',
        ];
      default:
        return [];
    }
  }
}