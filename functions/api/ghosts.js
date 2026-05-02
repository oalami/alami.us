export async function onRequest(context) {
  const { request, env } = context;

  if (!env.GHOST_DATA) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST: A visitor is finishing their session and saving their path
  if (request.method === "POST") {
    try {
      const { path } = await request.json();
      if (!Array.isArray(path) || path.length < 5) {
        return new Response("too short", { status: 400 });
      }

      // We only store the absolute latest path.
      // Last visitor wins, which is perfect for this vibe.
      await env.GHOST_DATA.put("last_visitor_path", JSON.stringify(path), {
        expirationTtl: 86400, // Path expires after 24 hours of inactivity
      });

      return new Response("echoed", { status: 201 });
    } catch (e) {
      return new Response("error", { status: 400 });
    }
  }

  // GET: Fetch the latest stored path
  const path = (await env.GHOST_DATA.get("last_visitor_path")) || "[]";
  return new Response(path, {
    headers: { "Content-Type": "application/json" },
  });
}
