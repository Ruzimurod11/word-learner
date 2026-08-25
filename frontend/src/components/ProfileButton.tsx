import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { UserRound } from "lucide-react";
import { getProfile } from "@/api/profile-api";
import { useIsAdmin } from "@/lib/auth";
import { btn } from "@/components/ui";

export function ProfileButton() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: isAdmin,
  });

  // Chiqib ketilgach cache'dagi avatar hali turadi — uni ko'rsatmaymiz.
  const avatar = isAdmin ? data?.avatar : null;

  return (
    <Link
      to="/profile"
      aria-label={t("profile.title")}
      title={t("profile.title")}
      className={`${btn.icon} overflow-hidden`}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound className="h-5 w-5" aria-hidden="true" />
      )}
    </Link>
  );
}
