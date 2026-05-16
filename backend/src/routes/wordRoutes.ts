import { Router } from "express";
import * as wordController from "../controllers/wordController.ts";

const router = Router();

router.get("/", wordController.listWords);
router.post("/", wordController.createWord);
router.put("/:id", wordController.updateWord);
router.delete("/:id", wordController.deleteWord);

export default router;
