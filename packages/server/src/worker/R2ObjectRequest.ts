import { BadRequest, NotFound, Unsupported } from "./responses.js";

/**
 * Originally provided by Cloudflare
 * @see https://developers.cloudflare.com/r2/examples/demo-worker/
 */
function parseRange(encoded: string | null) {
  if (encoded === null) {
    return;
  }

  type PartialStringArray = Array<string | undefined>;
  const [, byteIndexes] = encoded.split("bytes=") as PartialStringArray;
  const [offsetString, endString] = (byteIndexes?.split("-") ??
    []) as PartialStringArray;

  if (!offsetString || !endString) {
    console.warn(
      "Encountered a request that didn't specify both the beginning & ending byte.",
    );
    // A server MAY ignore the Range header.
    // https://www.ietf.org/archive/id/draft-ietf-httpbis-p5-range-09.html
    return;
  }

  const offset = parseInt(offsetString, 10);
  const end = parseInt(endString, 10);

  return {
    offset,
    end,
    length: end + 1 - offset,
  };
}

type ParsedRange = ReturnType<typeof parseRange>;

function getResponseHeaders(object: R2Object, range?: ParsedRange) {
  const headers = new Headers();

  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  if (range) {
    headers.set(
      "content-range",
      `bytes ${range.offset}-${range.end}/${object.size}`,
    );
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/octet-stream");
  }

  if (!headers.has("cache-control")) {
    // TODO - Add env var for cache-control, currently set for 7 days
    headers.set("cache-control", "max-age=604800, must-revalidate");
  }

  headers.set("accept-ranges", "bytes");
  headers.set("last-modified", object.uploaded.toUTCString());

  return headers;
}

async function handleHeadRequest(bucket: R2Bucket, objectName: string) {
  const object = await bucket.head(objectName);

  if (object === null) {
    return NotFound(objectName);
  }

  return new Response(null, {
    headers: getResponseHeaders(object),
  });
}

function hasBody(
  object: R2Object | R2ObjectBody | null,
): object is R2ObjectBody {
  return !!object && typeof (object as any).body == "object";
}

const HTTP_OK = 200;
const HTTP_PARTIAL_CONTENT = 206;
const HTTP_NOT_MODIFIED = 304;

function getResponseStatus(body?: ReadableStream, range?: ParsedRange) {
  if (body) {
    return range ? HTTP_PARTIAL_CONTENT : HTTP_OK;
  }

  // Respond with a status of 304 Not Modified when the bucket returns
  // an object without a body. This occurs when the object request's
  // `onlyIf` test fails.
  return HTTP_NOT_MODIFIED;
}

async function handleGetRequest(
  request: FetchEvent["request"],
  bucket: R2Bucket,
  objectName: string,
) {
  const range = parseRange(request.headers.get("range"));
  const object = await bucket.get(objectName, {
    range,
    onlyIf: request.headers,
  });

  if (object === null) {
    return NotFound(objectName);
  }

  const body = hasBody(object) ? object.body : undefined;
  const headers = getResponseHeaders(object, range);
  const status = getResponseStatus(body, range);

  return new Response(body, { headers, status });
}

export async function handleR2ObjectRequest(
  request: FetchEvent["request"],
  bucket: R2Bucket,
): Promise<Response> {
  const url = new URL(request.url);
  // Remove trailing slash
  const objectName = url.pathname.slice(1);

  console.info("Incoming asset request.", {
    objectName,
    requestMethod: request.method,
    requestURL: request.url,
  });

  if (objectName === "") {
    return BadRequest();
  }

  switch (request.method) {
    case "GET":
      return handleGetRequest(request, bucket, objectName);
    case "HEAD":
      return handleHeadRequest(bucket, objectName);
    default:
      return Unsupported();
  }
}
