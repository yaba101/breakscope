"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

export function IconButton({ icon: Icon, label, active = false, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={label}
            aria-pressed={active}
            className={active ? "bg-[var(--ui-hover)] text-[var(--ui-selection)]" : undefined}
            onClick={onClick}
          >
            <Icon aria-hidden="true" size={15} strokeWidth={1.7} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="z-[100] rounded-[4px] border border-[var(--ui-border)] bg-[#202020] px-2 py-1 text-[10px] text-white shadow-xl" sideOffset={6}>
            {label}
            <Tooltip.Arrow className="fill-[#202020]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
