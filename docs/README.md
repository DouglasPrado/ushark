# Documentation

TorrentStream / ushark documentation index.

All product and architecture documents below are **Draft v1** unless a document says otherwise.

## Product

| Document | Description |
|----------|-------------|
| [PRD master](product/01-prd-master.md) | Vision, principles, scope, and product rules |
| [User journeys](product/02-user-journeys.md) | End-to-end user flows |
| [Functional requirements](product/03-functional-requirements.md) | Traceable FRs (`FR-XXX`) |
| [Non-functional requirements](product/04-non-functional-requirements.md) | Traceable NFRs (`NFR-XXX`) |

## Architecture

| Document | Description |
|----------|-------------|
| [01 — Library Manifest](architecture/01-library-manifest.md) | Declarative shared-library format |
| [02 — Torrent streaming engine](architecture/02-torrent-streaming-engine.md) | Piece scheduler, cache, streaming |
| [03 — Health score and source selection](architecture/03-health-score-source-selection.md) | Streaming readiness and source choice |
| [04 — Playback, MPV, Sunshine](architecture/04-playback-mpv-sunshine.md) | Player and TV presentation |
| [05 — Shared libraries and sync](architecture/05-shared-libraries-sync.md) | Import, versions, subscriptions |
| [06 — Data model](architecture/06-data-model.md) | Local persistence model |
| [07 — IPC contracts](architecture/07-ipc-contracts.md) | Process and module contracts |
| [09 — UX and navigation](architecture/09-ux-navigation-spec.md) | Focus, gamepad, screens |

## Development

| Document | Description |
|----------|-------------|
| [11 — Frontend-first project setup](architecture/11-frontend-first-project-setup.md) | Initial stack, monorepo layout, mock-first rules |
| [Contributing](../CONTRIBUTING.md) | Branches, PRs, quality expectations |
| [Agent conventions](../AGENTS.md) | GOAL/STATE and frontend-guided milestone rules for coding agents |

## Security

| Document | Description |
|----------|-------------|
| [08 — Security model](architecture/08-security-model.md) | Trust boundaries, manifests, IPC, Electron hardening |
| [Security policy](../SECURITY.md) | How to report vulnerabilities |

## CI/CD

| Document | Description |
|----------|-------------|
| [10 — CI/CD and quality gates](architecture/10-ci-cd-quality-gates.md) | Target pipelines, anti-drift, release channels |

There are no GitHub Actions workflow files in the repository yet.

## Milestones

There is no `docs/milestones/` tree yet.

Phase and milestone names (M00–M08, then application and runtime phases) are listed in:

- [Frontend-first setup](architecture/11-frontend-first-project-setup.md)
- [Roadmap](../ROADMAP.md)

The CI document names a follow-up spec `11-epics-and-milestones.md`, which has not been written.

## Community

- [README](../README.md)
- [Support](../SUPPORT.md)
- [Changelog](../CHANGELOG.md)
- [Code of conduct](../CODE_OF_CONDUCT.md)
- [License](../LICENSE)
