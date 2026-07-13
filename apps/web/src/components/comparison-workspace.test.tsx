import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComparisonWorkspace } from "./comparison-workspace";

describe("ComparisonWorkspace", () => {
  it("exposes all four comparison modes", () => {
    render(<ComparisonWorkspace publicMode />);
    expect(screen.getByRole("button", { name: /side by side/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slider/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /overlay/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /diff/i })).toBeInTheDocument();
  });

  it("switches mode with keyboard shortcuts", () => {
    render(<ComparisonWorkspace publicMode />);
    fireEvent.keyDown(window, { key: "2" });
    expect(screen.getByRole("button", { name: /slider/i })).toHaveClass("active");
  });

  it("zooms from the canvas and restores the fitted view", () => {
    render(<ComparisonWorkspace publicMode />);
    const canvas = screen.getByRole("region", { name: "Visual comparison canvas" });
    expect(screen.getByLabelText("Canvas zoom")).toHaveTextContent("100%");
    fireEvent.wheel(canvas, { deltaY: -120, clientX: 120, clientY: 80 });
    expect(screen.getByLabelText("Canvas zoom")).not.toHaveTextContent("100%");
    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(screen.getByLabelText("Canvas zoom")).toHaveTextContent("100%");
  });

  it("offers an always-visible canvas reset through the minimap", () => {
    render(<ComparisonWorkspace publicMode />);
    expect(screen.getByRole("button", { name: "Reset canvas view" })).toBeInTheDocument();
  });

  it("preserves a full-page capture aspect ratio", () => {
    const { container } = render(<ComparisonWorkspace publicMode viewport={{ id: "desktop", label: "Desktop", width: 1440, height: 9527 }} />);
    expect(container.querySelector(".frame-paper")).toHaveStyle({ aspectRatio: String(1440 / 9527) });
  });

  it("presents meaningful semantic findings instead of anonymous pixel regions", () => {
    render(<ComparisonWorkspace publicMode />);
    expect(screen.getByRole("heading", { name: "Pricing hierarchy changed" })).toBeInTheDocument();
    expect(screen.getByText("47/100 risk · 88% elements matched")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Professional pricing plan expanded/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "content" }));
    expect(screen.getByRole("button", { name: /Primary pricing action changed/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enterprise plan shifted horizontally/ })).not.toBeInTheDocument();
  });

  it("presents a cached AI verdict and keeps refresh opt-in", () => {
    const onAnalyze = vi.fn();
    render(<ComparisonWorkspace onAnalyze={onAnalyze} aiAnalysis={{
      model: "nvidia/test",
      generatedAt: 1,
      executiveSummary: "The candidate removes the primary checkout path.",
      beforePurpose: "Choose a plan and continue to checkout.",
      afterPurpose: "Read plan details without a checkout action.",
      verdict: "block",
      confidence: 0.94,
      riskScore: 91,
      userImpacts: ["Visitors cannot continue to checkout."],
      regressions: [{ title: "Checkout removed", explanation: "The primary action is absent.", severity: "high" }],
      recommendations: ["Restore and keyboard-test the checkout action."],
    }} />);
    expect(screen.getByRole("heading", { name: /removes the primary checkout path/i })).toBeInTheDocument();
    expect(screen.getByText("Visitors cannot continue to checkout.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /refresh ai review/i }));
    expect(onAnalyze).toHaveBeenCalledOnce();
  });
});
