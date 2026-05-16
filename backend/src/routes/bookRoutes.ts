import { Router } from "express";
import * as bookController from "../controllers/bookController.ts";

const router = Router();

router.get("/", bookController.listBooks);
router.get("/:id", bookController.getBook);

export default router;
