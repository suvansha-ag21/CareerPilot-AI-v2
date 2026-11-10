import fs from "fs";
import path from "path";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const storagePath = path.resolve(process.cwd(), env.STORAGE_DIR);
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const server = app.listen(env.PORT, () => {
  console.log(`[CareerPilot Gateway] Running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[CareerPilot Gateway] ${signal} received, closing connections...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
