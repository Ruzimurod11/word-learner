import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Outlet />
    </div>
  ),
});
