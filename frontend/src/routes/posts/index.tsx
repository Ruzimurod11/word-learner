import { createFileRoute } from "@tanstack/react-router";
import Posts from "./-components";

export const Route = createFileRoute("/posts/")({
  component: Posts,
});
