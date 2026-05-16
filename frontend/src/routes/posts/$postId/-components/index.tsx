import { useEffect, useState } from "react";
import { getPostById } from "@/api/post-api";
import type { Post } from "@/types/post";
import { useParams } from "@tanstack/react-router";

export default function PostDetail() {
  const { postId } = useParams({ from: "/posts/$postId/" });
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getPostById(Number(postId));
        setPost(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
