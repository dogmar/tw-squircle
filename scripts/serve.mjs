import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "../../docs");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  let path = req.url.split("?")[0];
  if (path === "/") path = "/index.html";
  const filePath = join(root, path);

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

function listen(port) {
  server.listen(port, () => {
    console.log(`Docs available at http://localhost:${port}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port < 3100) {
      listen(port + 1);
    } else {
      throw err;
    }
  });
}

listen(3000);
