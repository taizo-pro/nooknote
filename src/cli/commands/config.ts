import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { FileAuthManager, FileConfigManager } from '../../core/index.js';
import { handleError } from '../utils/error-handler.js';

export const configCommand = new Command('config')
  .description('Manage configuration')
  .option('--token <token>', 'Set GitHub Personal Access Token')
  .option('--repo <repo>', 'Set default repository')
  .option('--format <format>', 'Set default output format (table, json, markdown)')
  .option('--show', 'Show current configuration')
  .option('--clear', 'Clear all configuration')
  .action(async (options) => {
    try {
      const authManager = new FileAuthManager();
      const configManager = new FileConfigManager();

      if (options.clear) {
        await authManager.clearToken();
        await configManager.updateConfig({
          defaultRepo: undefined,
          token: undefined,
          outputFormat: 'table',
        });
        console.log(chalk.green('✓ Configuration cleared successfully.'));
        return;
      }

      if (options.show) {
        const config = await configManager.getConfig();
        const token = await authManager.getToken();
        
        console.log(chalk.bold('Current Configuration:'));
        console.log(`Token: ${token ? chalk.green('✓ Set') : chalk.red('✗ Not set')}`);
        console.log(`Default Repository: ${config.defaultRepo || chalk.gray('Not set')}`);
        console.log(`Output Format: ${config.outputFormat || 'table'}`);
        return;
      }

      let hasChanges = false;

      // Handle token
      if (options.token) {
        console.log('Validating token...');
        const isValid = await authManager.validateToken(options.token);
        if (isValid) {
          await authManager.setToken(options.token);
          console.log(chalk.green('✓ Token set successfully.'));
          hasChanges = true;
        } else {
          console.error(chalk.red('✗ Invalid token. Please check your GitHub Personal Access Token.'));
          process.exit(1);
        }
      }

      // Handle repository
      if (options.repo) {
        const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
        if (repoPattern.test(options.repo)) {
          await configManager.setDefaultRepo(options.repo);
          console.log(chalk.green(`✓ Default repository set to: ${options.repo}`));
          hasChanges = true;
        } else {
          console.error(chalk.red('✗ Invalid repository format. Use: owner/repository'));
          process.exit(1);
        }
      }

      // Handle output format
      if (options.format) {
        const validFormats = ['table', 'json', 'markdown'];
        if (validFormats.includes(options.format)) {
          await configManager.updateConfig({ outputFormat: options.format });
          console.log(chalk.green(`✓ Output format set to: ${options.format}`));
          hasChanges = true;
        } else {
          console.error(chalk.red(`✗ Invalid format. Valid options: ${validFormats.join(', ')}`));
          process.exit(1);
        }
      }

      // Interactive setup if no options provided
      if (!hasChanges && !options.show && !options.clear) {
        await interactiveSetup(authManager, configManager);
      }
    } catch (error) {
      handleError(error);
    }
  });

async function interactiveSetup(authManager: FileAuthManager, configManager: FileConfigManager): Promise<void> {
  console.log(chalk.bold('GitHub Discussions CLI Configuration'));
  console.log('This will help you set up the CLI tool.');
  console.log();

  const currentToken = await authManager.getToken();
  const currentConfig = await configManager.getConfig();

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Enter your GitHub Personal Access Token:',
      when: !currentToken,
      validate: async (input: string) => {
        if (!input.trim()) return 'Token cannot be empty';
        
        console.log('Validating token...');
        const isValid = await authManager.validateToken(input.trim());
        return isValid || 'Invalid token. Please check your GitHub Personal Access Token.';
      },
    },
    {
      type: 'input',
      name: 'defaultRepo',
      message: 'Enter default repository (owner/repo):',
      default: currentConfig.defaultRepo,
      validate: (input: string) => {
        if (!input.trim()) return true; // Optional
        const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
        return repoPattern.test(input.trim()) || 'Invalid repository format. Use: owner/repository';
      },
    },
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Choose default output format:',
      choices: ['table', 'json', 'markdown'],
      default: currentConfig.outputFormat || 'table',
    },
  ]);

  if (answers.token) {
    await authManager.setToken(answers.token.trim());
    console.log(chalk.green('✓ Token saved successfully.'));
  }

  if (answers.defaultRepo && answers.defaultRepo.trim()) {
    await configManager.setDefaultRepo(answers.defaultRepo.trim());
    console.log(chalk.green(`✓ Default repository set to: ${answers.defaultRepo.trim()}`));
  }

  if (answers.outputFormat) {
    await configManager.updateConfig({ outputFormat: answers.outputFormat });
    console.log(chalk.green(`✓ Output format set to: ${answers.outputFormat}`));
  }

  console.log();
  console.log(chalk.green('✓ Configuration complete!'));
  console.log('You can now use the CLI tool. Try:');
  console.log(chalk.cyan('  gh-discussions list'));
  
  if (!answers.defaultRepo && !currentConfig.defaultRepo) {
    console.log('Note: You\'ll need to specify a repository for each command or set a default with:');
    console.log(chalk.cyan('  gh-discussions config --repo owner/repository'));
  }
}