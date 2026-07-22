import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BreakscopeHistory } from "./breakscope-history";

const { loadBreakscopeState, loadScanRunArtifacts, saveBreakscopeState, push } = vi.hoisted(() => ({ loadBreakscopeState: vi.fn(), loadScanRunArtifacts: vi.fn(), saveBreakscopeState: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/breakscope-workspace", () => ({ loadBreakscopeState, loadScanRunArtifacts, saveBreakscopeState }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const target = { id: "current", name: "example.com", url: "https://example.com", selectedRoutes: ["/"], minWidth: 320, maxWidth: 1440, executionMode: "local" as const, deviceWidths: [375], browserEngines: ["chromium" as const], createdAt: 1, updatedAt: 1 };
const older = { id: "older", createdAt: 1, target, issues: [], previews: [], suppressedCount: 0 };
const current = { id: "current", createdAt: 2, target, issues: [], previews: [], suppressedCount: 0 };

describe("BreakscopeHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadBreakscopeState.mockResolvedValue({ latestIssues: [], scanHistory: [current, older], updatedAt: 2 });
    saveBreakscopeState.mockResolvedValue(undefined);
    loadScanRunArtifacts.mockResolvedValue(undefined);
  });

  it("lets the user choose an explicit baseline and compares later runs to it", async () => {
    render(<QueryClientProvider client={new QueryClient()}><BreakscopeHistory /></QueryClientProvider>);

    const baselineButtons = await screen.findAllByRole("button", { name: "Set baseline" });
    fireEvent.click(baselineButtons[1]!);

    await waitFor(() => expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({ baselineRunId: "older" })));
    expect(screen.getByRole("button", { name: "Baseline" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Review changes" })).toBeInTheDocument();
  });

  it("restores the selected baseline from local state", async () => {
    loadBreakscopeState.mockResolvedValue({ latestIssues: [], scanHistory: [current, older], baselineRunId: "older", updatedAt: 2 });
    render(<QueryClientProvider client={new QueryClient()}><BreakscopeHistory /></QueryClientProvider>);

    expect(await screen.findByRole("button", { name: "Baseline" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Review changes" })).toBeInTheDocument();
  });

  it("restores every saved checkpoint before opening a historical scan", async () => {
    const previews = [375, 768, 1280, 1440].map((width) => ({ width, label: String(width), routePath: "/", browserEngine: "chromium" as const, image: new ArrayBuffer(8) }));
    const completeRun = { ...current, target: { ...target, deviceWidths: previews.map((preview) => preview.width) }, previews };
    loadScanRunArtifacts.mockResolvedValue(completeRun);
    loadBreakscopeState.mockResolvedValue({ latestIssues: [], scanHistory: [completeRun], updatedAt: 2 });
    render(<QueryClientProvider client={new QueryClient()}><BreakscopeHistory /></QueryClientProvider>);

    fireEvent.click(await screen.findByRole("button", { name: /Open scan/i }));

    await waitFor(() => expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ deviceWidths: [375, 768, 1280, 1440] }),
      latestPreviews: previews,
    })));
    expect(push).toHaveBeenCalledWith("/workspace");
  });
});
