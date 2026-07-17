import { queryOptions } from "@tanstack/react-query";
import { loadBreakscopeState } from "./breakscope-workspace";

export const breakscopeQueryKeys = {
  all: ["breakscope"] as const,
  workspace: () => [...breakscopeQueryKeys.all, "workspace"] as const,
  scan: () => [...breakscopeQueryKeys.all, "scan"] as const,
};

export function workspaceStateQueryOptions() {
  return queryOptions({
    queryKey: breakscopeQueryKeys.workspace(),
    queryFn: loadBreakscopeState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
