import * as console from "node:console";
import * as path from "node:path";
import * as url from "node:url";

import { getPackages } from "@manypkg/get-packages";
import fs from "fs-jetpack";

const __dirname = url.fileURLToPath(new url.URL(".", import.meta.url));

/**
 * @typedef Boilerplate
 * @property {string} description
 * @property {string} id
 * @property {Record<string, any>} packageJson
 * @property {string} srcDir
 */

/**
 * @param {string} distDir
 * @param {Boilerplate} boilerplate
 */
async function generateBoilerplateFromExample(distDir, boilerplate) {
  const { id, srcDir } = boilerplate;
  const destDir = path.resolve(distDir, id);

  await fs.copyAsync(srcDir, destDir);

  await Promise.all([
    fs.moveAsync(
      path.resolve(destDir, "package.json"),
      path.resolve(destDir, "package-template.json"),
    ),
    fs.moveAsync(
      path.resolve(destDir, "tsconfig.json"),
      path.resolve(destDir, "tsconfig-template.json"),
    ),
  ]);
}

async function getBoilerplates() {
  const workspaces = await getPackages();
  /**
   * @type {import("@changesets/types").PackageJSON}
   */
  const pkgJSON = JSON.parse(
    await fs.readAsync(path.resolve(__dirname, "../package.json")),
  );
  const boilerplatePackageNames = Object.keys(
    pkgJSON.devDependencies || {},
  ).filter((packageName) => packageName.startsWith("@sables-app/boilerplate-"));
  const boilerplatePackages = workspaces.packages.filter(({ packageJson }) =>
    boilerplatePackageNames.includes(packageJson.name),
  );

  /**
   * @type {Boilerplate[]}
   */
  return boilerplatePackages.map(({ packageJson, dir }) => ({
    description: packageJson.description,
    id: packageJson.name.replace("@sables-app/boilerplate-", ""),
    packageJson,
    srcDir: dir,
  }));
}

async function main() {
  const boilerplates = await getBoilerplates();
  const boilerplatesManifest = boilerplates.map(({ id, description }) => ({
    id,
    description,
  }));

  const distDir = path.resolve(__dirname, "../dist");

  // Clean before writing
  await fs.removeAsync(distDir);

  // Write manifest
  await fs.writeAsync(
    path.resolve(distDir, "boilerplates.json"),
    boilerplatesManifest,
  );

  // Generate all of the boilerplates
  await Promise.all(
    boilerplates.map((boilerplate) =>
      generateBoilerplateFromExample(distDir, boilerplate),
    ),
  );

  console.info(`Done. Generated ${boilerplates.length} boilerplates.`);
}

await main();
