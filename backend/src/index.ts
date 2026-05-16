import express, { NextFunction, Request, Response } from "express";
import postRoutes from "./routes/postRoutes.ts";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/posts", postRoutes);

// global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
