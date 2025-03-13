import path from "path";
import type { UserConfig, ConfigEnv } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { pluginExposeRenderer } from "./vite.base.config.mts";

// https://vitejs.dev/config
export default defineConfig(env => {
  const forgeEnv = env as ConfigEnv<"renderer">;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? "";

  return {
    root,
    mode,
    build: {
      outDir: `.vite/renderer/${name}`,
      rollupOptions: {
        input: {
          main_window: "src/renderer/index.html",
        },
      },
    },
    plugins: [
      pluginExposeRenderer(name),
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      tailwindcss(),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  } satisfies UserConfig;
});
