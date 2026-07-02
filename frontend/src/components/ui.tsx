import type { ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:brightness-110 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  icon: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-md shadow-destructive/25 transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50",
};

export const input =
  "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30";

export const card = "rounded-2xl border border-border bg-card shadow-sm";

export const modalOverlay =
  "absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in";

export const modalPanel =
  "relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl animate-scale-in";

export const errorAlert =
  "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive";

const BOOK_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-indigo-500",
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-blue-500",
  "from-purple-500 to-indigo-600",
];

export function bookGradient(i: number) {
  return BOOK_GRADIENTS[Math.abs(i) % BOOK_GRADIENTS.length];
}

export function StateCard({
  variant = "empty",
  children,
}: {
  variant?: "empty" | "error";
  children: ReactNode;
}) {
  if (variant === "error") {
    return <div className={`${errorAlert} animate-fade-in p-4`}>{children}</div>;
  }
  return (
    <div className={`${card} animate-fade-in p-8 text-center text-muted-foreground`}>
      {children}
    </div>
  );
}
