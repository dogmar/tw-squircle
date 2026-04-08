# CI Auto-Publish with semantic-release

## Overview

Automated package publishing for `@klinking/tw-squircle` using semantic-release, triggered on every push to `main`. Conventional Commits determine version bumps. PR titles are enforced to follow the convention. A separate CI workflow gates PRs with lint/test/build checks.

## Release Configuration

`.releaserc.json` at repo root. Branches: `["main"]`.

Plugins (in order):

1. `@semantic-release/commit-analyzer` — `conventionalcommits` preset, determines version bump
2. `@semantic-release/release-notes-generator` — `conventionalcommits` preset, generates changelog content
3. `@semantic-release/changelog` — writes `CHANGELOG.md` at repo root
4. `@semantic-release/npm` — `pkgRoot: "package"`, `provenance: true`; updates version in `package/package.json` and publishes
5. `@semantic-release/git` — commits `CHANGELOG.md` and `package/package.json` back to `main` with message `chore(release): ${nextRelease.version} [skip ci]`
6. `@semantic-release/github` — creates a GitHub Release with generated notes

### Build step

The `prepublishOnly` script in `package/package.json` (`vp run build`) may not work correctly when `@semantic-release/npm` runs `npm publish` from `pkgRoot`, because `vp` is a monorepo tool that expects to run from the workspace root. To avoid this, the release workflow runs the build explicitly before `npx semantic-release`:

```
vp run @klinking/tw-squircle#build
```

The `prepublishOnly` script remains in `package/package.json` for local `npm publish` use but is not relied upon in CI.

### Breaking change detection

The `conventionalcommits` preset (not `angular`) is used because it natively supports the `!` suffix for breaking changes (e.g., `feat!: remove old API`). This requires the `conventional-changelog-conventionalcommits` dependency.

### Revert commits

The `conventionalcommits` preset treats `revert` by undoing the effect of the original commit (e.g., reverting a `feat` triggers a patch). This is the desired default behavior — no custom `releaseRules` needed.

### Initial version

The current version in `package/package.json` is `0.1.0`. A `v0.1.0` git tag must be created on `main` before the first semantic-release run so it knows the starting point. Without this tag, semantic-release will treat all commits as new and may produce an unexpected version bump.

## Allowed Commit/PR Title Prefixes

| Prefix                                 | Version bump                   |
| -------------------------------------- | ------------------------------ |
| `feat`                                 | minor (0.x.0)                  |
| `feat!`, `fix!` (breaking)             | major (x.0.0)                  |
| `fix`, `perf`                          | patch (0.0.x)                  |
| `docs`, `chore`, `test`, `ci`, `style` | no release                     |
| `revert`                               | reverts original commit's bump |

`refactor` and `build` prefixes are **not allowed**.

## GitHub Actions Workflows

### `ci.yml` — PR checks

- **Trigger:** `pull_request` targeting `main`
- **Steps:** checkout, `voidzero-dev/setup-vp@v1` (node 22, cache), `vp install`, `vp ready`
- Blocks merge if checks fail

### `pr-title.yml` — PR title convention enforcement

- **Trigger:** `pull_request` (types: `opened`, `edited`, `synchronize`, `reopened`)
- **Steps:** `thehanimo/pr-title-checker` with `.github/pr-title-checker.json` config
- Regex must accept the `!` suffix: `^(feat|fix|perf|docs|chore|test|ci|style|revert)(!)?(\(.+\))?: .+`
- Rejects `refactor`, `build`, and anything else

### `release.yml` — auto-publish

- **Trigger:** `push` to `main`
- **Permissions:** `contents: write`, `issues: write`, `pull-requests: write`, `id-token: write`
- **Steps:**
  1. `actions/checkout@v4` with `persist-credentials: false`
  2. `voidzero-dev/setup-vp@v1` (node 22, cache)
  3. `vp install`
  4. `vp run @klinking/tw-squircle#build` (explicit build before release)
  5. `npx semantic-release`
- **Auth:** npm trusted publishing via OIDC (no `NPM_TOKEN` secret). `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` is set as env on the semantic-release step. semantic-release uses this token to rewrite the git remote URL for pushing (working in concert with `persist-credentials: false`) and to create GitHub Releases. `[skip ci]` in the release commit message prevents infinite workflow loops.

## PR Template

`.github/pull_request_template.md` with an HTML comment block explaining how prefixes affect releases:

- `fix:`, `perf:` = patch
- `feat:` = minor
- `feat!:`, `fix!:` = major (breaking change)
- `docs:`, `chore:`, `test:`, `ci:`, `style:`, `revert:` = no release

## New Dependencies

Root `package.json` devDependencies:

- `semantic-release`
- `@semantic-release/changelog`
- `@semantic-release/git`
- `conventional-changelog-conventionalcommits`

The `commit-analyzer`, `release-notes-generator`, `npm`, and `github` plugins ship with `semantic-release`.

## New/Modified Files

| File                               | Purpose                               |
| ---------------------------------- | ------------------------------------- |
| `.releaserc.json`                  | semantic-release config               |
| `.github/workflows/ci.yml`         | PR check workflow                     |
| `.github/workflows/pr-title.yml`   | PR title enforcement                  |
| `.github/workflows/release.yml`    | Auto-publish on push to main          |
| `.github/pr-title-checker.json`    | Config for thehanimo/pr-title-checker |
| `.github/pull_request_template.md` | PR template with prefix docs          |
| `package.json` (root)              | New devDependencies                   |

## One-Time Manual Setup

1. Create a `v0.1.0` git tag on `main` at the current release point
2. Configure npm trusted publishing on npmjs.com: link `@klinking/tw-squircle` to the `dogmar/tw-squircle` repo and `release.yml` workflow
