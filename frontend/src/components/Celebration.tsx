import { useEffect } from "react";
import confetti from "canvas-confetti";

const BASE: confetti.Options = {
  zIndex: 9999,
  disableForReducedMotion: true,
  colors: [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
  ],
};

const GOLD = ["#fde68a", "#fbbf24", "#f59e0b", "#fff7ed"];
const EMOJIS = ["🎉", "🎊", "✨", "⭐", "🥳", "🎁", "🏆", "💫"];

// davomli fireworks oqimi shuncha davom etadi; QuizGame komponentni 2500ms
// dan keyin unmount qiladi, oxirgi zarralar shundan oldin so'nishi kerak
const STREAM_MS = 1500;
const STREAM_GAP_MS = 170;

// 5 ta ketma-ket to'g'ri javob nishoni: markazdan katta portlash, pastki ikki
// burchakdan yon to'plar, emoji yomg'iri, yulduzli yaltiroq va ekran bo'ylab
// tasodifiy joylardan otiladigan fireworks oqimi. Komponent `key` bilan qayta
// mount qilinadi — butun ketma-ketlik mount'da bir marta ishga tushadi.
export function Celebration() {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;

    const at = (ms: number, fire: () => void) => {
      timers.push(setTimeout(fire, ms));
    };

    // 1. markaziy portlash
    confetti({
      ...BASE,
      particleCount: 120,
      spread: 110,
      startVelocity: 50,
      origin: { x: 0.5, y: 0.55 },
      scalar: 1.1,
    });

    // 2. oltin yulduzli yaltiroq — asosiy portlash ustidan uchadi
    confetti({
      ...BASE,
      colors: GOLD,
      shapes: ["star"],
      particleCount: 45,
      spread: 130,
      startVelocity: 38,
      gravity: 0.6,
      decay: 0.92,
      scalar: 1.3,
      origin: { x: 0.5, y: 0.55 },
    });

    // 3. pastki burchaklardan yon to'plar (ikki to'lqin)
    const cannon = (side: "left" | "right", power: number) => {
      confetti({
        ...BASE,
        particleCount: power,
        angle: side === "left" ? 60 : 120,
        spread: 70,
        startVelocity: 55,
        origin: { x: side === "left" ? 0 : 1, y: 0.7 },
      });
    };
    at(120, () => cannon("left", 70));
    at(220, () => cannon("right", 70));
    at(900, () => cannon("left", 45));
    at(1000, () => cannon("right", 45));

    // 4. emoji yomg'iri
    const emojiShapes = EMOJIS.map((text) =>
      confetti.shapeFromText({ text, scalar: 2 }),
    );
    const emojiRain = (count: number, x: number) => {
      confetti({
        ...BASE,
        shapes: emojiShapes,
        particleCount: count,
        spread: 120,
        startVelocity: 35,
        gravity: 0.7,
        ticks: 220,
        scalar: 2,
        origin: { x, y: 0.6 },
      });
    };
    at(150, () => emojiRain(26, 0.5));
    at(700, () => emojiRain(12, 0.2));
    at(780, () => emojiRain(12, 0.8));

    // 5. ekranning yuqori yarmi bo'ylab tasodifiy fireworks oqimi
    const started = performance.now();
    let lastShot = 0;
    const stream = (now: number) => {
      const elapsed = now - started;
      if (elapsed > STREAM_MS) return;
      if (now - lastShot > STREAM_GAP_MS) {
        lastShot = now;
        confetti({
          ...BASE,
          particleCount: 22,
          spread: 360,
          startVelocity: 22,
          decay: 0.9,
          scalar: 0.9,
          ticks: 120,
          origin: { x: 0.12 + Math.random() * 0.76, y: Math.random() * 0.5 },
        });
      }
      raf = requestAnimationFrame(stream);
    };
    raf = requestAnimationFrame(stream);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
