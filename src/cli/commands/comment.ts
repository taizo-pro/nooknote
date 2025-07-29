import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { handleError } from '../utils/error-handler.js';
import { Spinner } from '../utils/spinner.js';

export const commentCommand = new Command('comment')
  .description('Add a comment to a discussion')
  .argument('<discussionId>', 'Discussion number')
  .argument('[message]', 'Comment message')
  .argument('[repo]', 'Repository in owner/name format')
  .option('-e, --editor', 'Open editor for comment input')
  .action(async (discussionId: string, message: string | undefined, repo: string | undefined, options) => {
    const spinner = new Spinner();
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

      let commentBody = message;

      if (!commentBody || options.editor) {
        const answer = await inquirer.prompt([
          {
            type: 'editor',
            name: 'body',
            message: 'Enter your comment (will open in your default editor):',
            default: commentBody || '',
          },
        ]);
        commentBody = answer.body;
      }

      if (!commentBody || commentBody.trim().length === 0) {
        console.error(chalk.red('Comment cannot be empty.'));
        process.exit(1);
      }

      const client = new GitHubClient(token);
      
      // First, get the discussion to retrieve the actual discussion ID
      spinner.start(`Fetching discussion #${discussionId} from ${targetRepo}...`);
      const discussion = await client.getDiscussion(targetRepo, discussionId);
      
      spinner.update('Posting comment...');
      const comment = await client.createComment(targetRepo, discussion.id, commentBody.trim());

      spinner.succeed('Comment posted successfully!');
      console.log(chalk.gray(`URL: ${comment.url}`));
      console.log();
      console.log(chalk.bold('Your comment:'));
      console.log(comment.body);
    } catch (error) {
      spinner.fail();
      handleError(error);
    }
  });