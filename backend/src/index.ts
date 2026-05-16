import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import wordRoutes from "./routes/wordRoutes.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

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
