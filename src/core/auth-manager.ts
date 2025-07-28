import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { AppError, ErrorType } from './types.js';

export interface AuthManager {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  validateToken(token: string): Promise<boolean>;
  clearToken(): Promise<void>;
}

export class FileAuthManager implements AuthManager {
  private configDir: string;
  private tokenFile: string;

  constructor() {
    this.configDir = join(homedir(), '.github-discussions');
    this.tokenFile = join(this.configDir, 'token');
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await fs.readFile(this.tokenFile, 'utf8');
      return token.trim() || null;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw this.createError(
        ErrorType.CONFIGURATION_ERROR,
        'Failed to read token file',
        error
      );
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(this.tokenFile, token, { mode: 0o600 });
    } catch (error) {
      throw this.createError(
        ErrorType.CONFIGURATION_ERROR,
        'Failed to save token',
        error
      );
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'github-discussions-cli',
        },
      });

      if (response.status === 200) {
        const data = await response.json() as { login?: string };
        return !!data.login;
      }

      return false;
    } catch (error) {
      throw this.createError(
        ErrorType.NETWORK_ERROR,
        'Failed to validate token',
        error
      );
    }
  }

  async clearToken(): Promise<void> {
    try {
      await fs.unlink(this.tokenFile);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw this.createError(
          ErrorType.CONFIGURATION_ERROR,
          'Failed to clear token',
          error
        );
      }
    }
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
          'Check file permissions in ~/.github-discussions/',
          'Ensure you have write access to your home directory',
        ];
      case ErrorType.NETWORK_ERROR:
        return ['Check your internet connection', 'Try again later'];
      default:
        return [];
    }
  }
}