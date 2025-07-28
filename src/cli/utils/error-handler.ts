import chalk from 'chalk';
import { AppError, ErrorType } from '../../core/index.js';

export function handleError(error: any): void {
  if (isAppError(error)) {
    handleAppError(error);
  } else {
    handleUnknownError(error);
  }
  process.exit(1);
}

function isAppError(error: any): error is AppError {
  return error && typeof error === 'object' && 'type' in error && 'message' in error;
}

function handleAppError(error: AppError): void {
  console.error(chalk.red(`✗ ${getErrorTypeLabel(error.type)}: ${error.message}`));
  
  if (error.suggestions && error.suggestions.length > 0) {
    console.error();
    console.error(chalk.yellow('Suggestions:'));
    error.suggestions.forEach((suggestion) => {
      console.error(chalk.yellow(`  • ${suggestion}`));
    });
  }

  if (process.env.DEBUG && error.details) {
    console.error();
    console.error(chalk.gray('Debug information:'));
    console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
  }
}

function handleUnknownError(error: any): void {
  console.error(chalk.red('✗ An unexpected error occurred:'));
  console.error(chalk.red(error.message || String(error)));

  if (process.env.DEBUG) {
    console.error();
    console.error(chalk.gray('Stack trace:'));
    console.error(chalk.gray(error.stack || 'No stack trace available'));
  } else {
    console.error();
    console.error(chalk.gray('Run with DEBUG=1 for more details'));
  }
}

function getErrorTypeLabel(type: ErrorType): string {
  switch (type) {
    case ErrorType.AUTHENTICATION_ERROR:
      return 'Authentication Error';
    case ErrorType.NETWORK_ERROR:
      return 'Network Error';
    case ErrorType.API_ERROR:
      return 'API Error';
    case ErrorType.CONFIGURATION_ERROR:
      return 'Configuration Error';
    case ErrorType.VALIDATION_ERROR:
      return 'Validation Error';
    default:
      return 'Error';
  }
}