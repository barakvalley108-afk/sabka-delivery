import assert from "node:assert/strict";
import test from "node:test";

test("renders a branded, hydration-safe initial document", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(
    html,
    /<title>Sabka Delivery \| Food, Grocery &amp; Electronics Delivery in Lala Bazar<\/title>/i,
  );
  assert.match(html, /rel="(?:shortcut )?icon"[^>]+favicon\.ico/i);
  assert.match(html, /rel="apple-touch-icon"[^>]+apple-icon\.png/i);
  assert.match(html, /rel="manifest"[^>]+manifest\.webmanifest/i);
  assert.match(html, /SABKA DELIVERY/i);
  assert.doesNotMatch(html, /Private coupon activated/i);
  assert.doesNotMatch(html, /Loading (?:catalog|screen)/i);
});
