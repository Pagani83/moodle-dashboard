import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORIGIN = 'https://cjud.tjrs.jus.br';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for huge reports
const MAX_RETRIES = 3;

const httpsAgent = new https.Agent({
  keepAlive: true,
  // 0 means no socket timeout; we'll use AbortController instead
  timeout: 0 as unknown as number,
});

const httpAgent = new http.Agent({
  keepAlive: true,
  timeout: 0 as unknown as number,
});

async function proxyFetch(req: NextRequest, targetUrl: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        method: req.method,
        headers: buildForwardHeaders(req.headers),
        body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined,
        // Use proper agent for protocol
        // @ts-expect-error Node fetch agent
        agent: targetUrl.startsWith('https:') ? httpsAgent : httpAgent,
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
        ...init,
      });

  const responseHeaders = new Headers(res.headers);
  // Strip encoding and hop-by-hop headers to avoid browser decode or connection issues
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('connection');
  responseHeaders.delete('keep-alive');
  responseHeaders.delete('content-length');
  responseHeaders.set('Cache-Control', 'no-store');

      return new NextResponse(res.body as any, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      lastErr = err;
      const retriable = err?.code === 'ECONNRESET' || err?.name === 'AbortError' || err?.code === 'ETIMEDOUT';
      if (!retriable || attempt >= MAX_RETRIES) {
        break;
      }
      const delay = Math.min(2000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 500);
      await new Promise(r => setTimeout(r, delay));
    } finally {
      clearTimeout(timer);
    }
  }

  return NextResponse.json(
    { error: 'ProxyError', message: lastErr?.message || 'Unknown proxy error', code: lastErr?.code },
    { status: 502 }
  );
}

function buildForwardHeaders(incoming: Headers): HeadersInit {
  const headers: Record<string, string> = {};
  // Do not forward accept-encoding to prevent upstream compression mismatches
  const allow = ['accept', 'content-type', 'user-agent'];
  for (const key of allow) {
    const val = incoming.get(key);
    if (val) headers[key] = val;
  }
  // Let Node/Fetch manage connection headers
  return headers;
}

function buildTargetUrlFromReq(req: NextRequest): string {
  // Derive path from the request URL to avoid relying on ctx.params
  const pathname = req.nextUrl.pathname.replace(/^\/?api\/moodle\/?/, '/');
  const qs = req.nextUrl.search;
  return `${ORIGIN}${pathname}${qs}`;
}

export async function GET(req: NextRequest) {
  const target = buildTargetUrlFromReq(req);
  return proxyFetch(req, target);
}

export async function POST(req: NextRequest) {
  const target = buildTargetUrlFromReq(req);
  return proxyFetch(req, target);
}
