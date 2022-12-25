import { createLifecycle } from "@sables/framework";
import type { RouteHref } from "@sables/framework/router";

import { renderToReadableStream } from "react-dom/server";

import { resolveAppInput } from "../../shared.js";
import type {
  AppInput,
  ResponseDescriptor,
  TaggedSSRManifest,
} from "../../types.js";
import { assembleHTMLResponse } from "../shared.js";

export async function renderToFetchResponse({
  app,
  describeResponse,
  request,
  taggedSSRManifest,
  template,
}: {
  app: AppInput;
  describeResponse?: ResponseDescriptor;
  request: FetchEvent["request"];
  taggedSSRManifest: TaggedSSRManifest;
  template: string;
}) {
  const href = new URL(request.url).pathname as RouteHref;
  const Lifecycle = createLifecycle({ href });
  const { serverRequestStateRef } = Lifecycle.ref.demand();

  const reactStream = await renderToReadableStream(
    <Lifecycle>{await resolveAppInput(app)}</Lifecycle>
  );

  // Wait for the application to finish rendering and complete all requests.
  // Waiting is also necessary so that the `invokedImporters` array is
  // filled before rendering asset tags.
  const [appHTML] = await Promise.all([
    new Response(reactStream).text(),
    reactStream.allReady,
  ]);

  return assembleHTMLResponse({
    appHTML,
    describeResponse,
    serverRequestStateRef,
    shouldHydrate: true,
    taggedSSRManifest,
    template,
  });
}
