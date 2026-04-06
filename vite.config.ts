import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [    tailwindcss(),
  ],
  run: {
    tasks: {
      build: {
        command: "vp pack && cp src/squircle-radius.css dist/squircle-radius.css",
        dependsOn: ["generate:css", "lint", "fmt:check"],
      },
      "build:site": {
        command: "vite build docs",
        dependsOn: ["build"],
      },
      lint: {
        command: "vp lint",
      },
      "lint:fix": {
        command: "vp lint --fix",
      },
      fmt: {
        command: "vp fmt",
      },
      "fmt:check": {
        command: "vp fmt --check",
      },
      "fix-all": {
        command: "echo 'Fixing all issues...'",
        dependsOn: ["lint:fix", "fmt:check"],
      },
      "generate:css": {
        command: "tsx scripts/generate-squircle-css.ts",
      },
      "sync-readme": {
        command: "./scripts/sync-readme.sh",
        dependsOn: ["build"],
      },
      test: {
        command: "vp test",
        dependsOn: ["generate:css"],
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
  pack: {
    entry: {
      plugin: "./src/plugin.ts",
      merge: "./src/merge.ts",
    },
    format: "esm",
    dts: true,
  },
  staged: {
    "*": "vp check --fix",
  },
});
