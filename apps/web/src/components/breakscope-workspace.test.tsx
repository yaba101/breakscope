import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponsiveIssue } from "@breakscope/shared";
import { BreakscopeWorkspace } from "./breakscope-workspace";

const { clearBreakscopeState, loadBreakscopeState, saveBreakscopeState, capturePageLocally, discoverRoutesLocally, getLocalCaptureHealth, scanRouteLocally } = vi.hoisted(() => ({
  clearBreakscopeState: vi.fn(),
  loadBreakscopeState: vi.fn(),
  saveBreakscopeState: vi.fn(),
  capturePageLocally: vi.fn(),
  discoverRoutesLocally: vi.fn(),
  getLocalCaptureHealth: vi.fn(),
  scanRouteLocally: vi.fn(),
}));

vi.mock("@/lib/breakscope-workspace", () => ({ clearBreakscopeState, loadBreakscopeState, saveBreakscopeState }));
vi.mock("@/lib/local-capture", () => ({ capturePageLocally, discoverRoutesLocally, getLocalCaptureHealth, scanRouteLocally }));

const target = {
  id: "current",
  name: "example.com",
  url: "https://example.com",
  selectedRoutes: ["/", "/pricing"],
  minWidth: 320,
  maxWidth: 1440,
  executionMode: "local" as const,
  deviceWidths: [375, 768, 1280, 1440],
  createdAt: 1,
  updatedAt: 1,
};

const issue: ResponsiveIssue = {
  id: "overflow:/",
  fingerprint: "overflow:/",
  type: "overflow",
  severity: "high",
  confidence: 0.98,
  title: "Horizontal overflow",
  description: "The page extends beyond the viewport.",
  routePath: "/",
  selector: "main",
  elementRect: { x: 16, y: 540, width: 288, height: 120 },
  minFailWidth: 320,
  maxFailWidth: 390,
  failureRanges: [{ min: 320, max: 390 }],
  lastWorkingWidth: 768,
  evidenceWidth: 320,
  measurements: { overflow: 40 },
  verification: "still-broken",
  documentHeight: 900,
  screenshot: new ArrayBuffer(8),
};

function renderWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><BreakscopeWorkspace /></QueryClientProvider>);
}

describe("BreakscopeWorkspace", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:breakscope-test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    discoverRoutesLocally.mockResolvedValue({ routes: ["/", "/pricing", "/blog"] });
    getLocalCaptureHealth.mockResolvedValue(true);
    saveBreakscopeState.mockResolvedValue(undefined);
    clearBreakscopeState.mockResolvedValue(undefined);
    loadBreakscopeState.mockResolvedValue({ target, availableRoutes: ["/", "/pricing", "/blog"], latestIssues: [], updatedAt: 1 });
  });

  it("restores the target and exposes the complete scan configuration", async () => {
    renderWorkspace();

    expect(await screen.findByText("example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run test" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^\/$/ })).toHaveAttribute("aria-pressed", "true");

    expect(screen.queryByText("Width range")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "/blog" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "/blog" }));
    expect(screen.getByRole("button", { name: "/blog" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Collapse test configuration" }));
    expect(screen.getByRole("button", { name: "Expand test configuration" })).toBeInTheDocument();
  });

  it("reports the real local capture health instead of a hardcoded online state", async () => {
    getLocalCaptureHealth.mockResolvedValue(false);
    renderWorkspace();

    expect(await screen.findByLabelText("Local capture agent offline")).toHaveTextContent("Agent offline");
    expect(screen.getByRole("button", { name: "Run test" })).toBeDisabled();
  });

  it("restores a blocker into the issue navigator and inspector", async () => {
    loadBreakscopeState.mockResolvedValue({ target, latestIssues: [issue], updatedAt: 1 });
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "320px · Needs attention" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "failing evidence for Horizontal overflow" })).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Horizontal overflow/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("main affected by this check").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Highlighted target: main affected by this check")).toBeInTheDocument();
    expect(screen.getByText("Detector evidence")).toBeInTheDocument();
    const issueHighlight = document.querySelector(".bk-result-image-layer > .bs-highlight");
    expect(issueHighlight).toHaveTextContent("main affected by this check");
    expect(issueHighlight).toHaveStyle({ top: "60%", left: "5%", width: "90%" });
    expect(document.querySelector(".bk-minimap-issue")).toBeInTheDocument();
    expect(await screen.findByText("Building a focused repair", { selector: "b" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open page/i })).toHaveAttribute("href", "https://example.com/");
    expect(screen.getByRole("button", { name: "Phone 375px" })).toHaveClass("failed");

    const inspectorResizer = screen.getByRole("separator", { name: "Resize issue inspector" });
    expect(inspectorResizer).toHaveAttribute("aria-valuenow", "380");
    fireEvent.keyDown(inspectorResizer, { key: "ArrowLeft" });
    expect(inspectorResizer).toHaveAttribute("aria-valuenow", "400");

    fireEvent.click(screen.getByRole("button", { name: /Horizontal overflow/ }));
    expect(screen.getByRole("button", { name: /Horizontal overflow/ })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Tablet 768px" }));
    expect(screen.getByRole("heading", { name: "768px · Passed" })).toBeInTheDocument();
    expect(screen.getByText("No responsive issues at 768px")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Regenerate repair plan" })).not.toBeInTheDocument();
  });

  it("groups repeated detector findings while preserving each affected element", async () => {
    const firstImage: ResponsiveIssue = { ...issue, id: "image-1", fingerprint: "image-alt:/:image-1", type: "image-alt", severity: "medium", title: "Image has no text alternative", description: "The image is not described for assistive technology.", selector: "main img:nth-of-type(1)", elementRect: { x: 12, y: 40, width: 120, height: 80 }, failureRanges: [{ min: 320, max: 1440 }], maxFailWidth: 1440, measurements: { tag: "img" } };
    const secondImage: ResponsiveIssue = { ...firstImage, id: "image-2", fingerprint: "image-alt:/:image-2", selector: "main img:nth-of-type(2)", elementRect: { x: 150, y: 420, width: 120, height: 80 } };
    loadBreakscopeState.mockResolvedValue({ target, latestIssues: [firstImage, secondImage], updatedAt: 1 });
    renderWorkspace();

    expect(await screen.findByRole("button", { name: /2 images have no text alternative/i })).toBeInTheDocument();
    expect(screen.getByText(/1 family · 2 elements/i)).toBeInTheDocument();
    expect(screen.getByText("Page-wide checks")).toBeInTheDocument();
    expect(screen.getByText("No responsive issues at 320px")).toBeInTheDocument();
    expect(screen.getByText("1 of 2", { selector: ".bk-occurrence-nav output" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Image has no text alternative/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next affected element" }));
    expect(await screen.findByText("2 of 2", { selector: ".bk-occurrence-nav output" })).toBeInTheDocument();
    expect(screen.getAllByText("img missing alternative text").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Tablet 768px" }));
    expect(screen.getByText("No responsive issues at 768px")).toBeInTheDocument();
    expect(screen.getByText("Page-wide checks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tablet 768px" })).not.toHaveClass("failed");

    fireEvent.click(screen.getByRole("button", { name: /2 images have no text alternative/i }));
    expect(screen.getByRole("button", { name: "Tablet 768px" })).toHaveClass("active");
    expect(screen.getByLabelText("iPad Pro 11 device frame")).toBeInTheDocument();
    expect(screen.getByText("Failing · 768px")).toBeInTheDocument();
    expect(document.querySelector(".bk-result-image-layer > .bs-highlight")).not.toBeInTheDocument();
  });

  it("keeps detector findings scoped to the checkpoints where they were observed", async () => {
    const phoneOnlyImage: ResponsiveIssue = {
      ...issue,
      id: "phone-image",
      fingerprint: "image-alt:/:phone-image",
      type: "image-alt",
      severity: "medium",
      title: "Image has no text alternative",
      description: "The mobile image is not described for assistive technology.",
      selector: "main picture img",
      minFailWidth: 375,
      maxFailWidth: 375,
      failureRanges: [{ min: 375, max: 375 }],
      evidenceWidth: 375,
      lastWorkingWidth: 768,
      measurements: { tag: "img" },
    };
    loadBreakscopeState.mockResolvedValue({ target, latestIssues: [phoneOnlyImage], updatedAt: 1 });
    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "375px · Needs attention" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Image has no text alternative/i })).toBeInTheDocument();
    expect(screen.queryByText("Page-wide checks")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tablet 768px" }));
    expect(screen.getByRole("heading", { name: "768px · Passed" })).toBeInTheDocument();
    expect(screen.getByText("No responsive issues at 768px")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Image has no text alternative/i })).not.toBeInTheDocument();
  });

  it("shows a dedicated AI loading state and never exposes validation internals", async () => {
    loadBreakscopeState.mockResolvedValue({ target, latestIssues: [issue], updatedAt: 1 });
    let finishRequest: ((response: Response) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finishRequest = resolve; })));
    renderWorkspace();

    await screen.findByRole("heading", { name: "320px · Needs attention" });
    expect(await screen.findByText("Building a focused repair", { selector: "b" })).toBeInTheDocument();
    expect(screen.getByText(/Reading the screenshot and detector evidence/).closest('[role="status"]')).toBeInTheDocument();
    finishRequest?.(new Response(JSON.stringify({ error: '[{"code":"invalid_type","path":["summary"]}]' }), { status: 502, headers: { "Content-Type": "application/json" } }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The AI explanation could not be generated. Please try again.");
    expect(screen.queryByText(/invalid_type/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("builds a copyable repair prompt from the issue and AI analysis", async () => {
    loadBreakscopeState.mockResolvedValue({ target, latestIssues: [issue], updatedAt: 1 });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ analysis: {
      summary: "The content overflows the viewport.",
      likelyCause: "A fixed width is wider than its container.",
      recommendation: "Replace the fixed width with a constrained fluid width.",
      codeHint: "Use max-width: 100%.",
      confidence: 0.91,
      model: "test-model",
      generatedAt: 1,
    } }), { status: 200, headers: { "Content-Type": "application/json" } })));
    renderWorkspace();

    await screen.findByRole("heading", { name: "320px · Needs attention" });
    expect(await screen.findByText("What’s happening")).toBeInTheDocument();
    expect(screen.getByText("A fixed width is wider than its container.")).toBeInTheDocument();
    expect(screen.getByText("Replace the fixed width with a constrained fluid width.")).toBeInTheDocument();
    const copyPromptButton = await screen.findByRole("button", { name: "Copy fix prompt" });
    expect(copyPromptButton.closest(".bk-ai-result-actions")).toHaveClass("bs-actions");
    expect(screen.getByRole("button", { name: "Regenerate repair plan" })).toBeInTheDocument();
    fireEvent.click(copyPromptButton);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Selector: main"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Use max-width: 100%."));
    expect(await screen.findByRole("button", { name: "Prompt copied" })).toBeInTheDocument();
  });

  it("allows routes to be removed and disables scanning when none remain", async () => {
    renderWorkspace();
    const rootRoute = await screen.findByRole("button", { name: /^\/$/ });

    fireEvent.click(rootRoute);
    fireEvent.click(screen.getByRole("button", { name: "/pricing" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Run test" })).toBeDisabled());
  });

  it("restores persisted checkpoints and switches between devices", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      latestIssues: [],
      latestPreviews: [
        { width: 375, label: "Phone", routePath: "/", image: new ArrayBuffer(8) },
        { width: 768, label: "Tablet", routePath: "/", image: new ArrayBuffer(8) },
        { width: 1280, label: "Laptop", routePath: "/", image: new ArrayBuffer(8) },
        { width: 1440, label: "Wide", routePath: "/", image: new ArrayBuffer(8) },
      ],
      updatedAt: 1,
    });
    renderWorkspace();

    expect(await screen.findByRole("img", { name: "Phone checkpoint at 375px" })).toBeInTheDocument();
    expect(screen.getByLabelText("iPhone 17 Pro device frame")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit device" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Fit screen" }));
    expect(screen.getByRole("button", { name: "Fit screen" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Device shell: iPhone 17 Pro" }));
    expect(await screen.findByLabelText("Search devices")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pin iPhone 17 Pro" }));
    expect(screen.getByRole("button", { name: "Unpin iPhone 17 Pro" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Phone" }));
    fireEvent.click(screen.getByRole("button", { name: /Galaxy S26 Ultra/ }));
    expect(screen.getByLabelText("Galaxy S26 Ultra device frame")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tablet 768px" }));
    expect(await screen.findByRole("img", { name: "Tablet checkpoint at 768px" })).toBeInTheDocument();
    expect(screen.getByLabelText("iPad Pro 11 device frame")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tablet 768px" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Phone 375px" }));
    expect(await screen.findByRole("img", { name: "Phone checkpoint at 375px" })).toBeInTheDocument();
    expect(screen.queryByText("Capture unavailable")).not.toBeInTheDocument();
  });

  it("keeps browser-engine evidence isolated when switching engines", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      latestIssues: [],
      latestPreviews: [
        { width: 375, label: "Phone", routePath: "/", browserEngine: "chromium", image: new ArrayBuffer(8) },
        { width: 375, label: "Phone", routePath: "/", browserEngine: "webkit", image: new ArrayBuffer(12) },
      ],
      updatedAt: 1,
    });
    renderWorkspace();

    expect(await screen.findByRole("img", { name: "Phone checkpoint at 375px" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Safari, capture ready/i }));
    expect(await screen.findByRole("img", { name: "Phone checkpoint at 375px" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Safari, capture ready/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Firefox, capture unavailable/i }));
    expect(await screen.findByRole("button", { name: "Retry 375px capture" })).toBeInTheDocument();
  });

  it("keeps browser selection independent when the device changes", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      latestIssues: [],
      latestPreviews: [
        { width: 375, label: "Phone", routePath: "/", browserEngine: "webkit", image: new ArrayBuffer(8) },
      ],
      ui: { activeBrowserEngine: "webkit" },
      updatedAt: 1,
    });
    renderWorkspace();

    expect(await screen.findByRole("button", { name: /Safari, capture ready/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Device shell: iPhone 17 Pro" }));
    fireEvent.click(await screen.findByRole("button", { name: "Phone" }));
    fireEvent.click(await screen.findByRole("button", { name: /Galaxy S26 Ultra/ }));
    expect(screen.getByRole("button", { name: /Safari, capture ready/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Galaxy S26 Ultra device frame")).toBeInTheDocument();
  });

  it("automatically starts a setup-requested scan exactly once", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      availableRoutes: ["/", "/pricing", "/blog"],
      latestIssues: [],
      latestPreviews: [{ width: 375, label: "Phone", routePath: "/", image: new ArrayBuffer(8) }],
      scanRequest: { id: "setup-run-1", requestedAt: 2, source: "setup" },
      updatedAt: 2,
    });
    scanRouteLocally.mockResolvedValue([]);
    capturePageLocally.mockResolvedValue({
      image: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
      snapshot: { documentHeight: 900 },
    });

    renderWorkspace();

    await waitFor(() => expect(scanRouteLocally).toHaveBeenCalled());
    expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({ scanRequest: undefined }));
  });

  it("reports the complete cross-browser checkpoint matrix without overflowing the total", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      availableRoutes: ["/", "/pricing", "/blog"],
      latestIssues: [],
      latestPreviews: [],
      scanRequest: { id: "matrix-run-1", requestedAt: 2, source: "setup" },
      updatedAt: 2,
    });
    scanRouteLocally.mockImplementation(() => new Promise(() => undefined));
    capturePageLocally.mockResolvedValue({
      image: { arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) },
      snapshot: { documentHeight: 900 },
    });

    renderWorkspace();

    await waitFor(() => expect(capturePageLocally).toHaveBeenCalledTimes(12));
    const captureLabel = await screen.findByText("Browser captures");
    await waitFor(() => expect(captureLabel.closest("div")).toHaveTextContent("12/12"));
    expect(screen.getByRole("heading", { name: "Sweeping responsive range" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel test/i })).toHaveTextContent("Progress will be saved");
  });

  it("recaptures only an unavailable viewport", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      latestIssues: [],
      latestPreviews: [{ width: 375, label: "Phone", routePath: "/", image: new ArrayBuffer(8) }],
      updatedAt: 1,
    });
    capturePageLocally.mockResolvedValue({
      image: { arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) },
      snapshot: { documentHeight: 900 },
    });
    renderWorkspace();

    await screen.findByRole("img", { name: "Phone checkpoint at 375px" });
    fireEvent.click(screen.getByRole("button", { name: "Tablet 768px" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retry 768px capture" }));

    await waitFor(() => expect(capturePageLocally).toHaveBeenCalledWith(expect.objectContaining({ width: 768, routePath: "/" })));
    await waitFor(() => expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({ latestPreviews: expect.arrayContaining([expect.objectContaining({ width: 768 })]) })));
  });

  it("clears retained evidence without discarding the configured test", async () => {
    loadBreakscopeState.mockResolvedValue({
      target,
      latestIssues: [issue],
      latestPreviews: [{ width: 375, label: "Phone", routePath: "/", image: new ArrayBuffer(8) }],
      updatedAt: 1,
    });
    renderWorkspace();

    fireEvent.click(await screen.findByRole("button", { name: "Open workspace controls" }));
    fireEvent.click(await screen.findByRole("button", { name: /Clear captured evidence/i }));

    await waitFor(() => expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({
      target,
      latestIssues: [],
      latestPreviews: [],
      scanJob: undefined,
    })));
  });
});
