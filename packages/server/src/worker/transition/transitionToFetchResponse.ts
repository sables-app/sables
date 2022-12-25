import {
  ConfigureManagerFn,
  createLifecycle,
  resolveConfigureManager,
} from "@sables/framework";
import type { RouteHref } from "@sables/framework/router";
import { transitionToRoute } from "@sables/ssr";

import type { ResponseDescriptor, TaggedSSRManifest } from "../../types.js";
import { assembleHTMLResponse } from "../shared.js";

export async function transitionToFetchResponse({
  configureManager,
  describeResponse,
  request,
  taggedSSRManifest,
  template,
}: {
  configureManager: ConfigureManagerFn;
  describeResponse?: ResponseDescriptor;
  request: FetchEvent["request"];
  taggedSSRManifest: TaggedSSRManifest;
  template: string;
}) {
  const href = new URL(request.url).pathname as RouteHref;
  const Lifecycle = createLifecycle({ href });
  const { serverRequestStateRef } = Lifecycle.ref.demand();
  const manager = resolveConfigureManager(
    Lifecycle.ref.demand(),
    configureManager
  );

  serverRequestStateRef.demand().routeTransitionStarted = true;

  // Wait for the manager to finish transitioning and complete all requests.
  await transitionToRoute(serverRequestStateRef, manager);

  return assembleHTMLResponse({
    describeResponse,
    serverRequestStateRef,
    shouldHydrate: false,
    taggedSSRManifest,
    template,
  });
}
