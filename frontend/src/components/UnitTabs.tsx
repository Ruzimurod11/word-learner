import { useTranslation } from "react-i18next";
import type { UnitSummary } from "@/types/book";

interface UnitTabsProps {
  units: UnitSummary[];
  activeUnitId: number | null;
  onSelect: (unitId: number) => void;
}

export function UnitTabs({ units, activeUnitId, onSelect }: UnitTabsProps) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("book.select_unit_aria")}
      className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5 rounded-2xl border border-border bg-card p-2 shadow-sm"
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
              "inline-flex min-w-11 items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-semibold transition " +
              (isActive
                ? "scale-105 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary")
            }
            title={t("book.unit_tab_title", {
              title: unit.title,
              count: unit.wordCount,
            })}
          >
            {unit.order}
          </button>
        );
      })}
    </div>
  );
}
