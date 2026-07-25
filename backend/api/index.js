// Vercel serverless entry. Imports the pre-bundled app (produced by
// `pnpm vercel-build`) — a single self-contained .js file, so no relative
// `.ts` imports need to be resolved at runtime. Kept as .js (not .ts) so it
// stays out of the TypeScript program and does not need a .d.ts for the bundle.
import app from "../dist/app.js";

export default app;
