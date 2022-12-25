/// <reference types="node" />

import { createRenderingMiddleware } from "@sables/server/node";

import connect from "connect";
import errorHandler from "errorhandler";

import App from "./App.js";

async function main() {
  const port = 5173;

  connect()
    .use(await createRenderingMiddleware(<App />))
    .use(errorHandler)
    .listen(port);

  console.info(`Serving app from: http://localhost:${port}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
