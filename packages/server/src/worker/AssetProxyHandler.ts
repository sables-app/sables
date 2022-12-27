/// <reference types="@cloudflare/workers-types" />

import { getAssetProxyURL, getBuildMeta, getEnvVarString } from "../shared.js";
import { SablesBuildMeta } from "../types.js";
import { handleR2ObjectRequest } from "./R2ObjectRequest.js";
import { MethodNotAllowed, NotImplemented } from "./responses.js";
import { handleError } from "./shared.js";
import type { WorkerEnv } from "./types.js";

function isR2Bucket(value: unknown): value is R2Bucket {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as R2Bucket).delete === "function" &&
    typeof (value as R2Bucket).get === "function" &&
    typeof (value as R2Bucket).head === "function" &&
    typeof (value as R2Bucket).list === "function"
  );
}

export function getAssetProxyBucketEnvKey(env: WorkerEnv) {
  return getEnvVarString("ASSET_PROXY_R2_BUCKET", env);
}

export function getAssetProxyBucket(env: WorkerEnv): R2Bucket | undefined {
  const bucketEnvKey = getAssetProxyBucketEnvKey(env);

  if (!bucketEnvKey) {
    // No bucket was configured
    return undefined;
  }

  const bucket = env[bucketEnvKey];

  if (isR2Bucket(bucket)) {
    return bucket;
  }

  throw new Error(
    `The "ASSET_PROXY_R2_BUCKET" env var was set to "${bucketEnvKey}", but the value it points to isn't a R2 Bucket instance.`
  );
}

export function createAssetProxyHandler(
  options: {
    sablesBuildMeta?: SablesBuildMeta;
  } = {}
) {
  const buildMeta = getBuildMeta(options?.sablesBuildMeta);
  const { assetManifest } = buildMeta;

  function isAssetRequest(request: FetchEvent["request"]) {
    return assetManifest.includes(new URL(request.url).pathname);
  }

  async function proxyToURL(
    request: FetchEvent["request"],
    assetProxyURL: string | undefined
  ) {
    if (!assetProxyURL) return undefined;

    try {
      const originalPathname = new URL(request.url).pathname;
      // `any` used because Miniflare blows up when a string is given,
      // but Cloudflare Worker's types error out when a `URL` is given 🙃
      const nextURL: any = new URL(originalPathname, assetProxyURL);

      return fetch(new Request(nextURL));
    } catch (error) {
      return handleError(error);
    }
  }

  async function proxyToBucket(
    request: FetchEvent["request"],
    assetProxyBucket?: R2Bucket
  ) {
    if (!assetProxyBucket) return undefined;

    try {
      return handleR2ObjectRequest(request, assetProxyBucket);
    } catch (error) {
      return handleError(error);
    }
  }

  return async function assetProxyHandler(
    request: FetchEvent["request"],
    env: WorkerEnv
  ) {
    const assetProxyURL = getAssetProxyURL(env);
    const assetProxyBucket = getAssetProxyBucket(env);
    const isProxyDisabled = !assetProxyURL && !assetProxyBucket;
    const shouldHandleRequest = isAssetRequest(request);

    if (isProxyDisabled) {
      return shouldHandleRequest ? NotImplemented() : undefined;
    }
    if (!shouldHandleRequest) {
      return undefined;
    }
    if (request.method !== "GET") {
      return MethodNotAllowed(request);
    }

    // The return must be awaited so we can check
    // whether the request was handled or not
    const response = await proxyToURL(request, assetProxyURL);

    return response || proxyToBucket(request, assetProxyBucket);
  };
}
