import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { EnhancedErrorHandler } from '../utils/enhanced-error-handler.js';
import { formatDate } from '../utils/formatters.js';
import { Spinner } from '../utils/spinner.js';

export const listCommand = new Command('list')
  .description('List discussions in a repository')
  .argument('[repo]', 'Repository in owner/name format')
  .option('-f, --first <number>', 'Number of discussions to fetch', '20')
  .option('--format <format>', 'Output format (table, json, markdown)', 'table')
  .option('--category <category>', 'Filter by category name')
  .option('--author <username>', 'Filter by author username')
  .option('--has-comments', 'Only show discussions with comments')
  .option('--no-comments', 'Only show discussions without comments')
  .option('--sort <field>', 'Sort by field (created,updated)', 'updated')
  .option('--order <direction>', 'Sort order (asc,desc)', 'desc')
  .action(async (repo: string | undefined, options) => {
    const spinner = new Spinner();
    const context = { operation: 'list discussions', repository: repo };

    try {
      const authManager = new FileAuthManager();
      const configManager = new FileConfigManager();
      
      spinner.start('Checking authentication...');
      const token = await authManager.getToken();
      if (!token) {
        spinner.fail('No GitHub token found');
        console.error(
          chalk.red(
            'Run "gh-discussions config" to set up authentication.'
          )
        );
        process.exit(1);
      }
      spinner.succeed('Authentication verified');

      const targetRepo = repo || (await configManager.getDefaultRepo());
      if (!targetRepo) {
        console.error(
          chalk.red(
            'No repository specified. Provide a repo argument or set a default repo with "gh-discussions config".'
          )
        );
        process.exit(1);
      }

      context.repository = targetRepo;
      spinner.start(`Fetching discussions from ${targetRepo}...`);

      const client = new GitHubClient(token);
      let discussions = await EnhancedErrorHandler.retryWithBackoff(
        () => client.listDiscussions(targetRepo, {
          first: parseInt(options.first, 10) * 2, // Get more to filter
          orderBy: { 
            field: options.sort === 'created' ? 'CREATED_AT' : 'UPDATED_AT', 
            direction: options.order.toUpperCase() as 'ASC' | 'DESC'
          },
        }),
        context
      );

      // Apply filters
      if (options.category || options.author || options.hasComments || options.noComments) {
        spinner.update('Applying filters...');
        discussions = discussions.filter(discussion => {
          // Category filter
          if (options.category && 
              discussion.category?.name.toLowerCase() !== options.category.toLowerCase()) {
            return false;
          }
          
          // Author filter
          if (options.author && 
              discussion.author.login.toLowerCase() !== options.author.toLowerCase()) {
            return false;
          }
          
          // Comments filter
          if (options.hasComments && discussion.commentCount === 0) {
            return false;
          }
          
          if (options.noComments && discussion.commentCount > 0) {
            return false;
          }
          
          return true;
        });

        // Limit after filtering
        const limit = parseInt(options.first, 10);
        if (discussions.length > limit) {
          discussions = discussions.slice(0, limit);
        }
      }

      const filterText = [];
      if (options.category) filterText.push(`category: ${options.category}`);
      if (options.author) filterText.push(`author: ${options.author}`);
      if (options.hasComments) filterText.push('with comments');
      if (options.noComments) filterText.push('without comments');
      
      const filterSuffix = filterText.length > 0 ? ` (${filterText.join(', ')})` : '';
      spinner.succeed(`Found ${discussions.length} discussions${filterSuffix}`);

      if (discussions.length === 0) {
        console.log(chalk.yellow('No discussions found in this repository.'));
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
      spinner.fail();
      await EnhancedErrorHandler.handleError(error, context);
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