import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
