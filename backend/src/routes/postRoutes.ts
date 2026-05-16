import { Router } from "express";
import * as postController from "../controllers/postController.ts";

const router = Router();

router.get("/", postController.getAllPosts);
router.post("/", postController.createPost);
router.put("/:id", postController.updatePost);
router.get("/:id", postController.getPostById);
router.delete("/:id", postController.deletePost);

export default router;
