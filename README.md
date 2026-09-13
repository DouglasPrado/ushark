# ushark

ushark is the repository for **Ushark**: a local-first desktop media center that treats torrents as replaceable media sources, not as the identity of the content.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: draft specifications](https://img.shields.io/badge/status-draft%20specifications-lightgrey.svg)](docs/README.md)

This repository currently contains product and architecture specifications. Application source code has not been added yet.

## About

Ushark is specified as a desktop application for organizing, discovering, playing, and sharing torrent-based media libraries.

The documented product model is:

- the library belongs to the user
- `.torrent` files and magnet links are sources, not content identity
- metadata can be enriched by external providers such as TMDB
- playback happens on the local computer
- Sunshine can stream the application; Moonlight is the TV client
- shared libraries preserve curation, categories, and layout
- clients can select the most suitable available source for playback

The intended experience is: open the app, browse a visual library, select a title, and start watching before the file has finished downloading.

The software is specified as a **neutral tool**. The product documentation states compatibility with owned content, public domain, Creative Commons, and other authorized distribution. It does not assume that arbitrary content may be redistributed. See [PRD, section 71](docs/product/01-prd-master.md).

## Features

The following capabilities are specified. They are not implemented in this repository yet.

- Local library for movies, series, seasons, and episodes
- Multiple torrent sources per title, with replaceable sources
- Progressive torrent streaming with piece scheduling and seek
- Torrent health / streaming-readiness scoring before Play
- Automatic source recommendation based on quality and actual streaming capacity
- MPV-based local playback, with Sunshine/Moonlight for TV
- Gamepad / remote-first navigation
- Shared libraries via a declarative manifest, with versioning, subscription, and fork
- Local-first state: progress, favorites, and source overrides stay with the user
- Offline use of already synchronized library data

## Current Status

All product and architecture documents are marked **Draft v1**.

| Area | Status |
|------|--------|
| Product requirements | Draft specifications in [`docs/product/`](docs/product/01-prd-master.md) |
| Architecture | Draft specifications in [`docs/architecture/`](docs/architecture/11-frontend-first-project-setup.md) |
| Application code | Not present |
| Tests / CI workflows | Specified, not present |
| Releases | None |

Development order is **frontend-first**: prove UX with mocks, then add persistence, then add torrent/player runtimes. See [Frontend-First Project Setup](docs/architecture/11-frontend-first-project-setup.md).

## Architecture

Target process split (destination architecture, not the initial tree):

```text
UI  →  Core  →  torrentd / player adapters  →  MPV + Sunshine → Moonlight → TV
```

Initial implementation, when code lands, is specified as a small Electron app plus UI, mocks, and types — without libtorrent, SQLite, MPV, or RPC until a validated UI flow requires them.

Deep documentation lives under [`docs/`](docs/README.md). Do not treat architecture docs as an instruction to implement everything immediately.

## Tech Stack

**Specified for the first implementation (M00):**

| Layer | Choice |
|-------|--------|
| Desktop shell | Electron |
| UI | React, TypeScript, Vite, Tailwind, shadcn/ui |
| Workspace | pnpm, Turborepo |
| Tests (frontend) | unit / component / interaction / basic E2E |

**Specified for later phases:**

| Layer | Choice |
|-------|--------|
| Local database | SQLite |
| Torrent engine | dedicated `torrentd` process (Rust + libtorrent planned if `torrentd` is Rust) |
| Player | MPV |
| TV presentation | Sunshine + Moonlight |
| Manifest authenticity | Ed25519 (planned) |
| CI/CD | GitHub Actions, with Canary → Beta → Stable promotion |

Official initial build platform in the CI spec: **Windows x64**.

## Project Structure

```text
ushark/
├── docs/
│   ├── product/          Product requirements and journeys
│   └── architecture/     Technical specifications
├── .agents/skills/       Optional Codex skill (frontend-guided milestones)
├── .claude/skills/       Optional Claude Code skill (same method)
├── AGENTS.md             Conventions for coding agents
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── SUPPORT.md
├── CHANGELOG.md
└── ROADMAP.md
```

When implementation starts, the documented initial monorepo layout is:

```text
apps/desktop/
packages/ui/
packages/mocks/
packages/types/
docs/
tests/
.github/workflows/
```

Those application directories are not in the repository yet.

## Getting Started

### Requirements

There is no runnable application in this repository today.

To work with the specifications you need:

- Git
- a Markdown viewer or editor

When M00 (Frontend Foundation) is implemented, the documented toolchain is:

- Node.js (version will be pinned in the repo, e.g. `.node-version`)
- pnpm (via `packageManager` in the root `package.json`)
- Windows x64 for the official packaged build described in the CI spec

### Installation

```bash
git clone https://github.com/DouglasPrado/ushark.git
cd ushark
```

There is nothing to install beyond Git until application packages exist.

### Running locally

Not applicable. No `package.json` or application entrypoint exists yet.

The specified first developer command, once the frontend workspace exists, is:

```bash
pnpm dev
```

That command is documented as starting the Electron/React app against mocks, without MPV, libtorrent, SQLite, internet, or Sunshine.

### Development mode

See [Frontend-First Project Setup](docs/architecture/11-frontend-first-project-setup.md). Rules that will apply once code exists:

- features start on mocks
- renderer must not get unrestricted Node access
- gamepad navigation is part of the foundation, not a later add-on
- `pnpm dev --tv` opens the mock preview fullscreen (simple fullscreen on macOS); physical controller and Windows/TV validation remain pending

Human contributors can ignore agent skill packs. Optional agent workflow is described in [AGENTS.md](AGENTS.md).

### Build

Not applicable until the workspace exists.

The CI specification plans `pnpm` scripts such as `format:check`, `lint`, `typecheck`, `quality`, and later native/Rust checks. Those scripts are not defined in the repository yet.

### Tests

Not applicable. No test runner is configured.

Planned early tests cover focus navigation, modal behavior, form validation, route restoration, and gamepad actions — not libtorrent/MPV/database until those components exist.

## Configuration

No runtime configuration files are required to read this repository.

Planned configuration (cache location, retention, quality preferences, Sunshine app registration) is described in the product and architecture docs and will ship with `.env.example` when the app needs environment variables.

## Environment Variables

None are used by the current tree.

Future variables (for example a TMDB API key or a registry token) must not be committed. Secrets belong in OS secure storage or CI environments, as described in [Security Model](docs/architecture/08-security-model.md).

## Documentation

Start here: [Documentation index](docs/README.md)

| Area | Entry point |
|------|-------------|
| Product | [PRD](docs/product/01-prd-master.md) |
| Architecture overview | [Frontend-First Setup](docs/architecture/11-frontend-first-project-setup.md) |
| Security | [Security Model](docs/architecture/08-security-model.md) |
| CI/CD (target) | [CI/CD & Quality Gates](docs/architecture/10-ci-cd-quality-gates.md) |
| Roadmap | [ROADMAP.md](ROADMAP.md) |

## Roadmap

See [ROADMAP.md](ROADMAP.md). High-level phases already documented:

1. **Frontend (M00–M08)** — navigable Electron app on mocks
2. **Application layer** — persistence, real metadata provider, contracts
3. **Runtime** — `torrentd`, MPV, health engine, Sunshine integration

A [vertical milestone plan](docs/milestones/PLAN.md) and [coverage matrix](docs/milestones/REQUIREMENTS_COVERAGE.md) have been approved. Its IDs differ from the earlier frontend examples above. M01 stories are prepared; application code has not been written.

## Contributing

Contributions are welcome once you have read the [code of conduct](CODE_OF_CONDUCT.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

Until application code exists, the most useful contributions are specification fixes, clarifications, and missing cross-links — not premature infrastructure.

## Security

Do not file critical vulnerabilities as public issues. See [SECURITY.md](SECURITY.md) and [Architecture 08](docs/architecture/08-security-model.md).

## License

[MIT](LICENSE)
