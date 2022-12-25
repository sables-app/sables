export function NotFound(objectName: string) {
  return new Response("Not Found", { status: 404 });
}

export function Unsupported() {
  return new Response("Unsupported method", { status: 400 });
}

export function BadRequest() {
  return new Response("Bad Request", { status: 400 });
}

export function InternalServerError() {
  return new Response(null, { status: 500 });
}

export function NotImplemented() {
  return new Response(`Not Implemented.`, { status: 501 });
}

export function MethodNotAllowed(request: FetchEvent["request"]) {
  return new Response(`Method ${request.method} not allowed.`, {
    status: 405,
    headers: {
      Allow: "GET",
    },
  });
}
