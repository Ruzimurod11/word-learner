import type { UnitSummary } from "@/types/book";

interface UnitTabsProps {
  units: UnitSummary[];
  activeUnitId: number | null;
  onSelect: (unitId: number) => void;
}

export function UnitTabs({ units, activeUnitId, onSelect }: UnitTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Unit tanlash"
      className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {units.map((unit) => {
        const isActive = unit.id === activeUnitId;
        return (
          <button
            key={unit.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(unit.id)}
            className={
              "inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition " +
              (isActive
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
            }
            title={`${unit.title} — ${unit.wordCount} so'z`}
          >
            {unit.order}
          </button>
        );
      })}
    </div>
  );
}
