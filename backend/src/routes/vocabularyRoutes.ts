import { Router } from "express";
import * as vocabularyController from "../controllers/vocabularyController.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = Router();

router.get("/", vocabularyController.getVocabulary);
router.post("/words", requireAdmin, vocabularyController.addVocabularyWord);

export default router;
