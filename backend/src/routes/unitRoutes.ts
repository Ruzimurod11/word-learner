import { Router } from "express";
import * as wordController from "../controllers/wordController.ts";

const router = Router();

router.get("/:unitId/words", wordController.listUnitWords);
router.post("/:unitId/words", wordController.createUnitWord);

export default router;
