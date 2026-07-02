import path from "node:path";
import { defineConfig } from "vitest/config";

// vite.config.ts'dan alohida: test runida tanstackRouter (routeTree.gen.ts'ni
// qayta yozadi) va tailwind pluginlari ishlamasligi kerak.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "happy-dom" },
});
