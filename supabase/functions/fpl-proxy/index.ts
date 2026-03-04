// Supabase Edge Function: fpl-proxy
// Proxies requests to the FPL API server-side, bypassing CORS restrictions.
// Usage: GET /functions/v1/fpl-proxy?path=/entry/123/

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    if (req.method !== "GET") {
        return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const path = url.searchParams.get("path");

    if (!path) {
        return new Response(
            JSON.stringify({ error: "Missing required query parameter: path" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }

    // Only allow paths to the FPL API
    const fplUrl = `https://fantasy.premierleague.com/api${path}`;

    try {
        const fplResponse = await fetch(fplUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FPL-Wrapped/1.0)",
                "Accept": "application/json",
            },
        });

        const body = await fplResponse.text();

        return new Response(body, {
            status: fplResponse.status,
            headers: {
                ...CORS_HEADERS,
                "Content-Type": "application/json",
                "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch from FPL API", details: String(error) }),
            { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }
});
