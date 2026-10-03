import { Router } from "express";
import * as wordController from "../controllers/wordController.ts";
import * as unitController from "../controllers/unitController.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = Router();

router.post("/:unitId/close", requireAdmin, unitController.closeUnit);
router.post("/:unitId/reopen", requireAdmin, unitController.reopenUnit);
router.get("/:unitId/words", wordController.listUnitWords);
router.post("/:unitId/words", requireAdmin, wordController.createUnitWord);
router.put("/:unitId/words/order", requireAdmin, wordController.reorderUnitWords);

export default router;
