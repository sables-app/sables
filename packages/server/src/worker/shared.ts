/// <reference types="@cloudflare/workers-types" />

import { ServerRequestStateRef } from "@sables/framework";

import {
  defaultResponseDescriptor,
  getAssetTags,
  parseTemplate,
} from "../shared.js";
import {
  ResponseDescriptor,
  SablesBuildMeta,
  TaggedSSRManifest,
} from "../types.js";
import { createAssetProxyHandler } from "./AssetProxyHandler.js";
import { InternalServerError } from "./responses.js";
import type { WorkerEnv } from "./types.js";

export async function assembleHTMLResponse({
  appHTML = "",
  describeResponse = defaultResponseDescriptor,
  serverRequestStateRef,
  shouldHydrate,
  taggedSSRManifest,
  template,
}: {
  appHTML?: string;
  describeResponse?: ResponseDescriptor;
  serverRequestStateRef: ServerRequestStateRef;
  shouldHydrate: boolean;
  taggedSSRManifest: TaggedSSRManifest;
  template: string;
}) {
  const templateParts = parseTemplate(template);
  const assetTags = await getAssetTags({
    serverRequestStateRef,
    shouldHydrate,
    taggedSSRManifest,
  });
  const pageHTML = [
    templateParts.start,
    assetTags,
    templateParts.beforeApp,
    appHTML,
    templateParts.afterApp,
  ].join("");

  return new Response(
    pageHTML,
    await describeResponse(serverRequestStateRef.demand())
  );
}

export async function handleError(error: unknown) {
  console.error(error);

  return InternalServerError();
}

export function createWorkerHandler(
  appRequestHandler: (request: FetchEvent["request"]) => Promise<Response>,
  sablesBuildMeta?: SablesBuildMeta
) {
  const assetProxyHandler = createAssetProxyHandler({ sablesBuildMeta });

  return async (request: FetchEvent["request"], env: WorkerEnv) => {
    try {
      const assetProxyResponse = await assetProxyHandler(request, env);

      if (assetProxyResponse) {
        return assetProxyResponse;
      }

      // Await the response to catch the potential rejection
      const response = await appRequestHandler(request);

      return response;
    } catch (error) {
      return handleError(error);
    }
  };
}
