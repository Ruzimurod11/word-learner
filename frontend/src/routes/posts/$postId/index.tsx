import { createFileRoute } from "@tanstack/react-router";
import PostDetail from "./-components";

export const Route = createFileRoute("/posts/$postId/")({
  component: PostDetail,
});
