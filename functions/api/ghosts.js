export async function onRequest(context) {
  const { request, env } = context;

  // For this to work in production, a KV namespace must be bound to GHOST_DATA
  // If no KV is bound, we'll fall back to a no-op so the site doesn't crash.
  if (!env.GHOST_DATA) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    try {
      const { x, y } = await request.json();
      const current = (await env.GHOST_DATA.get("recent_ghosts")) || "[]";
      let ghosts = JSON.parse(current);

      const now = Date.now();
      ghosts.push({ x, y, ts: now });

      // Keep only last 25 ghosts and filter out ones older than 45 seconds
      ghosts = ghosts.slice(-25).filter((g) => now - g.ts < 45000);

      await env.GHOST_DATA.put("recent_ghosts", JSON.stringify(ghosts), {
        expirationTtl: 60, // Auto-expire the key if no updates for 1 min
      });

      return new Response("spooky", { status: 201 });
    } catch (e) {
      return new Response("error", { status: 400 });
    }
  }

  const ghosts = (await env.GHOST_DATA.get("recent_ghosts")) || "[]";
  return new Response(ghosts, {
    headers: { "Content-Type": "application/json" },
  });
}
