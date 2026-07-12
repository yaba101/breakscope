CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER DEFAULT 0 NOT NULL,
  "image" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" INTEGER,
  "refreshTokenExpiresAt" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account" ("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "createdAt" INTEGER,
  "updatedAt" INTEGER
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "project" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "baseline_origin" TEXT NOT NULL,
  "candidate_origin" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "project_user_idx" ON "project" ("user_id");

CREATE TABLE IF NOT EXISTS "run" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "project_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "route_path" TEXT NOT NULL,
  "viewport_id" TEXT NOT NULL CHECK("viewport_id" IN ('desktop','mobile')),
  "status" TEXT NOT NULL,
  "baseline_key" TEXT,
  "candidate_key" TEXT,
  "diff_key" TEXT,
  "changed_pixels" INTEGER DEFAULT 0 NOT NULL,
  "changed_ratio" REAL DEFAULT 0 NOT NULL,
  "decision" TEXT DEFAULT 'pending' NOT NULL CHECK("decision" IN ('pending','accepted','rejected')),
  "decision_note" TEXT,
  "error_code" TEXT,
  "created_at" INTEGER NOT NULL,
  "completed_at" INTEGER,
  "expires_at" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "run_project_idx" ON "run" ("project_id");
CREATE INDEX IF NOT EXISTS "run_user_idx" ON "run" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "one_active_run_per_user" ON "run" ("user_id") WHERE "status" IN ('queued','navigating','stabilizing','capturing','processing');

CREATE TABLE IF NOT EXISTS "region" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "run_id" TEXT NOT NULL,
  "region_order" INTEGER NOT NULL,
  "x" INTEGER NOT NULL,
  "y" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "pixel_count" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "region_run_idx" ON "region" ("run_id");

CREATE TABLE IF NOT EXISTS "share" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "run_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL UNIQUE,
  "created_at" INTEGER NOT NULL,
  "expires_at" INTEGER NOT NULL,
  "revoked_at" INTEGER
);

CREATE TABLE IF NOT EXISTS "usage_day" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "attempts" INTEGER DEFAULT 0 NOT NULL,
  "browser_ms" INTEGER DEFAULT 0 NOT NULL,
  UNIQUE("user_id", "day")
);
