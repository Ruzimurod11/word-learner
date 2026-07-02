import { Router } from "express";
import * as wordController from "../controllers/wordController.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = Router();

router.get("/search", wordController.searchWords);
router.get("/quiz", wordController.getQuiz);
router.put("/:id", requireAdmin, wordController.updateWord);
router.delete("/:id", requireAdmin, wordController.deleteWord);

export default router;
