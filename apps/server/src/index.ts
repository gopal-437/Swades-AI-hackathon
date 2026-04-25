import { env } from "@my-better-t-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "@my-better-t-app/db";
import { chunks } from "@my-better-t-app/db/schema";
import { inArray } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

app.get("/", (c) => {
  return c.text("OK");
});

app.post("/api/chunks/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { chunkId, data } = body;
    
    if (!chunkId || !data) {
      return c.json({ error: "Missing chunkId or data" }, 400);
    }

    const filePath = path.join(UPLOADS_DIR, chunkId);
    
    // Simulate bucket upload (saving to local file system)
    await fs.writeFile(filePath, data);

    // DB Acknowledgment
    await db.insert(chunks).values({
      id: chunkId,
      status: "uploaded",
    }).onConflictDoNothing();

    return c.json({ success: true, chunkId });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.post("/api/chunks/sync-status", async (c) => {
  try {
    const body = await c.req.json();
    const { chunkIds } = body;

    if (!Array.isArray(chunkIds) || chunkIds.length === 0) {
      return c.json({ statuses: {} });
    }

    // 1. Check DB acks
    const dbChunks = await db
      .select({ id: chunks.id })
      .from(chunks)
      .where(inArray(chunks.id, chunkIds));

    const dbChunkSet = new Set(dbChunks.map((c) => c.id));

    // 2. Reconciliation Check (Bucket exists)
    const statuses: Record<string, boolean> = {};
    for (const chunkId of chunkIds) {
      if (!dbChunkSet.has(chunkId)) {
        statuses[chunkId] = false;
        continue;
      }
      
      try {
        const filePath = path.join(UPLOADS_DIR, chunkId);
        await fs.access(filePath);
        statuses[chunkId] = true; // DB has ack AND bucket has file
      } catch {
        statuses[chunkId] = false; // DB has ack BUT bucket missing file
      }
    }

    return c.json({ statuses });
  } catch (error) {
    console.error("Sync status error:", error);
    return c.json({ error: "Sync status failed" }, 500);
  }
});

export default app;
