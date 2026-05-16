import { createPost, getPosts } from "@/api/post-api";
import type { Post } from "@/types/post";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error via getting data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleAdd = async () => {
    if (!title || !content) return;

    setCreating(true);

    try {
      await createPost({ title, content });

      setTitle("");
      setContent("");

      // 🔥 qayta fetch qilish
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Error creating post", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button onClick={handleAdd} disabled={creating}>
          {creating ? "Creating..." : "Add Post"}
        </button>
      </div>
      <h1>Posts</h1>

      <ul className="flex flex-col gap-4">
        {posts.map((p) => (
          <Link to={`/posts/${p.id}`} key={p.id}>
            <b>{p.title}</b> — {p.content}
          </Link>
        ))}
      </ul>
    </div>
  );
}
