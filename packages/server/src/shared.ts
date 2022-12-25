import { SSR_ATTRIBUTE, ssrAttrValues } from "@sables/core";
import { ServerRequestState, ServerRequestStateRef } from "@sables/framework";
import { transitionStatuses } from "@sables/ssr";

import jsesc from "jsesc";
import { createElement, ReactElement } from "react";

import { APP_HTML_PLACEHOLDER } from "./constants.js";
import type {
  AppInput,
  ResponseDescriptorPayload,
  SablesBuildMeta,
  TaggedSSRManifest,
} from "./types.js";

declare const getSablesBuildMeta: (() => SablesBuildMeta) | undefined;

export function getBuildMeta(buildMeta?: SablesBuildMeta): SablesBuildMeta {
  if (buildMeta) {
    return buildMeta;
  }
  if (typeof getSablesBuildMeta == "function") {
    return getSablesBuildMeta();
  }
  if (typeof global == "object") {
    return (global as any).getSablesBuildMeta();
  }
  if (typeof globalThis == "object") {
    return (globalThis as any).getSablesBuildMeta();
  }
  throw new Error("Sables context is required.");
}

export function getEnvVarString(
  envVarName: string,
  workerEnv?: Record<string, unknown>
) {
  function fromImportMeta(): string | undefined {
    try {
      return (import.meta as any).env[envVarName];
    } catch (_error) {
      return undefined;
    }
  }

  function fromProcessEnv(): string | undefined {
    try {
      return process.env[envVarName];
    } catch (_error) {
      return undefined;
    }
  }

  function fromWorkerEnv(
    workerEnv: Record<string, unknown> = {}
  ): string | undefined {
    return workerEnv[envVarName] ? String(workerEnv[envVarName]) : undefined;
  }

  return fromImportMeta() || fromProcessEnv() || fromWorkerEnv(workerEnv);
}

export function getAssetProxyURL(workerEnv?: Record<string, unknown>) {
  return getEnvVarString("ASSET_PROXY_URL", workerEnv);
}

const IMPORTER_HASH_PATTERN = /\$rollupImportTag\("([a-fA-F0-9]{32})"\)/;

function importerToAssetPaths(
  taggedSSRManifest: TaggedSSRManifest,
  invokedImporter: string
): string[] {
  const matches = IMPORTER_HASH_PATTERN.exec(invokedImporter);

  if (!matches) return [];

  const [, hash] = matches;
  const assetsPaths = taggedSSRManifest[hash];

  if (!assetsPaths) return [];

  return assetsPaths;
}

function getAssetPathsFromInvokedImporters(
  serverRequestStateRef: ServerRequestStateRef,
  taggedSSRManifest: TaggedSSRManifest
) {
  const { invokedImporters } = serverRequestStateRef.demand();

  let assetPaths: string[] = [];

  for (const invokedImporter of invokedImporters) {
    assetPaths = [
      ...assetPaths,
      ...importerToAssetPaths(taggedSSRManifest, invokedImporter),
    ];
  }

  return [...new Set(assetPaths)];
}

function assetPathToTag(assetPath: string) {
  const extension = assetPath.split(".").pop();

  switch (extension) {
    case "js":
      return `<link rel="modulepreload" as="script" crossorigin href="/${assetPath}">`;
    case "css":
      return `<link rel="stylesheet" crossorigin href="/${assetPath}">`;
    default:
      return `<link rel="preload" crossorigin href="/${assetPath}">`;
  }
}

function createAppStateTag(
  appState: ServerRequestState["appState"],
  shouldHydrate: boolean
) {
  const serializedAppState = jsesc(appState, {
    es6: true,
    isScriptContext: true,
    json: true,
  });
  const attributes = [
    'type="application/json"',
    `${SSR_ATTRIBUTE}="${ssrAttrValues.APP_STATE}"`,
    shouldHydrate ? `${SSR_ATTRIBUTE}="${ssrAttrValues.SHOULD_HYDRATE}"` : "",
  ].join(" ");

  return `<script ${attributes}>${serializedAppState}</script>`;
}

/**
 * These should remain async for some future-proofing.
 * @internal
 */
export async function getAssetTags({
  serverRequestStateRef,
  shouldHydrate,
  taggedSSRManifest,
}: {
  serverRequestStateRef: ServerRequestStateRef;
  shouldHydrate: boolean;
  taggedSSRManifest: TaggedSSRManifest;
}) {
  const tags = getAssetPathsFromInvokedImporters(
    serverRequestStateRef,
    taggedSSRManifest
  ).map(assetPathToTag);

  const { appState } = serverRequestStateRef.demand();
  const appStateTag = createAppStateTag(appState, shouldHydrate);

  tags.push(appStateTag);

  return `\n${tags.join("\n")}\n`;
}

export function parseTemplate(template: string) {
  const [start, secondHalf] = template.split("</head>");
  const [beforeApp, afterApp] = `</head>${secondHalf}`.split(
    APP_HTML_PLACEHOLDER
  );

  return { afterApp, beforeApp, start };
}

/**
 * These should remain async for some future-proofing.
 * @internal
 */
export async function defaultResponseDescriptor({
  beforeStreamError,
  transitionResult,
}: ResponseDescriptorPayload) {
  const headers = { "content-type": "text/html" };

  switch (transitionResult?.status) {
    case transitionStatuses.INCOMPLETE:
      return { status: 206, headers };
    case transitionStatuses.TIMEOUT:
      return { status: 408, headers };
    default:
      break;
  }
  if (transitionResult?.error) {
    console.error(transitionResult.error);
    return { status: 500, headers };
  }
  if (!transitionResult?.route) {
    return { status: 404, headers };
  }
  if (beforeStreamError) {
    return { status: 206, headers };
  }

  return { status: 200, headers };
}

export async function resolveAppInput(
  appInput: AppInput
): Promise<ReactElement> {
  const App =
    typeof appInput === "function" ? (await appInput()).default : appInput;

  return typeof App === "function" ? createElement(App) : App;
}
