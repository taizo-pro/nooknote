import { Command } from 'commander';
import chalk from 'chalk';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { handleError } from '../utils/error-handler.js';
import { formatDate } from '../utils/formatters.js';

export const showCommand = new Command('show')
  .description('Show discussion details')
  .argument('<discussionId>', 'Discussion number')
  .argument('[repo]', 'Repository in owner/name format')
  .action(async (discussionId: string, repo: string | undefined) => {
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

      const client = new GitHubClient(token);
      const discussion = await client.getDiscussion(targetRepo, discussionId);

      printDiscussion(discussion);
    } catch (error) {
      handleError(error);
    }
  });

function printDiscussion(discussion: any): void {
  console.log(chalk.bold.blue(`# ${discussion.title}`));
  console.log();
  
  console.log(chalk.gray(`By: ${discussion.author.login}`));
  console.log(chalk.gray(`Created: ${formatDate(discussion.createdAt)}`));
  console.log(chalk.gray(`Updated: ${formatDate(discussion.updatedAt)}`));
  console.log(chalk.gray(`Comments: ${discussion.commentCount}`));
  console.log(chalk.gray(`Category: ${discussion.category?.name || 'N/A'}`));
  console.log(chalk.gray(`URL: ${discussion.url}`));
  
  if (discussion.locked) {
    console.log(chalk.yellow('🔒 This discussion is locked'));
  }
  
  console.log();
  console.log(chalk.bold('Description:'));
  console.log(discussion.body);
  
  if (discussion.comments && discussion.comments.length > 0) {
    console.log();
    console.log(chalk.bold(`Comments (${discussion.comments.length}):`));
    console.log('═'.repeat(60));
    
    discussion.comments.forEach((comment: any, index: number) => {
      console.log();
      console.log(chalk.bold(`Comment ${index + 1}`));
      console.log(chalk.gray(`By: ${comment.author.login} • ${formatDate(comment.createdAt)}`));
      console.log(chalk.gray(`URL: ${comment.url}`));
      console.log();
      console.log(comment.body);
      
      if (index < discussion.comments.length - 1) {
        console.log('─'.repeat(40));
      }
    });
  }
  
  console.log();
}