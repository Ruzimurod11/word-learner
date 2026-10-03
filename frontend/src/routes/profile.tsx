import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, ImagePlus, Loader2, Trash2, UserRound } from "lucide-react";
import { getProfile, updateProfile } from "@/api/profile-api";
import { imageToDataUrl, MAX_SOURCE_BYTES } from "@/lib/imageToDataUrl";
import { useIsAdmin } from "@/lib/auth";
import { Loader } from "@/components/Loader";
import type { Profile } from "@/types/profile";
import { btn, card, errorAlert, input, StateCard } from "@/components/ui";

export const Route = createFileRoute("/profile")({
    component: ProfilePage,
});

function ProfilePage() {
    const { t } = useTranslation();
    const isAdmin = useIsAdmin();

    return (
        <section
            aria-labelledby="profile-title"
            className="flex flex-col gap-5"
        >
            <header>
                <h1 className="text-2xl font-bold sm:text-3xl text-primary">
                    {t("profile.title")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t("profile.subtitle")}
                </p>
            </header>
            {isAdmin ? (
                <ProfileLoader />
            ) : (
                <StateCard>{t("profile.admin_required")}</StateCard>
            )}
        </section>
    );
}

function ProfileLoader() {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
    });

    if (isPending) return <Loader />;
    if (isError) return <StateCard variant="error">{error.message}</StateCard>;
    return <ProfileForm initial={data} />;
}

function ProfileForm({ initial }: { initial: Profile }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState(initial.displayName ?? "");
    const [avatar, setAvatar] = useState<string | null>(initial.avatar);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!success) return;
        const id = setTimeout(() => setSuccess(false), 2500);
        return () => clearTimeout(id);
    }, [success]);

    const mutation = useMutation({
        mutationFn: () =>
            updateProfile({ displayName: displayName.trim() || null, avatar }),
        onSuccess: (saved) => {
            // Header'dagi avatar ham shu cache'dan o'qiydi.
            queryClient.setQueryData(["profile"], saved);
            setError(null);
            setSuccess(true);
        },
        onError: (err: Error) => setError(err.message),
    });

    const onPickFile = async (
        e: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError(t("profile.invalid_image"));
            return;
        }
        if (file.size > MAX_SOURCE_BYTES) {
            setError(t("profile.image_too_large"));
            return;
        }
        try {
            setAvatar(await imageToDataUrl(file));
            setError(null);
        } catch {
            setError(t("profile.invalid_image"));
        }
    };

    const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <form onSubmit={onSubmit} className={`flex flex-col gap-4 ${card} p-4`}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-muted-foreground">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <UserRound className="h-12 w-12" aria-hidden="true" />
                    )}
                </div>
                <div className="flex flex-col items-start gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void onPickFile(e)}
                    />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={btn.ghost}
                        disabled={mutation.isPending}
                    >
                        <ImagePlus className="h-4 w-4" aria-hidden="true" />
                        {t("profile.upload")}
                    </button>
                    {avatar && (
                        <button
                            type="button"
                            onClick={() => setAvatar(null)}
                            className={btn.danger}
                            disabled={mutation.isPending}
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {t("profile.remove_photo")}
                        </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {t("profile.image_hint")}
                    </p>
                </div>
            </div>

            <div>
                <label
                    htmlFor="profile-name"
                    className="mb-1 block text-sm font-medium"
                >
                    {t("profile.display_name")}
                </label>
                <input
                    id="profile-name"
                    type="text"
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder={t("profile.display_name_placeholder")}
                    className={`${input} w-full sm:w-80`}
                    disabled={mutation.isPending}
                />
            </div>

            {error && (
                <p role="alert" className={errorAlert}>
                    {error}
                </p>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className={`${btn.primary} cursor-pointer`}
                >
                    {mutation.isPending ? (
                        <>
                            <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                            {t("profile.saving")}
                        </>
                    ) : (
                        t("profile.save")
                    )}
                </button>
                {success && (
                    <span
                        role="status"
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {t("profile.saved")}
                    </span>
                )}
            </div>
        </form>
    );
}
