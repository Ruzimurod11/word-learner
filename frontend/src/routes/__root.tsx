import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed top-3 right-3 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  ),
});
