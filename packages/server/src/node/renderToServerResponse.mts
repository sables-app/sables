import { createLifecycle } from "@sables/framework";
import type { RouteHref } from "@sables/framework/router";
import { demandValue } from "@sables/framework/utils";

import type { ServerResponse } from "node:http";
import { Writable } from "node:stream";

import type { IncomingMessage } from "connect";
import { createElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Deferred } from "ts-deferred";

import {
  defaultResponseDescriptor,
  getAssetTags,
  parseTemplate,
  resolveAppInput,
} from "../shared.js";
import type {
  AppInput,
  ResponseDescriptor,
  TaggedSSRManifest,
} from "../types.js";

export async function renderToServerResponse({
  app,
  describeResponse = defaultResponseDescriptor,
  request,
  response,
  taggedSSRManifest,
  template,
}: {
  app: AppInput;
  describeResponse?: ResponseDescriptor;
  request: IncomingMessage;
  response: ServerResponse;
  taggedSSRManifest: TaggedSSRManifest;
  template: string;
}) {
  const href = demandValue(request.originalUrl) as RouteHref;
  const renderComplete = new Deferred<void>();
  const Lifecycle = createLifecycle({ href });
  const templateParts = parseTemplate(template);

  let beforeStreamError: unknown;

  const templateStream = new Writable({
    write(chunk, _encoding, callback) {
      response.write(chunk, callback);
    },
    final() {
      console.log("final");
      response.end(templateParts.afterApp);
      renderComplete.resolve();
    },
  });

  const { serverRequestStateRef } = Lifecycle.ref.demand();
  const jsx = createElement(Lifecycle, null, await resolveAppInput(app));
  const reactSteam = renderToPipeableStream(jsx, {
    onShellReady() {
      console.log("onShellReady");
      const serverRequestState = serverRequestStateRef.demand();

      if (beforeStreamError !== undefined) {
        serverRequestState.beforeStreamError = beforeStreamError;
      }
    },
    onShellError(error) {
      renderComplete.reject(error);
    },
    async onAllReady() {
      // `onAllReady` is used to wait for the application to finish rendering
      // and complete all requests. Waiting is also necessary so that the
      // `invokedImporters` array is filled before rendering asset tags.

      console.log("onAllReady");

      const { headers, status } = await describeResponse(
        serverRequestStateRef.demand(),
      );

      response.statusCode = status;
      Object.entries(headers).forEach((args) => response.setHeader(...args));

      const assetTags = await getAssetTags({
        serverRequestStateRef,
        shouldHydrate: true,
        taggedSSRManifest,
      });

      templateStream.write(templateParts.start);
      templateStream.write(assetTags);
      templateStream.write(templateParts.beforeApp);
      reactSteam.pipe(templateStream);
    },
    onError(error) {
      beforeStreamError = error;
    },
  });

  return renderComplete.promise;
}
