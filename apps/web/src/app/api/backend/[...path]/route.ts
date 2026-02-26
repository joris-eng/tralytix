import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL;
const TIMEOUT_MS = 15000;

async function handler(req: NextRequest, context: { params: { path: string[] } }) {
  if (!API_BASE) {
    return NextResponse.json(
      { error: { message: "Backend not configured" } },
      { status: 500 }
    );
  }

  const { path } = context.params;
  const normalizedPath = path[0] === "backend" ? path.slice(1) : path;

  const targetUrl = new URL("/" + normalizedPath.join("/"), API_BASE);
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers();

  const forward = ["authorization", "content-type", "accept", "x-request-id"];
  for (const key of forward) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let body: string | undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
      const text = await req.text();
      if (text) body = text;
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: { message: "Gateway timeout" } }, { status: 504 });
    }

    return NextResponse.json({ error: { message: "Bad gateway" } }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
