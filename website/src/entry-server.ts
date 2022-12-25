/// <reference types="node" />

import { createRenderingMiddleware } from "@sables/server/node";

import connect from "connect";
import cors from "cors";
import errorHandler from "errorhandler";
import getPort from "get-port";

async function main() {
  const port = await getPort({ port: 5173 });

  connect()
    .use(cors())
    .use(await createRenderingMiddleware(() => import("./App.js")))
    .use(errorHandler)
    .listen(port);

  console.info(`Serving app from: http://localhost:${port}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
