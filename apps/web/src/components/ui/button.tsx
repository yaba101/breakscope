import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-selection)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--ui-selection)] text-white hover:bg-[#4f8df7]",
        secondary:
          "border-[var(--ui-border)] bg-[var(--ui-raised)] text-[var(--ui-fg)] hover:bg-[var(--ui-hover)]",
        ghost:
          "border-transparent bg-transparent text-[var(--ui-fg-secondary)] hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)]",
        danger:
          "border-[var(--ui-danger)] bg-transparent text-[var(--ui-danger)] hover:bg-[color-mix(in_srgb,var(--ui-danger)_12%,transparent)]",
        violet:
          "border-[var(--ui-comment)] bg-transparent text-[#b99aff] hover:bg-[color-mix(in_srgb,var(--ui-comment)_12%,transparent)]",
      },
      size: {
        sm: "h-7 rounded-[4px] px-2.5 text-[11px]",
        md: "h-8 rounded-[4px] px-3 text-xs",
        lg: "h-10 rounded-[4px] px-5 text-sm",
        icon: "size-8 rounded-[4px] p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
