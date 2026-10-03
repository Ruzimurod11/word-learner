import { Router } from "express";
import * as bookController from "../controllers/bookController.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = Router();

router.get("/", bookController.listBooks);
router.post("/", requireAdmin, bookController.createTopic);
router.get("/:id", bookController.getBook);
router.patch("/:id", requireAdmin, bookController.updateTopic);
router.delete("/:id", requireAdmin, bookController.deleteTopic);
router.post("/:id/units", requireAdmin, bookController.createTopicUnit);

export default router;
