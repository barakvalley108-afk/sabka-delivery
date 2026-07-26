/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { BUILD_VERSION } from "../app/build-version";
import { expirePendingPayments } from "../db/payment-orders";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ANDROID_ASSETLINKS_JSON?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestStartedAt = performance.now();
    const recordRuntimeTiming =
      url.pathname === "/" ||
      url.pathname === "/api/market" ||
      url.pathname === "/api/market-version";

    if (url.pathname === "/.well-known/assetlinks.json") {
      const body = env.ANDROID_ASSETLINKS_JSON || "[]";
      return new Response(body, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=300",
          "access-control-allow-origin": "*",
        },
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const handlerMilliseconds = performance.now() - requestStartedAt;
    const headers = new Headers(response.headers);
    headers.set("x-sabka-build-version", BUILD_VERSION);
    if (recordRuntimeTiming) {
      headers.set(
        "server-timing",
        `worker-handler;dur=${handlerMilliseconds.toFixed(2)}`,
      );
    }
    if (
      url.pathname === "/" ||
      url.pathname === "/sw.js" ||
      url.pathname === "/api/market" ||
      url.pathname === "/api/market-version"
    ) {
      headers.set(
        "cache-control",
        "no-store, no-cache, must-revalidate, max-age=0",
      );
      headers.set("cdn-cache-control", "no-store");
      headers.set("cloudflare-cdn-cache-control", "no-store");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
  scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      expirePendingPayments(env.DB).then((cancelled) => {
        if (cancelled)
          console.info(`Cancelled ${cancelled} expired online-payment orders`);
      }),
    );
  },
};

export default worker;
