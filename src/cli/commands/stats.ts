import { Command } from 'commander';
import chalk from 'chalk';
import { GitHubClient, FileAuthManager, FileConfigManager } from '../../core/index.js';
import { EnhancedErrorHandler } from '../utils/enhanced-error-handler.js';
import { Spinner } from '../utils/spinner.js';
import { ProgressBar } from '../utils/progress.js';

export const statsCommand = new Command('stats')
  .description('Show repository discussion statistics')
  .argument('[repo]', 'Repository in owner/name format')
  .option('--detailed', 'Show detailed statistics')
  .action(async (repo: string | undefined, options) => {
    const spinner = new Spinner();
    const context = { operation: 'analyze statistics', repository: repo };

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
      spinner.start(`Analyzing discussions in ${targetRepo}...`);

      const client = new GitHubClient(token);
      
      // Get all discussions for analysis
      const discussions = await EnhancedErrorHandler.retryWithBackoff(
        () => client.listDiscussions(targetRepo, {
          first: 100,
          orderBy: { field: 'UPDATED_AT', direction: 'DESC' },
        }),
        context
      );

      spinner.succeed('Analysis complete');

      if (discussions.length === 0) {
        console.log(chalk.yellow('No discussions found to analyze.'));
        return;
      }

      // Calculate statistics
      const stats = calculateStats(discussions);
      
      // Display results
      displayStats(targetRepo, stats, options.detailed);

      if (options.detailed) {
        await displayDetailedStats(client, targetRepo, discussions);
      }

    } catch (error) {
      spinner.fail();
      await EnhancedErrorHandler.handleError(error, context);
    }
  });

interface DiscussionStats {
  total: number;
  totalComments: number;
  averageComments: number;
  categories: Record<string, number>;
  authors: Record<string, number>;
  topDiscussions: any[];
  mostActive: any[];
  recent: any[];
}

function calculateStats(discussions: any[]): DiscussionStats {
  const stats: DiscussionStats = {
    total: discussions.length,
    totalComments: 0,
    averageComments: 0,
    categories: {},
    authors: {},
    topDiscussions: [],
    mostActive: [],
    recent: [],
  };

  // Calculate totals and categorize
  discussions.forEach(discussion => {
    stats.totalComments += discussion.commentCount;
    
    // Category stats
    const category = discussion.category?.name || 'Uncategorized';
    stats.categories[category] = (stats.categories[category] || 0) + 1;
    
    // Author stats
    const author = discussion.author.login;
    stats.authors[author] = (stats.authors[author] || 0) + 1;
  });

  stats.averageComments = stats.total > 0 ? stats.totalComments / stats.total : 0;

  // Top discussions by comments
  stats.topDiscussions = discussions
    .filter(d => d.commentCount > 0)
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 5);

  // Most active authors
  stats.mostActive = Object.entries(stats.authors)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }));

  // Recent discussions
  stats.recent = discussions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return stats;
}

function displayStats(repo: string, stats: DiscussionStats, detailed: boolean): void {
  console.log();
  console.log(chalk.blue.bold(`📊 Discussion Statistics for ${repo}`));
  console.log(chalk.blue('='.repeat(60)));
  console.log();

  // Basic stats
  console.log(chalk.white.bold('📈 Overview'));
  console.log(`  Total Discussions: ${chalk.green(stats.total)}`);
  console.log(`  Total Comments: ${chalk.green(stats.totalComments)}`);
  console.log(`  Average Comments per Discussion: ${chalk.green(stats.averageComments.toFixed(1))}`);
  console.log();

  // Category breakdown
  if (Object.keys(stats.categories).length > 0) {
    console.log(chalk.white.bold('📁 Categories'));
    Object.entries(stats.categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .forEach(([category, count]) => {
        const percentage = ((count as number) / stats.total * 100).toFixed(1);
        const bar = '█'.repeat(Math.max(1, Math.floor((count as number) / stats.total * 20)));
        console.log(`  ${category}: ${chalk.green(count)} (${percentage}%) ${chalk.gray(bar)}`);
      });
    console.log();
  }

  // Top contributors
  if (stats.mostActive.length > 0) {
    console.log(chalk.white.bold('👥 Most Active Contributors'));
    stats.mostActive.forEach(({ author, count }, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`  ${medal} ${author}: ${chalk.green(count)} discussions`);
    });
    console.log();
  }

  // Top discussions
  if (stats.topDiscussions.length > 0) {
    console.log(chalk.white.bold('🔥 Most Commented Discussions'));
    stats.topDiscussions.forEach((discussion, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const title = discussion.title.length > 40 
        ? discussion.title.substring(0, 37) + '...' 
        : discussion.title;
      console.log(`  ${medal} ${title}`);
      console.log(`     ${chalk.green(discussion.commentCount)} comments by ${chalk.gray(discussion.author.login)}`);
    });
    console.log();
  }
}

async function displayDetailedStats(client: GitHubClient, repo: string, discussions: any[]): Promise<void> {
  console.log(chalk.white.bold('📋 Recent Activity'));
  
  const progress = new ProgressBar();
  progress.start(Math.min(5, discussions.length));

  for (let i = 0; i < Math.min(5, discussions.length); i++) {
    const discussion = discussions[i];
    try {
      // Get detailed info for recent discussions
      const details = await client.getDiscussion(repo, discussion.id.split('/').pop() || '1');
      
      const title = details.title.length > 50 
        ? details.title.substring(0, 47) + '...' 
        : details.title;
      
      console.log(`  • ${title}`);
      console.log(`    ${chalk.gray('Author:')} ${details.author.login} ${chalk.gray('Comments:')} ${details.commentCount}`);
      console.log(`    ${chalk.gray('Updated:')} ${new Date(details.updatedAt).toLocaleDateString()}`);
      
      if (details.comments.length > 0) {
        const lastComment = details.comments[details.comments.length - 1];
        console.log(`    ${chalk.gray('Last comment by:')} ${lastComment.author.login}`);
      }
      console.log();
      
      progress.increment();
    } catch (error) {
      progress.increment();
      // Skip failed requests
    }
  }
  
  progress.stop();
}