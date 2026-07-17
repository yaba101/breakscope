import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BreakscopeLanding } from "./breakscope-landing";

const { loadBreakscopeState, saveBreakscopeState, discoverRoutesLocally, push } = vi.hoisted(() => ({
  loadBreakscopeState: vi.fn(),
  saveBreakscopeState: vi.fn(),
  discoverRoutesLocally: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/breakscope-workspace", () => ({ loadBreakscopeState, saveBreakscopeState }));
vi.mock("@/lib/local-capture", () => ({ discoverRoutesLocally }));

function renderLanding() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><BreakscopeLanding /></QueryClientProvider>);
}

describe("BreakscopeLanding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadBreakscopeState.mockResolvedValue({
      target: { url: "https://hilos.sh/?ref=seesaw", updatedAt: 4 },
      latestIssues: [],
      updatedAt: 4,
    });
    saveBreakscopeState.mockResolvedValue(undefined);
  });

  it("keeps the URL field empty and offers removable history", async () => {
    renderLanding();
    const input = await screen.findByRole("combobox", { name: "Page URL" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("");

    fireEvent.focus(input);
    expect(await screen.findByText("Previously tested")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /hilos\.sh/i }));
    expect(input).toHaveValue("https://hilos.sh/?ref=seesaw");

    fireEvent.click(screen.getByRole("button", { name: "Clear URL" }));
    expect(input).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    await waitFor(() => expect(saveBreakscopeState).toHaveBeenCalledWith(expect.objectContaining({ recentTargets: [] })));
  });
});
