import { createServer, type RequestListener } from "node:http";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const startupHandler: RequestListener = (req, res) => {
  const path = req.url?.split("?", 1)[0];

  if (path === "/api" || path === "/api/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(503, {
    "Content-Type": "application/json",
    "Retry-After": "1",
  });
  res.end(JSON.stringify({ error: "API is starting" }));
};

let requestHandler: RequestListener = startupHandler;
const server = createServer((req, res) => requestHandler(req, res));

server.on("error", (error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});

server.listen(port, async () => {
  console.log(`Server listening on port ${port}`);

  try {
    const { default: app } = await import("./app");
    requestHandler = app;
  } catch (error) {
    console.error("Application startup error:", error);
    server.close(() => process.exit(1));

    setTimeout(() => process.exit(1), 5_000).unref();
  }
});
