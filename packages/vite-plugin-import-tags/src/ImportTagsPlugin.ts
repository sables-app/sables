import { createFilter, FilterPattern } from "@rollup/pluginutils";
import crypto from "crypto";
import fs from "fs-jetpack";
import MagicString from "magic-string";
import path from "path";
import type { RenderChunkHook, TransformHook } from "rollup";
import type { ConfigEnv, UserConfig } from "vite";

import type { ImportTagInfo, ImportTagsManifest } from "./types.js";
import { IMPORT_TAGS_FILENAME } from "./utils.js";

interface PluginConfig {
  exclude?: FilterPattern;
  include?: FilterPattern;
  manifest: boolean;
  sourceMap: boolean;
}

const DEFAULT_OPTIONS: PluginConfig = {
  manifest: true,
  sourceMap: true,
};

const IMPORT_PATTERN =
  /(import\(("|')([a-zA-Z0-9-_@./]+)("|')\))((\.then|\.catch|\.finally))*(?!(\[|\.))/g;

function logInfo(message: string) {
  console.info(`[ImportTagsPlugin]: ${message}`);
}

export function createImportTagsPlugin(options?: Partial<PluginConfig>) {
  const config: PluginConfig = { ...DEFAULT_OPTIONS, ...options };
  const filter = createFilter(config.include, config.exclude);
  const manifest: ImportTagsManifest = {};

  const cwd = process.cwd();
  let buildDir = cwd;
  let pluginEnabled = true;
  let ssrEntryDir = path.dirname(cwd);

  function idToSrc(id: string) {
    if (path.isAbsolute(id) && fs.exists(id)) {
      return path.relative(ssrEntryDir, id);
    }
    return id;
  }

  function codeHasReplacements(
    code: string,
    id: string,
    magicString: MagicString
  ) {
    let result = false;
    let matches: RegExpExecArray | null;

    while ((matches = IMPORT_PATTERN.exec(code))) {
      result = true;

      const start = matches.index;
      const [, importMatch, , importPath] = matches;
      const end = start + importMatch.length;
      const src = idToSrc(id);
      const entry: ImportTagInfo = { src, importPath };
      const hash = crypto
        .createHash("md5")
        .update(JSON.stringify(entry))
        .digest("hex");
      const replacement = `($rollupImportTag("${hash}"),import("${importPath}"))`;
      magicString.overwrite(start, end, replacement);
      manifest[hash] = entry;
    }

    return result;
  }

  function executeReplacement(
    code: string,
    id: string
  ): ReturnType<RenderChunkHook> {
    const magicString = new MagicString(code);

    if (!codeHasReplacements(code, id, magicString)) {
      return null;
    }

    return {
      code: magicString.toString(),
      map: config.sourceMap
        ? magicString.generateMap({ hires: true })
        : undefined,
    };
  }

  function transform(
    ...params: Parameters<TransformHook>
  ): ReturnType<TransformHook> {
    if (!pluginEnabled) return;

    const [code, id] = params;

    if (!filter(id)) return null;

    return executeReplacement(code, id);
  }

  function configHook(config: UserConfig, env: ConfigEnv): void {
    if (config.build?.outDir) {
      buildDir = config.build.outDir;
    }
    if (typeof config.build?.ssr == "string") {
      ssrEntryDir = path.dirname(config.build.ssr);
    }

    pluginEnabled = env.command === "build" && !!env.ssrBuild;
  }

  function buildEnd(error?: Error): void {
    if (!pluginEnabled) return;

    logInfo(`${Object.keys(manifest).length} imports were tagged.`);

    if (!error && buildDir && config.manifest) {
      logInfo("Writing manifest to output directory.");

      const manifestFilePath = path.resolve(buildDir, IMPORT_TAGS_FILENAME);

      fs.write(manifestFilePath, manifest);
    }
  }

  return {
    buildEnd,
    config: configHook,
    name: "importTags",
    transform,
  };
}
