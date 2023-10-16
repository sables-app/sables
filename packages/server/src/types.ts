import type { ServerRequestState } from "@sables/framework";
import { DynamicImportFn } from "@sables/framework/router";

import type { ComponentType, ReactElement } from "react";

/** @example "assets/screens/Home.abcd1234.js" */
export type AssetFilePath = string;
export type SSRManifest = Partial<Record<SrcFilePath, AssetFilePath[]>>;
/** @example "src/screens/Home.tsx" */
export type SrcFilePath = string;
/** @example "_Component.abcd1234.js" */
export type PhonyFilePath = string;

export type BuildManifestChunk = {
  css?: AssetFilePath[];
  dynamicImports?: SrcFilePath[];
  file: AssetFilePath;
  imports?: Array<SrcFilePath | PhonyFilePath>;
  isDynamicEntry?: boolean;
  isEntry?: boolean;
  src?: SrcFilePath;
};

export type BuildManifest = Partial<Record<SrcFilePath, BuildManifestChunk>>;
export type TaggedSSRManifest = {
  [md5Hash: string]: [...assetPaths: string[]] | undefined;
};

export interface SablesBuildMeta {
  assetManifest: string[];
  taggedSSRManifest: TaggedSSRManifest;
  template: string;
}

export type AppInput =
  | ReactElement
  | DynamicImportFn<{ default: ReactElement | ComponentType }>;

export type ResponseDescriptorPayload = Pick<
  ServerRequestState,
  "appState" | "beforeStreamError" | "href" | "transitionResult"
>;

export type ResponseDescriptor = (
  payload: ResponseDescriptorPayload,
) => Promise<{
  status: number;
  headers: Record<string, string>;
}>;
