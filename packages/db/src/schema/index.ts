import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chunks = pgTable("chunks", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
