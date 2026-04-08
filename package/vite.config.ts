import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    include: ["src/**/*.test.ts"],
  },
  pack: {
    entry: {
      "tw-plugin": "./src/tw-plugin.ts",
      "tw-merge-cfg": "./src/tw-merge-cfg.ts",
    },
    format: "esm",
    dts: true,
  },
  run: {
    tasks: {
      "test:plugin": {
        command: "vp test run tw-plugin",
      },
      "test:css": {
        command: "vp test run squircle-css",
        dependsOn: ["build"],
      },
      test: {
        command: "echo 'All tests passed'",
        dependsOn: ["test:plugin", "test:css"],
      },
      build: {
        command: "vp pack && tsx scripts/generate-squircle-css.ts",
      },
    },
  },
});
