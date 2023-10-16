/// <reference types="@cloudflare/workers-types" />

import type { ConfigureManagerFn } from "@sables/framework";

import { getBuildMeta } from "../../shared.js";
import type { ResponseDescriptor, SablesBuildMeta } from "../../types.js";
import { createWorkerHandler } from "../shared.js";
import { transitionToFetchResponse } from "./transitionToFetchResponse.js";

interface TransitionHandlerOptions {
  describeResponse?: ResponseDescriptor;
  sablesBuildMeta?: SablesBuildMeta;
}

export function createTransitionHandler(
  configureManager: ConfigureManagerFn,
  options: TransitionHandlerOptions = {},
) {
  const { describeResponse, sablesBuildMeta } = options;
  const { taggedSSRManifest, template } = getBuildMeta(sablesBuildMeta);

  async function transitionApp(request: FetchEvent["request"]) {
    return transitionToFetchResponse({
      configureManager,
      describeResponse,
      request,
      taggedSSRManifest,
      template,
    });
  }

  return createWorkerHandler(transitionApp, sablesBuildMeta);
}
