import chalk from 'chalk';
import { AppError, ErrorType } from '../../core/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ErrorContext {
  operation?: string;
  repository?: string;
  discussionId?: string;
  timestamp?: Date;
}

export class EnhancedErrorHandler {
  private static logDir = join(homedir(), '.github-discussions', 'logs');
  private static maxRetries = 3;

  static async handleError(error: any, context?: ErrorContext): Promise<void> {
    const enhancedError = this.enhanceError(error, context);
    
    // Display user-friendly error
    this.displayError(enhancedError);
    
    // Log to file for debugging
    await this.logError(enhancedError);
    
    // Suggest recovery options
    this.suggestRecovery(enhancedError);
    
    // Exit with appropriate code
    process.exit(this.getExitCode(enhancedError.type));
  }

  private static enhanceError(error: any, context?: ErrorContext): AppError {
    if (this.isAppError(error)) {
      return {
        ...error,
        details: {
          ...error.details,
          context,
          timestamp: new Date(),
        },
      };
    }

    // Convert unknown errors to AppError
    const errorType = this.inferErrorType(error);
    return {
      type: errorType,
      message: error.message || 'An unknown error occurred',
      details: {
        originalError: error,
        context,
        timestamp: new Date(),
        stack: error.stack,
      },
      suggestions: this.generateSuggestions(errorType, error),
    };
  }

  private static inferErrorType(error: any): ErrorType {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return ErrorType.NETWORK_ERROR;
    }
    if (error.message?.includes('401') || error.message?.includes('credentials')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    if (error.message?.includes('404')) {
      return ErrorType.API_ERROR;
    }
    return ErrorType.API_ERROR;
  }

  private static generateSuggestions(type: ErrorType, error: any): string[] {
    const suggestions: string[] = [];

    switch (type) {
      case ErrorType.AUTHENTICATION_ERROR:
        suggestions.push(
          'Check your GitHub Personal Access Token',
          'Run: gh-discussions config --token <new-token>',
          'Ensure token has required scopes (repo or public_repo)'
        );
        break;
      
      case ErrorType.NETWORK_ERROR:
        suggestions.push(
          'Check your internet connection',
          'Verify GitHub API is accessible',
          'Try again with DEBUG=1 for more details',
          'Check if you\'re behind a proxy'
        );
        break;
      
      case ErrorType.API_ERROR:
        if (error.message?.includes('404')) {
          suggestions.push(
            'Verify the repository exists and is accessible',
            'Check if Discussions are enabled for the repository',
            'Ensure the discussion number is correct'
          );
        } else {
          suggestions.push(
            'Check GitHub API status at https://www.githubstatus.com/',
            'Verify your request parameters',
            'Try reducing the request size'
          );
        }
        break;
      
      default:
        suggestions.push(
          'Check the error details above',
          'Run with DEBUG=1 for more information',
          'Report issue at https://github.com/taizo-pro/nooknote/issues'
        );
    }

    return suggestions;
  }

  private static displayError(error: AppError): void {
    console.error();
    console.error(chalk.red('━'.repeat(60)));
    console.error(chalk.red.bold(`✗ ${this.getErrorTypeLabel(error.type)}`));
    console.error(chalk.red('━'.repeat(60)));
    console.error();
    
    // Main error message
    console.error(chalk.white.bold('Error:'), chalk.red(error.message));
    
    // Context information
    if (error.details?.context) {
      console.error();
      console.error(chalk.white.bold('Context:'));
      const ctx = error.details.context;
      if (ctx.operation) console.error(chalk.gray(`  Operation: ${ctx.operation}`));
      if (ctx.repository) console.error(chalk.gray(`  Repository: ${ctx.repository}`));
      if (ctx.discussionId) console.error(chalk.gray(`  Discussion: #${ctx.discussionId}`));
    }
    
    // Suggestions
    if (error.suggestions && error.suggestions.length > 0) {
      console.error();
      console.error(chalk.yellow.bold('💡 Suggestions:'));
      error.suggestions.forEach((suggestion) => {
        console.error(chalk.yellow(`  • ${suggestion}`));
      });
    }
    
    // Debug info
    if (process.env.DEBUG) {
      console.error();
      console.error(chalk.gray.bold('Debug Information:'));
      console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
    } else {
      console.error();
      console.error(chalk.gray('Run with DEBUG=1 for detailed error information'));
    }
    
    console.error();
    console.error(chalk.red('━'.repeat(60)));
  }

  private static async logError(error: AppError): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      
      const logFile = join(this.logDir, `error-${Date.now()}.json`);
      const logContent = JSON.stringify({
        ...error,
        environment: {
          node: process.version,
          platform: process.platform,
          cwd: process.cwd(),
        },
      }, null, 2);
      
      await fs.writeFile(logFile, logContent, 'utf8');
      
      // Clean old logs (keep last 10)
      const logs = await fs.readdir(this.logDir);
      const errorLogs = logs.filter(f => f.startsWith('error-')).sort();
      if (errorLogs.length > 10) {
        for (const oldLog of errorLogs.slice(0, -10)) {
          await fs.unlink(join(this.logDir, oldLog));
        }
      }
    } catch {
      // Silently ignore logging errors
    }
  }

  private static suggestRecovery(error: AppError): void {
    if (error.type === ErrorType.NETWORK_ERROR) {
      console.error();
      console.error(chalk.cyan('💡 Tip: Network errors are often temporary.'));
      console.error(chalk.cyan('   The CLI will retry failed requests automatically.'));
    }
  }

  private static getExitCode(type: ErrorType): number {
    switch (type) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 2;
      case ErrorType.NETWORK_ERROR:
        return 3;
      case ErrorType.CONFIGURATION_ERROR:
        return 4;
      case ErrorType.VALIDATION_ERROR:
        return 5;
      default:
        return 1;
    }
  }

  private static getErrorTypeLabel(type: ErrorType): string {
    switch (type) {
      case ErrorType.AUTHENTICATION_ERROR:
        return '🔐 Authentication Error';
      case ErrorType.NETWORK_ERROR:
        return '🌐 Network Error';
      case ErrorType.API_ERROR:
        return '⚠️  API Error';
      case ErrorType.CONFIGURATION_ERROR:
        return '⚙️  Configuration Error';
      case ErrorType.VALIDATION_ERROR:
        return '❌ Validation Error';
      default:
        return '❗ Error';
    }
  }

  private static isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'message' in error;
  }

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry auth errors
        if (this.inferErrorType(error) === ErrorType.AUTHENTICATION_ERROR) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(chalk.yellow(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`));
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}