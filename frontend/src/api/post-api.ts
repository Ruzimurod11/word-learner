import axios from "axios";
import type { Post, PostsResponse, CreatePostDto } from "../types/post";

const API = "http://localhost:3000/posts";

// GET
export const getPosts = async (): Promise<Post[]> => {
  const res = await axios.get<PostsResponse>(API);
  return res.data.data;
};

// POST
export const createPost = async (data: CreatePostDto): Promise<Post> => {
  const res = await axios.post<Post>(API, data);
  return res.data;
};

export const getPostById = async (id: number): Promise<Post> => {
  const res = await axios.get(`${API}/${id}`);
  return res.data.data;
};
