import boilerplates from "@sables/boilerplate";

import path from "node:path";

import fs from "fs-jetpack";
import prompts from "prompts";

import { createLogger } from "./createLogger.js";

// TODO - Reuse from `@sables/utils`
function capitalize<T extends string>(name: T) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}` as Capitalize<T>;
}

export async function createBoilerplate({ verbose }: { verbose?: boolean }) {
  const logger = createLogger(verbose);

  interface Options {
    boilerplateIndex: number;
    destPath: string;
    packageName: string;
    packageVersion: string;
  }

  async function getOptions(): Promise<Options> {
    return prompts([
      {
        type: "text",
        name: "destPath",
        message: "Where should the app be generated?",
        initial: "my-app",
      },
      {
        type: "text",
        name: "packageName",
        message: "What is the package name?",
        initial: "my-app",
      },
      {
        type: "text",
        name: "packageVersion",
        message: "What is the package version?",
        initial: "0.1.0",
      },
      {
        type: "select",
        name: "boilerplateIndex",
        message: "Which boilerplate should be used?",
        choices: boilerplates.map(({ id, description }) => ({
          title: id.split("-").map(capitalize).join(" "),
          description,
        })),
      },
    ]);
  }

  async function updatePackageJSON({
    destDir,
    packageName,
    packageVersion,
  }: {
    destDir: string;
    packageName: string;
    packageVersion: string;
  }) {
    const templatePath = path.resolve(destDir, "package-template.json");
    const finalPath = path.resolve(destDir, "package.json");
    const templateContent = await fs.readAsync(templatePath, "json");
    const finalContent = {
      ...templateContent,
      name: packageName,
      version: packageVersion,
    };
    await fs.fileAsync(finalPath, {
      content: finalContent,
      jsonIndent: 2,
    });
    await fs.removeAsync(templatePath);
  }

  async function main() {
    const { boilerplateIndex, destPath, packageName, packageVersion } =
      await getOptions();
    const destDir = path.resolve(process.cwd(), destPath);

    if (fs.exists(destDir)) {
      logger.error("Destination directory already exists!");
      process.exit(1);
    }

    const boilerplate = boilerplates[boilerplateIndex];

    if (!boilerplate) {
      throw new Error("Boilerplate not found.");
    }

    const srcDir = path.dirname(
      require.resolve(
        `@sables/boilerplate/dist/${boilerplate.id}/package-template.json`,
      ),
    );
    await fs.copyAsync(srcDir, destDir);
    await updatePackageJSON({
      destDir,
      packageName,
      packageVersion,
    });
    await fs.moveAsync(
      path.resolve(destDir, "tsconfig-template.json"),
      path.resolve(destDir, "tsconfig.json"),
    );

    logger.success(`Boilerplate creation complete.`);
  }

  main().catch(logger.error);
}
