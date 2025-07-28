import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class ProgressBar {
  private bar: cliProgress.SingleBar;
  private isActive = false;

  constructor() {
    this.bar = new cliProgress.SingleBar({
      format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} items | {duration_formatted}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: true,
    }, cliProgress.Presets.shades_classic);
  }

  start(total: number, startValue = 0): void {
    if (!this.isActive) {
      this.bar.start(total, startValue);
      this.isActive = true;
    }
  }

  update(value: number): void {
    if (this.isActive) {
      this.bar.update(value);
    }
  }

  increment(delta = 1): void {
    if (this.isActive) {
      this.bar.increment(delta);
    }
  }

  stop(): void {
    if (this.isActive) {
      this.bar.stop();
      this.isActive = false;
    }
  }

  updateTotal(total: number): void {
    if (this.isActive) {
      this.bar.setTotal(total);
    }
  }
}

export function createMultiProgress() {
  return new cliProgress.MultiBar({
    format: chalk.cyan('{bar}') + ' | {percentage}% | {task}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true,
  }, cliProgress.Presets.shades_classic);
}