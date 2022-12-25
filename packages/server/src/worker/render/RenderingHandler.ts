/// <reference types="@cloudflare/workers-types" />

import { getBuildMeta } from "../../shared.js";
import type {
  AppInput,
  ResponseDescriptor,
  SablesBuildMeta,
} from "../../types.js";
import { createWorkerHandler } from "../shared.js";
import { renderToFetchResponse } from "./renderToFetchResponse.js";

interface RenderingHandlerOptions {
  describeResponse?: ResponseDescriptor;
  sablesBuildMeta?: SablesBuildMeta;
}

export function createRenderingHandler(
  app: AppInput,
  options: RenderingHandlerOptions = {}
) {
  const { describeResponse, sablesBuildMeta } = options;
  const { taggedSSRManifest, template } = getBuildMeta(sablesBuildMeta);

  async function renderApp(request: FetchEvent["request"]) {
    return renderToFetchResponse({
      app,
      describeResponse,
      request,
      taggedSSRManifest,
      template,
    });
  }

  return createWorkerHandler(renderApp, sablesBuildMeta);
}
