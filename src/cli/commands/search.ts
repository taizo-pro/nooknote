import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { EnhancedErrorHandler } from '../utils/enhanced-error-handler.js';
import { formatDate } from '../utils/formatters.js';
import { Spinner } from '../utils/spinner.js';

export const searchCommand = new Command('search')
  .description('Search for discussions')
  .argument('<query>', 'Search query')
  .argument('[repo]', 'Repository in owner/name format')
  .option('--in <fields>', 'Search in specific fields (title,body,comments)', 'title,body')
  .option('--author <username>', 'Filter by author')
  .option('--category <category>', 'Filter by category')
  .option('--state <state>', 'Filter by state (open,closed)', 'open')
  .option('--sort <field>', 'Sort by field (created,updated,comments)', 'updated')
  .option('--order <direction>', 'Sort order (asc,desc)', 'desc')
  .option('--limit <number>', 'Maximum results to return', '20')
  .option('--format <format>', 'Output format (table, json, markdown)', 'table')
  .action(async (query: string, repo: string | undefined, options) => {
    const spinner = new Spinner();
    const context = { 
      operation: 'search discussions', 
      repository: repo,
      query: query 
    };

    try {
      const authManager = new FileAuthManager();
      const configManager = new FileConfigManager();
      
      spinner.start('Checking authentication...');
      const token = await authManager.getToken();
      if (!token) {
        spinner.fail('No GitHub token found');
        console.error(chalk.red('Run "gh-discussions config" to set up authentication.'));
        process.exit(1);
      }
      spinner.succeed('Authentication verified');

      const targetRepo = repo || (await configManager.getDefaultRepo());
      if (!targetRepo) {
        console.error(chalk.red('No repository specified. Provide a repo argument or set a default repo.'));
        process.exit(1);
      }

      context.repository = targetRepo;
      spinner.start(`Searching discussions in ${targetRepo}...`);

      const client = new GitHubClient(token);
      
      // Get all discussions first (GitHub API doesn't have built-in search for discussions)
      const allDiscussions = await EnhancedErrorHandler.retryWithBackoff(
        () => client.listDiscussions(targetRepo, {
          first: 100, // Get more to search through
          orderBy: { field: 'UPDATED_AT', direction: 'DESC' },
        }),
        context
      );

      spinner.update('Filtering search results...');

      // Apply search filters
      let filteredDiscussions = allDiscussions.filter(discussion => {
        // Text search
        const searchFields = options.in.split(',');
        const searchInTitle = searchFields.includes('title') && 
          discussion.title.toLowerCase().includes(query.toLowerCase());
        const searchInBody = searchFields.includes('body') && 
          discussion.body?.toLowerCase().includes(query.toLowerCase());
        
        const matchesQuery = searchInTitle || searchInBody;
        
        // Author filter
        const matchesAuthor = !options.author || 
          discussion.author.login.toLowerCase() === options.author.toLowerCase();
        
        // Category filter
        const matchesCategory = !options.category || 
          discussion.category?.name.toLowerCase() === options.category.toLowerCase();
        
        return matchesQuery && matchesAuthor && matchesCategory;
      });

      // Sort results
      filteredDiscussions = sortDiscussions(filteredDiscussions, options.sort, options.order);
      
      // Limit results
      const limit = parseInt(options.limit, 10);
      if (filteredDiscussions.length > limit) {
        filteredDiscussions = filteredDiscussions.slice(0, limit);
      }

      spinner.succeed(`Found ${filteredDiscussions.length} matching discussions`);

      if (filteredDiscussions.length === 0) {
        console.log(chalk.yellow(`No discussions found matching "${query}"`));
        console.log(chalk.gray('Try:'));
        console.log(chalk.gray('  • Different search terms'));
        console.log(chalk.gray('  • Removing filters (--author, --category)'));
        console.log(chalk.gray('  • Searching in different fields (--in title,body,comments)'));
        return;
      }

      const outputFormat = options.format || (await configManager.getConfig()).outputFormat || 'table';

      // Display search info
      console.log();
      console.log(chalk.blue(`🔍 Search Results for "${query}"`));
      console.log(chalk.gray(`Repository: ${targetRepo}`));
      if (options.author) console.log(chalk.gray(`Author: ${options.author}`));
      if (options.category) console.log(chalk.gray(`Category: ${options.category}`));
      console.log(chalk.gray(`Found: ${filteredDiscussions.length} discussions`));
      console.log();

      switch (outputFormat) {
        case 'json':
          console.log(JSON.stringify(filteredDiscussions, null, 2));
          break;
        case 'markdown':
          printMarkdownTable(filteredDiscussions, query);
          break;
        default:
          printSearchTable(filteredDiscussions, query);
      }

    } catch (error) {
      spinner.fail();
      await EnhancedErrorHandler.handleError(error, context);
    }
  });

function sortDiscussions(discussions: any[], sortField: string, order: string): any[] {
  return discussions.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'comments':
        comparison = a.commentCount - b.commentCount;
        break;
      default:
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
}

function highlightMatch(text: string, query: string): string {
  if (!text) return '';
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, chalk.yellow.bold('$1'));
}

function printSearchTable(discussions: any[], query: string): void {
  const data = [
    ['Title', 'Author', 'Comments', 'Updated', 'Category']
  ];

  discussions.forEach((discussion) => {
    const title = discussion.title.length > 50 
      ? discussion.title.substring(0, 47) + '...'
      : discussion.title;
    
    data.push([
      highlightMatch(title, query),
      discussion.author.login,
      discussion.commentCount.toString(),
      formatDate(discussion.updatedAt),
      discussion.category?.name || 'N/A',
    ]);
  });

  const output = table(data, {
    header: {
      alignment: 'center',
      content: chalk.bold('Search Results'),
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

function printMarkdownTable(discussions: any[], query: string): void {
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