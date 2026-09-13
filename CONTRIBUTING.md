# Contributing

Thank you for contributing to ushark / Ushark.

This repository is specification-first. Application code is not present yet. Read [README.md](README.md) and [docs/README.md](docs/README.md) before opening a pull request.

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## How to report problems

| Kind | Where |
|------|--------|
| Bug in docs or (later) the app | GitHub Issue using the bug template |
| Feature / spec change | GitHub Issue using the feature template |
| Usage question | See [SUPPORT.md](SUPPORT.md) |
| Vulnerability | [SECURITY.md](SECURITY.md) only |

Do not paste secrets, tokens, magnets with private trackers, or personal paths into issues.

## Local setup

### Specifications only (current)

```bash
git clone https://github.com/DouglasPrado/ushark.git
cd ushark
```

Edit Markdown under `docs/` with relative links.

### Application workspace (when it exists)

The documented setup is a pnpm + Turborepo Electron app. Follow [Frontend-First Project Setup](docs/architecture/11-frontend-first-project-setup.md). Expected commands after `package.json` lands (do not run them against this tree today):

```bash
pnpm install
pnpm dev
```

Do not add libtorrent, SQLite, MPV, or RPC in a frontend-only story unless that story asks for them.

## Branching

Permanent branch: `main`.

Temporary branches, as specified in [CI/CD & Quality Gates](docs/architecture/10-ci-cd-quality-gates.md):

```text
feature/<short-name>
fix/<short-name>
refactor/<short-name>
chore/<short-name>
```

Do not push directly to `main` once branch protection is enabled.

## Commits

Write clear, scoped commit messages that explain why the change exists.

The CI specification lists Conventional Commits as one possible input for changelog generation. There is **no** commit linter in this repository yet. Do not invent extra commit ceremony; keep messages readable. Squash merge is the documented preference so one story maps to one commit on `main`.

## Quality checks

### Today (documentation)

Before opening a PR:

- [ ] Statements match existing docs; do not invent product claims
- [ ] Relative links resolve
- [ ] No secrets, credentials, or private URLs
- [ ] Related documents stay consistent (product name, commands, paths)

There are no `lint`, `typecheck`, or `test` scripts to run.

### After the application workspace exists

The documented local gate is:

```bash
pnpm quality
```

which is specified to include at least:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm contracts:check
```

CI is specified to **validate**, not auto-fix format. Required PR checks will grow with the stack (migrations, Rust `cargo fmt`/`clippy`/`test`, Windows packaged smoke, etc.). See [Architecture 10](docs/architecture/10-ci-cd-quality-gates.md).

Do not delete failing tests, disable required checks, or weaken baselines to get a green build.

## Pull requests

1. Open a branch from an up-to-date `main`.
2. Keep the PR scoped (prefer one story / one concern).
3. Use [the PR template](.github/PULL_REQUEST_TEMPLATE.md).
4. When application stories exist, the CI spec asks PRs to cite Milestone, Story, FR, and NFR IDs.

Example from the spec:

```text
Story: MOVIE-003
FR: FR-009, FR-028
NFR: NFR-009, NFR-137
```

## Quality expectations

- Specs stay declarative and internally consistent.
- Untrusted input (manifests, torrents, deep links) never gains code execution. See [Security Model](docs/architecture/08-security-model.md).
- Frontend stories must be navigable with mocks, including empty/loading/error states and gamepad focus.
- A feature is not done when the UI looks complete; it is done when the documented quality gate is green and the story is merged. Agents and authors must not self-declare DONE past that gate.

## Adding features

1. Check whether the behavior is already specified in product/architecture docs.
2. If the change is a spec gap, update the relevant FR/NFR/architecture document in the same PR when possible.
3. Implement frontend-first with mocks; replace adapters only after UX approval, as in Architecture 11.
4. Add tests for the layer that actually exists.
5. Update [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]` if the change is user-visible or a documented contract change.

## Agent-assisted work

[AGENTS.md](AGENTS.md) records conventions for coding agents (GOAL/STATE, one story at a time, frontend-first lifecycle). Human contributors do not need to use agent skills.

If you use agents, do not let them skip quality gates, invent product claims, or commit secrets.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
