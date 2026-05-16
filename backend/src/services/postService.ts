import fs from "fs";
import path from "path";
import type { Post } from "../types/post.js";

const DB_PATH = path.resolve("db.json");

export const readDB = (): Post[] => {
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data).posts;
};

export const writeDB = (posts: Post[]) => {
  fs.writeFileSync(DB_PATH, JSON.stringify({ posts }, null, 2));
};
