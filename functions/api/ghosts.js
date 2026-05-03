const MIN_PATH_LENGTH = 5;
const MAX_PATH_LENGTH = 400;
const MAX_BODY_BYTES = 64 * 1024;

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function isValidPoint(point) {
  return (
    point &&
    typeof point === "object" &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

async function parsePath(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { error: "payload too large", status: 413 };
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return { error: "payload too large", status: 413 };
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    return { error: "invalid json", status: 400 };
  }

  const { path } = payload || {};
  if (!Array.isArray(path)) {
    return { error: "path must be an array", status: 400 };
  }

  if (path.length < MIN_PATH_LENGTH) {
    return { error: "path too short", status: 400 };
  }

  if (path.length > MAX_PATH_LENGTH) {
    return { error: "path too long", status: 400 };
  }

  if (!path.every(isValidPoint)) {
    return {
      error: "path points must be normalized finite coordinates",
      status: 400,
    };
  }

  return { path };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "GET") {
    if (!env.GHOST_DATA) {
      return jsonResponse([]);
    }

    const path = (await env.GHOST_DATA.get("last_visitor_path")) || "[]";
    return new Response(path, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method === "POST") {
    if (!env.GHOST_DATA) {
      return jsonResponse(
        { error: "ghost storage unavailable" },
        { status: 503 },
      );
    }

    const result = await parsePath(request);
    if (result.error) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    // We only store the absolute latest path.
    // Last visitor wins, which is perfect for this vibe.
    await env.GHOST_DATA.put("last_visitor_path", JSON.stringify(result.path), {
      expirationTtl: 86400, // Path expires after 24 hours of inactivity
    });

    return jsonResponse({ status: "echoed" }, { status: 201 });
  }

  return jsonResponse(
    { error: "method not allowed" },
    {
      status: 405,
      headers: { Allow: "GET, POST" },
    },
  );
}
