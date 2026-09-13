# Roadmap

This roadmap only lists work already described in the repository documentation. There are no committed dates.

Status values:

| Status | Meaning |
|--------|---------|
| Planned | Specified, not started in this tree |
| In progress | Active implementation in the repository |
| Completed | Landed and documented as done |

Application code is not present, so implementation items remain **Planned**.

## Specifications

| Item | Status | Source |
|------|--------|--------|
| PRD, journeys, FRs, NFRs | Completed (Draft v1) | [`docs/product/`](docs/product/01-prd-master.md) |
| Architecture 01–11 | Completed (Draft v1) | [`docs/architecture/`](docs/architecture/11-frontend-first-project-setup.md) |
| Epics and milestones document | Planned | Named as next spec in [Architecture 10](docs/architecture/10-ci-cd-quality-gates.md) (`11-epics-and-milestones.md`) |
| Stories / goal files | Planned | [PRD](docs/product/01-prd-master.md), [Architecture 11](docs/architecture/11-frontend-first-project-setup.md) |

Folders mentioned as future docs (`docs/ux/`, `docs/data/`, `docs/security/`, `docs/engineering/`) are **not** created yet; equivalent material currently lives under `docs/architecture/`.

## Phase 1 — Product / frontend

Frontend-first, mocks only. See [Architecture 11](docs/architecture/11-frontend-first-project-setup.md).

| Milestone | Status |
|-----------|--------|
| M00 — Frontend Foundation | Planned |
| M01 — Movies | Planned |
| M02 — Series | Planned |
| M03 — Home | Planned |
| M04 — Content Details | Planned |
| M05 — Player UX | Planned |
| M06 — Downloads UX | Planned |
| M07 — Shared Libraries UX | Planned |
| M08 — Settings | Planned |

M00 is specified to deliver an Electron shell, React renderer, routing, layout, design tokens, component library, gamepad navigation, mock layer, frontend tests, and basic CI — without real torrent, playback, database, or remote APIs.

## Phase 2 — Application layer

Planned after the main UX is validated:

- Core / persistence (SQLite when data must survive restart)
- Real metadata provider behind the existing `MetadataProvider` interface
- Application contracts between layers that actually exist

## Phase 3 — Runtime

Planned after application contracts are in place:

- `torrentd` / libtorrent
- MPV adapter
- Health engine and source selection
- Sunshine integration
- Optional remote library registry

## Delivery (target)

Described in [Architecture 10](docs/architecture/10-ci-cd-quality-gates.md); not implemented:

- GitHub Actions PR / main / nightly / release workflows
- Quality gates (format, lint, typecheck, tests, contracts, security)
- Windows x64 official build
- Canary → Beta → Stable promotion of a single artifact
