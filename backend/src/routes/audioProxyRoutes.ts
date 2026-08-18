import { Router } from "express";

const router = Router();

router.get("/proxy", async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL parameter required" });
    return;
  }

  try {
    const audioRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!audioRes.ok) {
      res.status(audioRes.status).send("Audio not found");
      return;
    }

    // CORS headers qo'shib, audio stream jo'natamiz
    res.setHeader("Content-Type", audioRes.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await audioRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Audio proxy error:", err);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
});

export default router;
