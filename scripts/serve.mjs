import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "apps", "web");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function resolvePath(url) {
  const cleanUrl = decodeURIComponent(url.split("?")[0]);
  const requested = normalize(cleanUrl === "/" ? "/index.html" : cleanUrl);
  const filePath = join(root, requested);
  if (!filePath.startsWith(root)) return null;
  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;
  return join(root, "index.html");
}

createServer((req, res) => {
  const filePath = resolvePath(req.url || "/");

  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": types[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });

  createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.info(`Proxy server listening at http://localhost:${port}`);
});
