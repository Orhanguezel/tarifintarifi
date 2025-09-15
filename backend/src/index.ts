import { createServer } from "http";
import app from "./app";
import { loadEnv } from "./config/env";
import { connectDB } from "./db/connect";

(async () => {
  loadEnv();
  await connectDB();

  const port = Number(process.env.PORT || 5019);
  const server = createServer(app);

  server.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
})();
