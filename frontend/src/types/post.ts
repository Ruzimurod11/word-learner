export interface Post {
  id: number;
  title: string;
  content: string;
}

export interface PostsResponse {
  data: Post[];
}

export interface CreatePostDto {
  title: string;
  content: string;
}
