import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { handleError } from '../utils/error-handler.js';
import { formatDate } from '../utils/formatters.js';

export const listCommand = new Command('list')
  .description('List discussions in a repository')
  .argument('[repo]', 'Repository in owner/name format')
  .option('-f, --first <number>', 'Number of discussions to fetch', '20')
  .option('--format <format>', 'Output format (table, json, markdown)', 'table')
  .action(async (repo: string | undefined, options) => {
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
      const discussions = await client.listDiscussions(targetRepo, {
        first: parseInt(options.first, 10),
        orderBy: { field: 'UPDATED_AT', direction: 'DESC' },
      });

      if (discussions.length === 0) {
        console.log(chalk.yellow('No discussions found.'));
        return;
      }

      const outputFormat = options.format || (await configManager.getConfig()).outputFormat || 'table';

      switch (outputFormat) {
        case 'json':
          console.log(JSON.stringify(discussions, null, 2));
          break;
        case 'markdown':
          printMarkdownTable(discussions);
          break;
        default:
          printTable(discussions);
      }
    } catch (error) {
      handleError(error);
    }
  });

function printTable(discussions: any[]): void {
  const data = [
    ['Title', 'Author', 'Comments', 'Updated', 'Category']
  ];

  discussions.forEach((discussion) => {
    data.push([
      discussion.title.length > 50 
        ? discussion.title.substring(0, 47) + '...'
        : discussion.title,
      discussion.author.login,
      discussion.commentCount.toString(),
      formatDate(discussion.updatedAt),
      discussion.category?.name || 'N/A',
    ]);
  });

  const output = table(data, {
    header: {
      alignment: 'center',
      content: chalk.bold('GitHub Discussions'),
    },
    columns: {
      0: { width: 50, wrapWord: true },
      1: { width: 15 },
      2: { width: 8, alignment: 'center' },
      3: { width: 12 },
      4: { width: 15 },
    },
  });

  console.log(output);
}

function printMarkdownTable(discussions: any[]): void {
  console.log('| Title | Author | Comments | Updated | Category |');
  console.log('|-------|--------|----------|---------|----------|');
  
  discussions.forEach((discussion) => {
    const title = discussion.title.length > 50 
      ? discussion.title.substring(0, 47) + '...'
      : discussion.title;
    
    console.log(
      `| ${title} | ${discussion.author.login} | ${discussion.commentCount} | ${formatDate(discussion.updatedAt)} | ${discussion.category?.name || 'N/A'} |`
    );
  });
}