interface CloudflareEnv {
  DB: D1Database;
  IMAGES: R2Bucket;
  CAPTURE_JOBS: Queue<import("@uirift/shared").CaptureRunV1>;
  ASSETS: Fetcher;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_API_KEY?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  APP_ENV: string;
}
