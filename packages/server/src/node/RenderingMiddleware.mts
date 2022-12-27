import { demandValue } from "@sables/framework/utils";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import createServer from "connect";
import serveStatic from "serve-static";
import { createServer as createViteServer } from "vite";

import { getAssetProxyURL, getBuildMeta } from "../shared.js";
import type {
  AppInput,
  ResponseDescriptor,
  SablesBuildMeta,
} from "../types.js";
import { renderToServerResponse } from "./renderToServerResponse.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface RenderingMiddlewareOptions {
  assetsDir?: string;
  describeResponse?: ResponseDescriptor;
  sablesBuildMeta?: SablesBuildMeta;
}

export async function createRenderingMiddleware(
  app: AppInput,
  options: RenderingMiddlewareOptions = {}
) {
  const { describeResponse } = options;
  const assetProxyURL = getAssetProxyURL(undefined);
  const buildMeta = getBuildMeta(options?.sablesBuildMeta);
  const { taggedSSRManifest, template: baseTemplate } = buildMeta;
  const assetsDir = options.assetsDir || path.resolve(__dirname, "client");
  const server = createServer();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  if (assetProxyURL) {
    // TODO: Add middleware to proxy assets to the base URL.
    console.error(
      "Rendering middleware doesn't yet support the option to proxy assets."
    );
  } else {
    if (!fs.existsSync(assetsDir)) {
      console.error(
        "Rendering middleware couldn't find client assets directory. Client assets won't be served."
      );
    } else {
      server.use(serveStatic(assetsDir, { index: false }));
    }
  }

  server.use(vite.middlewares);

  server.use(async (request, response, next) => {
    try {
      const template = await vite.transformIndexHtml(
        demandValue(request.originalUrl),
        baseTemplate
      );

      await renderToServerResponse({
        app,
        describeResponse,
        request,
        response,
        taggedSSRManifest,
        template,
      });
    } catch (error) {
      if (error instanceof Error) {
        vite.ssrFixStacktrace(error);
      }

      next(error);
    }
  });

  return server;
}
