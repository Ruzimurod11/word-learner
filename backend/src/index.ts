import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import wordRoutes from "./routes/wordRoutes.ts";
import bookRoutes from "./routes/bookRoutes.ts";
import unitRoutes from "./routes/unitRoutes.ts";
import { languageMiddleware } from "./i18n/index.ts";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin:
    allowedOrigins.length === 0
      ? true
      : (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(languageMiddleware);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/cron", (_req, res) => {
  res.send("ok");
});

app.use("/books", bookRoutes);
app.use("/units", unitRoutes);
app.use("/words", wordRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
