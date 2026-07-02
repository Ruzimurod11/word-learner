import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface SelectOption<T> {
  value: T;
  label: string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
      >
        <span>{current?.label}</span>
        <ChevronDown
          className={
            "h-3.5 w-3.5 text-muted-foreground transition-transform" +
            (open ? " rotate-180" : "")
          }
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 min-w-full origin-top-right animate-scale-in overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          {options.map((o) => {
            const isActive = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={
                    "flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm " +
                    (isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted")
                  }
                >
                  <span>{o.label}</span>
                  {isActive && (
                    <Check
                      className="ml-auto h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
