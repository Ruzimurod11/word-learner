import type { Request, Response } from "express";
import * as postService from "../services/postService.ts";
import type { Post } from "../types/post.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

// 1. GET ALL
export const getAllPosts = (_req: Request, res: Response) => {
  try {
    const posts = postService.readDB();
    sendSuccess(res, posts);
  } catch (_error) {
    sendError(res, "Serverda xatolik yuz berdi");
  }
};

// 2. GET DETAIL
export const getPostById = (req: Request, res: Response) => {
  const posts = postService.readDB();
  const id = parseInt(req.params.id as string, 10);
  const post = posts.find((p) => p.id === id);

  if (post) {
    sendSuccess(res, post);
  } else {
    sendError(res, `ID: ${id} bo'lgan post topilmadi`, 404);
  }
};

// 3. CREATE
export const createPost = (req: Request, res: Response) => {
  const posts = postService.readDB();
  const lastPost = posts[posts.length - 1];

  const newPost: Post = {
    id: lastPost ? lastPost.id + 1 : 1,
    title: req.body.title,
    content: req.body.content,
  };

  posts.push(newPost);
  postService.writeDB(posts);
  res.status(201).json(newPost);
};

// 4. UPDATE (PUT)
export const updatePost = (req: Request, res: Response) => {
  const posts = postService.readDB();
  const id = parseInt(req.params.id as string, 10);
  const index = posts.findIndex((p) => p.id === id);

  if (index !== -1) {
    posts[index] = { ...posts[index], ...req.body };
    postService.writeDB(posts);
    res.json(posts[index]);
  } else {
    res.status(404).json({ message: "O'zgartirish uchun post topilmadi" });
  }
};

// 5. DELETE
export const deletePost = (req: Request, res: Response) => {
  let posts = postService.readDB();
  const id = parseInt(req.params.id as string, 10);
  const initialLength = posts.length;

  posts = posts.filter((p) => p.id !== id);

  if (posts.length < initialLength) {
    postService.writeDB(posts);
    res.json({ message: "Post o'chirildi" });
  } else {
    res.status(404).json({ message: "O'chirish uchun post topilmadi" });
  }
};
