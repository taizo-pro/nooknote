import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { handleError } from '../utils/error-handler.js';

export const createCommand = new Command('create')
  .description('Create a new discussion')
  .argument('[title]', 'Discussion title')
  .argument('[body]', 'Discussion body')
  .argument('[repo]', 'Repository in owner/name format')
  .option('-c, --category <category>', 'Discussion category ID')
  .option('-e, --editor', 'Open editor for body input')
  .action(async (title: string | undefined, body: string | undefined, repo: string | undefined, options) => {
    try {
      const authManager = new FileAuthManager();
      const configManager = new FileConfigManager();
      
      const token = await authManager.getToken();
      if (!token) {
        console.error(
          chalk.red(
            'No GitHub token found. Run "gh-discussions config" to set up authentication.'
          )
        );
        process.exit(1);
      }

      const targetRepo = repo || (await configManager.getDefaultRepo());
      if (!targetRepo) {
        console.error(
          chalk.red(
            'No repository specified. Provide a repo argument or set a default repo with "gh-discussions config".'
          )
        );
        process.exit(1);
      }

      let discussionTitle = title;
      let discussionBody = body;

      // Prompt for title if not provided
      if (!discussionTitle) {
        const titleAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Enter discussion title:',
            validate: (input: string) => input.trim().length > 0 || 'Title cannot be empty',
          },
        ]);
        discussionTitle = titleAnswer.title;
      }

      // Prompt for body if not provided or editor option is used
      if (!discussionBody || options.editor) {
        const bodyAnswer = await inquirer.prompt([
          {
            type: 'editor',
            name: 'body',
            message: 'Enter discussion body (will open in your default editor):',
            default: discussionBody || '',
          },
        ]);
        discussionBody = bodyAnswer.body;
      }

      if (!discussionBody || discussionBody.trim().length === 0) {
        console.error(chalk.red('Discussion body cannot be empty.'));
        process.exit(1);
      }

      const client = new GitHubClient(token);
      const discussion = await client.createDiscussion(
        targetRepo,
        discussionTitle!.trim(),
        discussionBody.trim(),
        options.category
      );

      console.log(chalk.green('✓ Discussion created successfully!'));
      console.log(chalk.gray(`URL: ${discussion.url}`));
      console.log();
      console.log(chalk.bold(`Title: ${discussion.title}`));
      console.log(chalk.gray(`Category: ${discussion.category?.name || 'N/A'}`));
      console.log();
      console.log(chalk.bold('Description:'));
      console.log(discussionBody.trim());
    } catch (error) {
      handleError(error);
    }
  });