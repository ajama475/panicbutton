import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = resolve(fileURLToPath(new URL("../out/", import.meta.url)));
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidate = normalize(join(outputDirectory, decoded));
  return candidate === outputDirectory || candidate.startsWith(`${outputDirectory}${sep}`) ? candidate : null;
}

async function resolveFile(pathname) {
  const candidate = safePath(pathname);
  if (!candidate) return null;

  try {
    const details = await stat(candidate);
    if (details.isFile()) return candidate;
    if (details.isDirectory()) {
      try {
        const indexCandidate = join(candidate, "index.html");
        await stat(indexCandidate);
        return indexCandidate;
      } catch {}
    }
  } catch {}

  if (!extname(candidate)) {
    try {
      const htmlCandidate = `${candidate}.html`;
      await stat(htmlCandidate);
      return htmlCandidate;
    } catch {}
  }

  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const requestedFile = await resolveFile(url.pathname);
    const file = requestedFile || join(outputDirectory, "404.html");
    const body = await readFile(file);
    const cacheControl = url.pathname.startsWith("/_next/static/")
      ? "public, max-age=31536000, immutable"
      : "no-cache";

    response.writeHead(requestedFile ? 200 : 404, {
      "Cache-Control": cacheControl,
      "Content-Type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Preview server error. Run npm run build, then try again.");
    console.error(error);
  }
});

server.listen(port, () => {
  console.log(`Sync Your Semester is available at http://localhost:${port}`);
});
