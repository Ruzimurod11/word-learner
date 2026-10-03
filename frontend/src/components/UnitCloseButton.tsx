import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, LockOpen } from "lucide-react";
import { closeUnit, reopenUnit } from "@/api/book-api";
import { btn } from "@/components/ui";

interface UnitCloseButtonProps {
  unitId: number;
  closed: boolean;
}

export function UnitCloseButton({ unitId, closed }: UnitCloseButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => (closed ? reopenUnit(unitId) : closeUnit(unitId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["book"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    },
  });

  return (
    <button
      type="button"
      className={btn.ghost}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {closed ? (
        <LockOpen className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Lock className="h-4 w-4" aria-hidden="true" />
      )}
      {mutation.isPending
        ? t("book.unit_status_pending")
        : closed
          ? t("book.reopen_unit")
          : t("book.close_unit")}
    </button>
  );
}
