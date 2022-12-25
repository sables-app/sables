import chalk from "chalk";

export function createLogger(verboseEnabled?: boolean) {
  function verbose(message: unknown) {
    if (verboseEnabled) {
      console.log(chalk.dim(`🕪 ${message}`));
    }
  }

  function info(message: unknown) {
    console.info(chalk.blue(`ℹ ${message}`));
  }

  function warn(message: unknown) {
    if (verboseEnabled) {
      console.warn(chalk.yellow(`⚠ ${message}`));
    }
  }

  function success(message: unknown) {
    console.info(chalk.green(`✔ ${message}`));
  }

  function error(message: unknown) {
    if (typeof message == "string") {
      console.error(chalk.red(`✗ ${message}`));
    } else {
      console.error(chalk.red(`✗ Error:`), message);
    }
  }

  return {
    error,
    info,
    success,
    verbose,
    verboseEnabled,
    warn,
  };
}
