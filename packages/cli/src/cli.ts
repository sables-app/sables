import yargs from "yargs";

import { buildArtifacts } from "./buildArtifacts.js";
import { createBoilerplate } from "./createBoilerplate.js";

function verboseOption(yargs: yargs.Argv) {
  return yargs.option("verbose", {
    type: "boolean",
    default: false,
    describe: "Enable verbose logging.",
  });
}

export function runCli() {
  return yargs
    .scriptName("sables")
    .usage("$0 <cmd> [args]")
    .command(
      "build",
      `Build a Sables project using the "sables.config.js" file located in the current directory.`,
      verboseOption,
      buildArtifacts
    )
    .command(
      "create",
      "Generate a new app from a boilerplate.",
      verboseOption,
      createBoilerplate
    )
    .demandCommand()
    .help().argv;
}
