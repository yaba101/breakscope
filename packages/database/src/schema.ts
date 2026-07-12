import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const projectsTable = sqliteTable("project", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  baselineOrigin: text("baseline_origin").notNull(),
  candidateOrigin: text("candidate_origin").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("project_user_idx").on(table.userId)]);

export const runsTable = sqliteTable("run", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  routePath: text("route_path").notNull(),
  viewportId: text("viewport_id", { enum: ["desktop", "mobile"] }).notNull(),
  status: text("status").notNull(),
  baselineKey: text("baseline_key"),
  candidateKey: text("candidate_key"),
  diffKey: text("diff_key"),
  changedPixels: integer("changed_pixels").default(0).notNull(),
  changedRatio: real("changed_ratio").default(0).notNull(),
  decision: text("decision", { enum: ["pending", "accepted", "rejected"] }).default("pending").notNull(),
  decisionNote: text("decision_note"),
  errorCode: text("error_code"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("run_project_idx").on(table.projectId), index("run_user_idx").on(table.userId)]);

export const regionsTable = sqliteTable("region", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  order: integer("region_order").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  pixelCount: integer("pixel_count").notNull(),
}, (table) => [index("region_run_idx").on(table.runId)]);

export const sharesTable = sqliteTable("share", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
}, (table) => [uniqueIndex("share_token_hash_idx").on(table.tokenHash)]);

export const usageDayTable = sqliteTable("usage_day", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  browserMs: integer("browser_ms").default(0).notNull(),
}, (table) => [uniqueIndex("usage_user_day_idx").on(table.userId, table.day)]);
