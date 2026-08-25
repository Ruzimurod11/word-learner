import { Router } from "express";
import * as profileController from "../controllers/profileController.ts";
import { requireAdmin } from "../middleware/auth.ts";

const router = Router();

router.get("/", requireAdmin, profileController.getProfile);
router.put("/", requireAdmin, profileController.updateProfile);

export default router;
