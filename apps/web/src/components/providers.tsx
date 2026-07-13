"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { subscribeToWorkspace } from "@/lib/local-workspace";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  useEffect(() => subscribeToWorkspace(() => {
    void client.invalidateQueries({ queryKey: ["local-workspace"] });
    void client.invalidateQueries({ queryKey: ["local-runs"] });
    void client.invalidateQueries({ queryKey: ["project"] });
  }), [client]);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" position="bottom-right" toastOptions={{ className: "uirift-toast" }} />
    </QueryClientProvider>
  );
}
