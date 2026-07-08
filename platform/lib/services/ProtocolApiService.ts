export function protocolResponse<T>(data: T, meta: Record<string, unknown> = {}) {
  return {
    object: "gratifi.protocol.response",
    apiVersion: "v1",
    data,
    meta
  };
}

export function protocolError(message: string, status = 400) {
  return Response.json(
    {
      object: "gratifi.protocol.error",
      apiVersion: "v1",
      error: { message, status }
    },
    { status }
  );
}
