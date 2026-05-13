// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deploy target: Vercel (SPA build). Cloudflare plugin is disabled and TanStack
// Start is configured in SPA mode so the build produces a static SPA shell that
// Vercel can serve directly without a Node server.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: {
      enabled: true,
      // Emit dist/client/index.html so Vercel serves it automatically at "/".
      prerender: { outputPath: "/index" },
    },
  },
});
