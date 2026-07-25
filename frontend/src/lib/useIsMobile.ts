import { useEffect, useState } from "react";

// Tailwind `sm` (640px) dan pastda — mobile list ko'rinishi, yuqorisida jadval.
const QUERY = "(max-width: 639px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
