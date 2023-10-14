import type {
  AssetFilePath,
  BuildManifest,
  BuildManifestChunk,
  SablesBuildMeta,
  SSRManifest,
  TaggedSSRManifest,
} from "@sables/server";
import {
  IMPORT_TAGS_FILENAME,
  ImportTagInfo,
  ImportTagsManifest,
} from "@sables/vite-plugin-import-tags";

import path from "node:path";

import { ModuleImporter } from "@humanwhocodes/module-importer";
import fs from "fs-jetpack";
import prependFile from "prepend-file";
import { Deferred } from "ts-deferred";
import { build } from "vite";

import { createLogger } from "./createLogger.js";
import { exec } from "./exec.js";
import type {
  SablesBuildOptions,
  ServerBundleOptions,
  ServerTarget,
} from "./types.js";
import { serverTargets } from "./utils.js";

const importer = new ModuleImporter();

interface ServerBundleContext {
  destImportTagsManifestPath: string;
  destServerDir: string;
  destSSRManifestPath: string;
  serverEntryPath: string;
  serverMinify: boolean;
  target: ServerTarget;
  tempServerBundleDir: string;
  tempTranspileDir: string;
}

interface BuildContext {
  clientBundleDir: string | undefined;
  clientMinify: boolean;
  clientSkipBundle: boolean;
  destClientManifestPath: string | undefined;
  destClientTemplatePath: string | undefined;
  serverBundles: ServerBundleContext[];
}

const CLIENT_MANIFEST_FILENAME = "manifest.json";
const SSR_MANIFEST_FILENAME = "ssr-manifest.json";

const SABLES_BUILD_META_DEFAULTS: SablesBuildMeta = {
  assetManifest: [],
  taggedSSRManifest: {},
  template: `<html><head></head><body><div id="root><!-- SABLES-SSR-OUTLET --></div></body></html>`,
};

const ASSET_BLOCK_LIST = [
  "/client-manifest.json",
  "/index.html",
  "/manifest.json",
  "/ssr-manifest.json",
];

export async function buildArtifacts({ verbose }: { verbose?: boolean }) {
  const logger = createLogger(verbose);

  async function getOptions(): Promise<SablesBuildOptions> {
    const configPath = path.resolve(process.cwd(), "sables.config.js");

    if (!fs.exists(configPath)) {
      logger.error(`No configuration file was found in the current directory.`);
      process.exit(1);
    }

    const configModule = await importer.import(configPath);

    return (configModule as any).default || configModule;
  }

  async function getTempDir(basePath: string) {
    logger.verbose("getTempDir");
    return (await fs.tmpDirAsync({ prefix: "sables_", basePath })).cwd();
  }

  async function serverBundleOptionsToServerBundleContext(
    options: ServerBundleOptions
  ): Promise<ServerBundleContext> {
    logger.verbose("serverBundleOptionsToServerBundleContext");
    const cwd = process.cwd();
    const destServerDir = path.resolve(cwd, options.output);
    const serverBundleParentDir = path.dirname(destServerDir);
    const tempTranspileDir = await getTempDir(serverBundleParentDir);
    const tempServerBundleDir = await getTempDir(serverBundleParentDir);
    const serverEntryPath = path.resolve(cwd, options.entry);
    const serverMinify = options.minify !== false;
    const target = options.target || serverTargets.NODE;
    const destImportTagsManifestPath = path.resolve(
      destServerDir,
      IMPORT_TAGS_FILENAME
    );
    const destSSRManifestPath = path.resolve(
      destServerDir,
      SSR_MANIFEST_FILENAME
    );

    return {
      destImportTagsManifestPath,
      destServerDir,
      destSSRManifestPath,
      serverEntryPath,
      serverMinify,
      target,
      tempServerBundleDir,
      tempTranspileDir,
    };
  }

  async function createBuildServerContext(
    options: SablesBuildOptions
  ): Promise<BuildContext> {
    logger.verbose("createBuildServerContext");
    const cwd = process.cwd();
    const clientSkipBundle = !!options.client?.skipBundle;
    const clientMinify = options.client?.minify !== false;
    const clientBundleDir = options.client?.output
      ? path.resolve(cwd, options.client.output)
      : undefined;
    const destClientManifestPath = clientBundleDir
      ? path.resolve(clientBundleDir, CLIENT_MANIFEST_FILENAME)
      : undefined;
    const destClientTemplatePath = clientBundleDir
      ? path.resolve(clientBundleDir, "index.html")
      : undefined;
    const serverBundleOptionsList = Array.isArray(options.server)
      ? options.server
      : [options.server];
    const serverBundles = await Promise.all(
      serverBundleOptionsList
        .filter((options): options is ServerBundleOptions => !!options)
        .map(serverBundleOptionsToServerBundleContext)
    );

    return {
      clientBundleDir,
      clientMinify,
      clientSkipBundle,
      destClientManifestPath,
      destClientTemplatePath,
      serverBundles,
    };
  }

  async function bundleClient(context: BuildContext) {
    logger.verbose("bundleClient");
    if (!context.clientBundleDir || context.clientSkipBundle) {
      return;
    }

    await build({
      clearScreen: false,
      build: {
        emptyOutDir: false,
        manifest: true,
        minify: context.clientMinify,
        modulePreload: {
          polyfill: true,
        },
        outDir: path.resolve(process.cwd(), context.clientBundleDir),
      },
    });
  }

  async function bundleServer(context: ServerBundleContext) {
    logger.verbose("bundleServer");
    await build({
      clearScreen: false,
      build: {
        emptyOutDir: false,
        manifest: true,
        minify: context.serverMinify,
        modulePreload: {
          polyfill: true,
        },
        ssr: context.serverEntryPath,
        ssrManifest: true,
        outDir: context.tempServerBundleDir,
      },
      ssr: {
        target: context.target === serverTargets.WORKER ? "webworker" : "node",
      },
    });
  }

  async function bundleAllServers(context: BuildContext) {
    logger.verbose("bundleAllServers");
    await Promise.all(
      context.serverBundles.map((serverContext) => bundleServer(serverContext))
    );
  }

  function getTempTranspileSubDir(serverContext: ServerBundleContext) {
    return path.resolve(
      serverContext.tempTranspileDir,
      path.basename(serverContext.tempServerBundleDir)
    );
  }

  async function getBuildManifestFiles(
    buildManifestFilePath: string
  ): Promise<AssetFilePath[]> {
    const buildManifest = (await fs.readAsync(
      buildManifestFilePath,
      "json"
    )) as Promise<BuildManifest>;

    return Object.values(buildManifest)
      .map((chunk) => chunk?.file)
      .filter((bundleFilePath): bundleFilePath is string => !!bundleFilePath);
  }

  async function getFilesToTranspile(
    context: BuildContext,
    serverContext: ServerBundleContext
  ): Promise<AssetFilePath[]> {
    return getBuildManifestFiles(
      path.resolve(serverContext.tempServerBundleDir, "manifest.json")
    );
  }

  async function transpileServerBundle(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    logger.verbose("transpileServerBundle");

    await fs.copyAsync(
      serverContext.tempServerBundleDir,
      getTempTranspileSubDir(serverContext)
    );

    const bundleFilePaths = await getFilesToTranspile(context, serverContext);
    const tempTranspileSubDir = getTempTranspileSubDir(serverContext);
    const transpileSrcFilePaths = bundleFilePaths.map((bundleFilePath) => {
      return path.resolve(serverContext.tempServerBundleDir, bundleFilePath);
    });
    const command = [
      "npx",
      "esbuild",
      ...(serverContext.serverMinify ? ["--minify"] : []),
      "--format=esm",
      "--platform=node",
      "--target=node18",
      `--inject:${require.resolve("../lib/shim.js")}`,
      `--outdir=${tempTranspileSubDir}`,
      transpileSrcFilePaths.join(" "),
    ].join(" ");

    await exec(command);
  }

  async function prepareDestServerDir(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    logger.verbose("prepareDestServerDir");
    await fs.removeAsync(serverContext.destServerDir);
    await fs.moveAsync(
      getTempTranspileSubDir(serverContext),
      serverContext.destServerDir
    );

    if (!context.destClientManifestPath) return;

    await waitForFileToExist(context.destClientManifestPath);
    await fs.copyAsync(
      path.dirname(context.destClientManifestPath),
      path.resolve(serverContext.destServerDir, "client")
    );
  }

  async function cleanTempDirs(contexts: ServerBundleContext[]) {
    logger.verbose("cleanTempDirs");
    const tempDirs = contexts.reduce<string[]>(
      (result, ctx) => [
        ...result,
        ctx.tempServerBundleDir,
        ctx.tempTranspileDir,
      ],
      []
    );

    await Promise.all(tempDirs.map(fs.removeAsync));
  }

  async function waitForFileToExist(
    filePath: string,
    interval = 100,
    timeout = 5000
  ) {
    const deferred = new Deferred();

    const intervalId = setInterval(async () => {
      if (await fs.existsAsync(filePath)) {
        done();
        deferred.resolve();
      }
    }, interval);

    const timeoutId = setTimeout(() => {
      done();
      deferred.reject(new Error("Timeout reached for file existence."));
    }, timeout);

    function done() {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    }

    return deferred.promise;
  }

  async function createAssetManifest(dir: string) {
    /** File paths are relative to CWD. */
    const assetPaths = await fs.findAsync(dir, {
      files: true,
      directories: false,
      recursive: true,
    });
    const cwd = process.cwd();

    // Convert to absolute URL paths; e.g. `/favicon.ico`
    return assetPaths
      .map((file) => path.resolve(cwd, file).split(dir).pop())
      .filter((assetPath): assetPath is string => typeof assetPath == "string");
  }

  async function readManifests(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    if (!context.destClientManifestPath) {
      return {
        clientManifest: {},
        ssrManifest: {},
        importTagsManifest: {},
      };
    }

    const [clientManifest, ssrManifest, importTagsManifest] =
      (await Promise.all([
        fs.readAsync(context.destClientManifestPath, "json"),
        fs.readAsync(serverContext.destSSRManifestPath, "json"),
        fs.readAsync(serverContext.destImportTagsManifestPath, "json"),
      ])) as [
        BuildManifest | undefined,
        SSRManifest | undefined,
        ImportTagsManifest | undefined
      ];

    if (!clientManifest) {
      logger.error(`clientManifest is missing.`);
      process.exit(1);
    }

    if (!ssrManifest) {
      logger.error(`ssrManifest is missing.`);
      process.exit(1);
    }

    if (!importTagsManifest) {
      logger.error(`importTagsManifest is missing.`);
      process.exit(1);
    }

    return {
      clientManifest,
      ssrManifest,
      importTagsManifest,
    };
  }

  function clientChunkToAssetPaths(
    clientManifest: BuildManifest,
    chunk?: BuildManifestChunk
  ): string[] {
    if (!chunk) return [];

    const cssAssetPaths = chunk.css || [];
    const importAssetPaths = (chunk.imports || [])
      .filter((srcFile) => !srcFile.endsWith(".html"))
      .reduce<string[]>(
        (assetPaths, srcFile) => [
          ...assetPaths,
          ...clientChunkToAssetPaths(clientManifest, clientManifest[srcFile]),
        ],
        []
      );

    return [chunk.file, ...cssAssetPaths, ...importAssetPaths];
  }

  function srcFileToClientAssetPaths(
    clientManifest: BuildManifest,
    srcFile: string
  ) {
    return [
      ...new Set(
        clientChunkToAssetPaths(clientManifest, clientManifest[srcFile])
      ),
    ];
  }

  function srcFilePrefixSrcFile(
    clientManifest: BuildManifest,
    { src, importPath }: ImportTagInfo
  ) {
    /**
     * This path may not have a file extension depending on the type of file imported.
     * For example, a SVG or MDX file will likely have its file extension,
     * but a JavaScript or TypeScript module may not.
     * Additionally, while Deno and Node-ESM require file extensions in import paths,
     * TypeScript doesn't allow the `.ts` extension to be used in import paths.
     * As a result, we're removing the file extension to avoid pitfalls.
     */
    let srcFilePrefix: string;

    const pathBase = path.dirname(src);

    // The path is relative
    if (importPath.startsWith(".")) {
      // Change the relative directory to match the
      // client manifest, and remove the extension
      const { dir, name } = path.parse(path.join(pathBase, importPath));
      srcFilePrefix = path.join(dir, name);
    } else {
      try {
        // Resolve the absolute path, and change the
        // relative directory to match the client manifest
        srcFilePrefix = path.relative(pathBase, require.resolve(importPath));
      } catch (_error) {
        // Fallback to using the import path. Hail mary time.
        srcFilePrefix = importPath;
      }
    }

    return Object.keys(clientManifest).find((srcFile) =>
      srcFile.startsWith(srcFilePrefix)
    );
  }

  function createTaggedSSRManifest({
    clientManifest,
    importTagsManifest,
  }: {
    clientManifest: BuildManifest;
    importTagsManifest: ImportTagsManifest;
  }): TaggedSSRManifest {
    return Object.fromEntries(
      Object.entries(importTagsManifest).map(
        (importTagsEntry): Readonly<[string, string[]]> => {
          const [hash, importTagInfo] = importTagsEntry;
          const srcFileToImport = srcFilePrefixSrcFile(
            clientManifest,
            importTagInfo
          );

          if (!srcFileToImport) {
            logger.warn(`No source file matching tag: ${hash}.`);
            return [hash, []];
          }

          return [
            hash,
            srcFileToClientAssetPaths(clientManifest, srcFileToImport),
          ];
        }
      )
    );
  }

  async function buildSablesBuildMeta(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    logger.verbose("buildSablesBuildMeta");

    const sablesBuildMeta: SablesBuildMeta = { ...SABLES_BUILD_META_DEFAULTS };

    if (context.clientBundleDir && context.destClientTemplatePath) {
      await waitForFileToExist(context.clientBundleDir);
      await waitForFileToExist(context.destClientTemplatePath);

      sablesBuildMeta.assetManifest = await createAssetManifest(
        context.clientBundleDir
      );
    }

    if (context.destClientManifestPath) {
      await waitForFileToExist(context.destClientManifestPath);

      const manifests = await readManifests(context, serverContext);

      sablesBuildMeta.taggedSSRManifest = createTaggedSSRManifest(manifests);
    }

    if (context.destClientTemplatePath) {
      const template = await fs.readAsync(context.destClientTemplatePath);

      if (template) {
        sablesBuildMeta.template = template;
      }
    }

    return sablesBuildMeta;
  }

  function getDestServerEntryPath(serverContext: ServerBundleContext) {
    const serverEntryName = path.parse(serverContext.serverEntryPath).name;
    const validServerEntryExtensions = [".js", ".cjs", ".mjs"];
    const createServerEntryPath = (ext: string) =>
      path.format({
        dir: serverContext.destServerDir,
        ext,
        name: serverEntryName,
        root: "/",
      });

    return validServerEntryExtensions
      .map(createServerEntryPath)
      .find(fs.exists);
  }

  async function prependMetaData(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    logger.verbose("appendMetaData");
    const sablesBuildMeta = await buildSablesBuildMeta(context, serverContext);
    const sablesBuildMetaJSON = JSON.stringify(sablesBuildMeta);
    const getSablesBuildMetaJS = [
      `"use strict";`,
      `const __sablesBuildMeta = Object.freeze(${sablesBuildMetaJSON});`,
      `function getSablesBuildMeta() { return __sablesBuildMeta; }`,
      `if (typeof global == "object" && !global.getSablesBuildMeta) { global.getSablesBuildMeta = getSablesBuildMeta; }`,
      `if (typeof globalThis == "object" && !globalThis.getSablesBuildMeta) { globalThis.getSablesBuildMeta = getSablesBuildMeta; }`,
    ].join("\n");
    const destServerEntryPath = getDestServerEntryPath(serverContext);

    if (!destServerEntryPath) {
      throw new Error("Couldn't find server entry script.");
    }

    return prependFile(destServerEntryPath, getSablesBuildMetaJS);
  }

  function logBundleServerScript(serverContext: ServerBundleContext) {
    const scriptTypeByTarget: Record<ServerTarget, string> = {
      [serverTargets.WORKER]: "Worker",
      [serverTargets.NODE]: "Node.js server",
    };
    const scriptType = scriptTypeByTarget[serverContext.target];
    const dest = path.relative(process.cwd(), serverContext.destServerDir);

    logger.info(`Bundling ${scriptType} script into "${dest}".`);
  }

  async function bundleServerScript(
    context: BuildContext,
    serverContext: ServerBundleContext
  ) {
    logBundleServerScript(serverContext);
    logger.verbose("bundleServerScript");
    await transpileServerBundle(context, serverContext);
    await prepareDestServerDir(context, serverContext);
    await prependMetaData(context, serverContext);
  }

  async function bundleAllServerScripts(context: BuildContext) {
    logger.verbose("bundleAllServerScripts");
    await Promise.all(
      context.serverBundles.map((serverBundle) =>
        bundleServerScript(context, serverBundle)
      )
    );
  }

  async function main() {
    const context = await createBuildServerContext(await getOptions());

    try {
      await Promise.all([bundleClient(context), bundleAllServers(context)]);
      await bundleAllServerScripts(context);
    } catch (error) {
      logger.error(error);
    } finally {
      await cleanTempDirs(context.serverBundles);
    }

    logger.success(`Build complete.`);
  }

  main().catch(logger.error);
}
