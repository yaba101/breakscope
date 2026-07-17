# Report Viewer Design — Breakscope

## [S1] Problem

The report page at `/report/[token]` is retired (redirects home). The workspace stores everything locally in IndexedDB. There is no way to share scan results across devices or with collaborators. The old share API is tied to the defunct comparison flow and requires auth.

## [S2] Solution

Add a "Share" button to the workspace and rebuild the report page as a full interactive mirror of the workspace.

1. **Share button** — serializes workspace state into a JSON blob with base64-encoded screenshots
2. **POST /api/share** — stores the blob in a new `report_share` table (no auth — local-first)
3. **Report page** — fetches the blob, reconstructs a read-only workspace view with full interactivity

## [S3] Data model

New `report_share` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| token_hash | TEXT | SHA-256 of the public token |
| payload | TEXT | JSON blob — serialized workspace state |
| created_at | INTEGER | Unix ms |
| expires_at | INTEGER | Unix ms (7-day default) |

## [S4] Share flow

1. User clicks "Share" in workspace header
2. Client serializes:
   - `target` (TestTarget)
   - `latestIssues` (ResponsiveIssue[] with base64 screenshots)
   - `latestPreviews` (PersistedViewportPreview[] with base64 images)
   - `aiReviews` (Record<string, AiIssueAnalysis>)
   - `deviceWidths` (number[])
3. POST to `/api/share` → returns `/report/<token>` URL
4. User copies URL to clipboard

## [S5] Report page

- Route: `/report/[token]`
- Fetches blob from `GET /api/public/reports/[token]`
- Renders a stripped-down `BreakscopeWorkspace` — same visual components, no scan capability
- Supports: device frame, checkpoint switcher, browser switcher, issue inspector, AI analysis view
- Read-only: no "Run test" button, no re-capture, no route editing

## [S6] Payload size concern

Base64 screenshots inflate ~33%. A typical scan with 9 checkpoints × 3 browsers × 2MB screenshots ≈ 72MB uncompressed. Mitigations:
- Store only issue evidence screenshots (not all checkpoints)
- Limit to top 3 issues per the existing prioritization
- Compress screenshots to JPEG before base64 encoding
- Consider gzipped transfer (Next.js handles this)

## [S7] Scope limits

- No auth required — share link is the auth
- 7-day expiry, no revocation UI (future work)
- No collaboration or commenting
- No PDF/HTML export (future work)
