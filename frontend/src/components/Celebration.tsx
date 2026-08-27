import type { CSSProperties } from "react";

const COLORS = [
  "#f59e0b",
  "#ec4899",
  "#22d3ee",
  "#a855f7",
  "#22c55e",
  "#ef4444",
  "#3b82f6",
];

interface Burst {
  left: string;
  top: string;
  color: string;
  delay: string;
  distance: string;
}

// portlashlar butun ekran bo'ylab tarqatilgan; joylashuv va vaqt qat'iy, chunki
// render ichida Math.random ishlatib bo'lmaydi (react-compiler lint'i taqiqlaydi)
const BURSTS: Burst[] = [
  {
    left: "18%",
    top: "26%",
    color: "#f59e0b",
    delay: "0ms",
    distance: "150px",
  },
  {
    left: "62%",
    top: "14%",
    color: "#3b82f6",
    delay: "90ms",
    distance: "155px",
  },
  {
    left: "80%",
    top: "20%",
    color: "#ec4899",
    delay: "180ms",
    distance: "170px",
  },
  {
    left: "36%",
    top: "34%",
    color: "#ef4444",
    delay: "260ms",
    distance: "165px",
  },
  {
    left: "50%",
    top: "42%",
    color: "#22d3ee",
    delay: "340ms",
    distance: "200px",
  },
  {
    left: "10%",
    top: "52%",
    color: "#22c55e",
    delay: "430ms",
    distance: "175px",
  },
  {
    left: "26%",
    top: "70%",
    color: "#a855f7",
    delay: "520ms",
    distance: "160px",
  },
  {
    left: "90%",
    top: "44%",
    color: "#f59e0b",
    delay: "590ms",
    distance: "185px",
  },
  {
    left: "76%",
    top: "66%",
    color: "#22c55e",
    delay: "660ms",
    distance: "180px",
  },
  {
    left: "52%",
    top: "78%",
    color: "#ec4899",
    delay: "730ms",
    distance: "190px",
  },
];

const PARTICLES = 32;
const CONFETTI_PER_SIDE = 36;

interface ConfettiPiece {
  id: number;
  color: string;
  x: string;
  y: string;
  delay: string;
  duration: string;
  spin: number;
  width: string;
  height: string;
  round: boolean;
}

// har bir parcha uchun turlicha traektoriya kerak, lekin qiymatlar barqaror
// bo'lishi shart — modul yuklanganda formula bilan bir marta hisoblanadi
const CONFETTI: ConfettiPiece[] = Array.from(
  { length: CONFETTI_PER_SIDE },
  (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: `${22 + ((i * 37) % 56)}vw`,
    y: `${30 + ((i * 53) % 34)}vh`,
    delay: `${(i % 6) * 45}ms`,
    duration: `${1600 + ((i * 91) % 600)}ms`,
    spin: 360 + ((i * 137) % 720),
    width: i % 3 === 0 ? "0.5rem" : "0.375rem",
    height: i % 3 === 0 ? "0.5rem" : "0.75rem",
    round: i % 4 === 0,
  }),
);

function ConfettiCannon({ side }: { side: "left" | "right" }) {
  const sign = side === "left" ? 1 : -1;
  return (
    <div
      className="absolute bottom-0"
      style={side === "left" ? { left: "2vw" } : { right: "2vw" }}
    >
      {CONFETTI.map((piece) => (
        <span
          key={piece.id}
          className="animate-confetti-x absolute block"
          style={
            {
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              "--cf-x": sign === 1 ? piece.x : `-${piece.x}`,
            } as CSSProperties
          }
        >
          <span
            className="animate-confetti-y block"
            style={
              {
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                "--cf-y": piece.y,
              } as CSSProperties
            }
          >
            <span
              className={`animate-confetti-piece block ${piece.round ? "rounded-full" : "rounded-[2px]"}`}
              style={
                {
                  width: piece.width,
                  height: piece.height,
                  background: piece.color,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  "--cf-spin": `${sign * piece.spin}deg`,
                } as CSSProperties
              }
            />
          </span>
        </span>
      ))}
    </div>
  );
}

// 5 ta ketma-ket to'g'ri javob nishoni: butun ekran bo'ylab fireworks
// portlashlari + pastdagi ikki burchakdan otiladigan konfetti
export function Celebration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {BURSTS.map((burst) => (
        <div
          key={`${burst.left}-${burst.top}`}
          className="absolute"
          style={{ left: burst.left, top: burst.top }}
        >
          <span
            className="animate-firework-flash absolute block h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
            style={{ background: burst.color, animationDelay: burst.delay }}
          />
          {Array.from({ length: PARTICLES }, (_, i) => (
            <span
              key={i}
              className="absolute block"
              style={{ transform: `rotate(${(360 / PARTICLES) * i}deg)` }}
            >
              <span
                className="animate-firework-particle block h-2 w-2 rounded-full"
                style={
                  {
                    background: burst.color,
                    boxShadow: `0 0 12px ${burst.color}`,
                    animationDelay: burst.delay,
                    "--fw-dist": burst.distance,
                  } as CSSProperties
                }
              />
            </span>
          ))}
        </div>
      ))}
      <ConfettiCannon side="left" />
      <ConfettiCannon side="right" />
    </div>
  );
}
