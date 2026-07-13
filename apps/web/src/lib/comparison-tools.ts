import { create } from "zustand";

export type ComparisonTool = "select" | "pan" | "inspect";

interface ComparisonToolsState {
  tool: ComparisonTool;
  regionsVisible: boolean;
  setTool: (tool: ComparisonTool) => void;
  toggleRegions: () => void;
}

export const useComparisonTools = create<ComparisonToolsState>((set) => ({
  tool: "select",
  regionsVisible: true,
  setTool: (tool) => set({ tool }),
  toggleRegions: () => set((state) => ({ regionsVisible: !state.regionsVisible })),
}));
