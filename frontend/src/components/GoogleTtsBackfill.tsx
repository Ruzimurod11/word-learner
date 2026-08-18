import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { backfillAudioWithGoogleTts } from "@/api/word-api";
import { useIsAdmin } from "@/lib/auth";
import { btn } from "@/components/ui";

type Toast = { kind: "success" | "error"; text: string };

// Bir chaqiruvda qayta ishlanadigan so'zlar soni. So'rov timeout'ga
// urilmasligi uchun butun backfill shu hajmdagi bo'laklarga bo'linadi.
const BATCH_SIZE = 50;

export function GoogleTtsBackfill() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<Toast | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const mutation = useMutation({
    mutationFn: async () => {
      let updated = 0;
      let remaining = 0;
      for (;;) {
        const res = await backfillAudioWithGoogleTts(BATCH_SIZE);
        updated += res.updated;
        remaining = res.remaining;
        setProgress({ done: updated, total: updated + remaining });
        if (remaining === 0) break;
        // Bo'lakdan bitta ham audio kelmadi — TTS xato beryapti.
        // Cheksiz sikldan himoya.
        if (res.updated === 0) break;
      }
      return { updated, remaining };
    },
    onSettled: () => setProgress(null),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["unit-words"] });
      void queryClient.invalidateQueries({ queryKey: ["search-words"] });
      setToast({
        kind: "success",
        text: t("google_tts.success", {
          updated: res.updated,
          remaining: res.remaining,
        }),
      });
    },
    onError: (err) => {
      setToast({
        kind: "error",
        text: err instanceof Error ? err.message : t("common.error"),
      });
    },
  });

  if (!isAdmin) return null;

  const pending = mutation.isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={pending}
        title={t("google_tts.button")}
        className={`${btn.ghost} h-9 shrink-0`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {!pending
            ? t("google_tts.button")
            : progress
              ? t("google_tts.progress", progress)
              : t("google_tts.pending")}
        </span>
      </button>

      {toast &&
        createPortal(
          <div
            role="status"
            className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            {toast.text}
          </div>,
          document.body,
        )}
    </>
  );
}
