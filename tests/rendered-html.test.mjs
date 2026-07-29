import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
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
}

test("server-renders the CRM form and product metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="ru"/i);
  assert.match(html, /<title>Лиды — простая CRM<\/title>/i);
  assert.match(html, /Управляйте входящими лидами/);
  assert.match(html, /Имя клиента/);
  assert.match(html, /Номер телефона/);
  assert.match(html, /Источник лида/);
  assert.match(html, /Ответственный/);
  assert.match(html, /Этап сделки/);
  assert.match(html, /Запрошено ТЗ/);
  assert.match(html, /Сохранить лида/);
  assert.doesNotMatch(html, /codex-preview|Building your site/i);
});

test("removes disposable starter assets and dependencies", async () => {
  const [packageJson] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    assert.rejects(
      access(
        new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url),
      ),
    ),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
});
