# Ushark — Architecture 11: Frontend-First Project Setup

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Engineering / Project Foundation  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`
- `docs/architecture/02-torrent-streaming-engine.md`
- `docs/architecture/03-health-score-source-selection.md`
- `docs/architecture/04-playback-mpv-sunshine.md`
- `docs/architecture/05-shared-libraries-sync.md`
- `docs/architecture/06-data-model.md`
- `docs/architecture/07-ipc-contracts.md`
- `docs/architecture/08-security-model.md`
- `docs/architecture/09-ux-navigation-spec.md`
- `docs/architecture/10-ci-cd-quality-gates.md`

---

# 1. Objetivo

Este documento define como o projeto Ushark deve ser iniciado e estruturado respeitando sua regra principal de desenvolvimento:

> **O produto será guiado pelo frontend.**

O setup inicial deve ser propositalmente simples.

Ele não deve antecipar infraestrutura, runtimes ou integrações que ainda não são necessárias para validar a experiência.

A arquitetura completa continua definida nos documentos anteriores, mas sua implementação será progressiva.

---

# 2. Regra central

> **Não implementar infraestrutura antes de existir uma necessidade concreta derivada de uma interface e fluxo aprovados.**

Em outras palavras:

```text
UX
↓
Frontend
↓
Fluxo
↓
Validação
↓
Contrato necessário
↓
Implementação real
```

E não:

```text
Infraestrutura
↓
Backend
↓
Runtime
↓
Frontend
```

---

# 3. O que o setup inicial deve entregar

O setup inicial deve conter apenas o necessário para construir e validar o produto visualmente.

Stack inicial:

```text
Electron
React
TypeScript
Vite
Tailwind
shadcn/ui
pnpm
Turborepo
```

Além disso:

```text
routing
layout
design system
gamepad navigation
mock data layer
frontend tests
CI básico
```

---

# 4. O que NÃO entra no setup inicial

Não implementar ainda:

```text
torrentd
libtorrent
SQLite
Drizzle
MPV
FFmpeg
ffprobe
Named Pipes
RPC
resume data
real metadata provider
real torrent health
real source selection
Sunshine integration
remote library registry
```

Esses componentes continuam planejados e documentados, porém serão adicionados apenas quando a interface correspondente já existir e estiver validada.

---

# 5. Motivação

Começar por infraestrutura criaria um fluxo como:

```text
libtorrent
↓
MPV
↓
database
↓
RPC
↓
frontend
```

Isso atrasaria a capacidade de testar:

- usabilidade;
- fluxo;
- navegação;
- organização;
- experiência de TV;
- telas;
- comportamento do produto.

O modelo correto é:

```text
Frontend
↓
Produto navegável
↓
UX validada
↓
Integrações reais
```

---

# 6. Estrutura inicial do monorepo

```text
ushark/
│
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── main/
│       │   ├── preload/
│       │   └── renderer/
│       │
│       └── package.json
│
├── packages/
│   ├── ui/
│   ├── mocks/
│   └── types/
│
├── docs/
│
├── tests/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

# 7. apps/desktop

Responsável pelo aplicativo Electron.

Estrutura:

```text
apps/desktop/src/
├── main/
├── preload/
└── renderer/
```

---

# 8. renderer

Responsável por:

- telas;
- componentes;
- navegação;
- estados visuais;
- gamepad;
- mocks;
- interação.

Stack:

```text
React
TypeScript
Tailwind
shadcn/ui
```

---

# 9. main

No setup inicial, o Electron main deve fazer apenas:

```text
criar janela
gerenciar fullscreen
TV mode básico
lifecycle da aplicação
```

Não deve conter ainda:

```text
torrent engine
database
player
domain rules
```

---

# 10. preload

Deve expor API mínima.

Inicialmente pode ser quase vazio.

Regra:

```text
renderer
≠
Node.js unrestricted access
```

---

# 11. packages/ui

Deve conter componentes reutilizáveis:

```text
Button
Card
PosterCard
Hero
Modal
Dialog
Toast
Tabs
Navigation
HealthBars
ProgressBar
FocusRing
```

---

# 12. packages/types

Contém modelos mínimos necessários para o frontend.

Exemplo:

```ts
interface Movie {
  id: string;
  title: string;
  year?: number;
  poster?: string;
  backdrop?: string;
  description?: string;
}
```

---

# 13. Tipos mínimos

Os tipos iniciais devem representar apenas o que a UI precisa.

Não modelar prematuramente:

```text
torrent internals
RPC details
database tables
libtorrent structures
```

---

# 14. packages/mocks

Responsável por simular todo o backend.

Estrutura:

```text
packages/mocks/
├── data/
├── services/
└── scenarios/
```

---

# 15. Mock-first

Toda feature deve poder funcionar inicialmente com dados mockados.

Exemplo:

```text
Movie Registration
↓
MockMetadataService
↓
MockTorrentService
```

---

# 16. Interface de serviço local

Mesmo com mocks, usar interfaces simples.

Exemplo:

```ts
interface MovieService {
  search(query: string): Promise<MovieSearchResult[]>;
  create(input: CreateMovieInput): Promise<Movie>;
}
```

---

# 17. Implementação mock

```ts
class MockMovieService implements MovieService {
  // retorna fixtures
}
```

---

# 18. Metadata Mock

Busca:

```text
Duna
```

pode retornar:

```text
Duna
Duna: Parte Dois
Duna (1984)
```

com:

- poster;
- year;
- synopsis;
- IDs;
- genres.

---

# 19. Torrent Mock

Interface conceitual:

```ts
interface TorrentSourceService {
  inspect(input: TorrentInput): Promise<TorrentSourcePreview>;
}
```

Mock pode retornar:

```text
Dune.Part.Two.2024.2160p.HEVC
28.4 GB
4K HEVC
█████ Excelente
12 peers
```

---

# 20. Health Mock

Health deve existir desde cedo visualmente.

Exemplo:

```ts
{
  score: 92,
  bars: 5,
  label: "Excelente",
  startupEstimateMs: 1200
}
```

Isso permite validar o produto sem Health Engine real.

---

# 21. Player Mock

A UI de Player deve funcionar sem MPV.

Interface:

```ts
interface PlayerService {
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(position: number): Promise<void>;
  stop(): Promise<void>;
}
```

Mock simula:

```text
playing
paused
buffering
ended
```

---

# 22. Downloads Mock

Tela de Downloads deve poder mostrar:

```text
active
paused
completed
error
```

sem download real.

---

# 23. Shared Libraries Mock

Shared Libraries devem usar fixtures locais.

Exemplo:

```text
Compartilhado por Douglas
```

com:

- hero;
- sections;
- contents;
- sources;
- author;
- version.

---

# 24. Cenários de mock

Mocks não devem representar apenas happy path.

Criar cenários:

```text
normal
empty
loading
offline
error
slow source
no peers
invalid source
large library
```

---

# 25. Scenario Switcher

Em desenvolvimento, pode existir opção:

```text
?scenario=no-peers
```

ou configuração dev equivalente.

---

# 26. Frontend deve ser testável sozinho

O desenvolvedor deve conseguir executar:

```text
pnpm dev
```

e navegar pelo produto sem:

```text
MPV
libtorrent
SQLite
Internet
Sunshine
```

---

# 27. Objetivo da primeira fase

Chegar a um aplicativo inteiramente navegável.

Fluxo esperado:

```text
Home
↓
Movies
↓
Create Movie
↓
Details
↓
Play
↓
Player
↓
Seek
↓
Back
```

Tudo usando mocks.

---

# 28. Fase 1 — Product / Frontend

Milestones focados exclusivamente em experiência.

Exemplo:

```text
M00 — Frontend Foundation
M01 — Movies
M02 — Series
M03 — Home
M04 — Content Details
M05 — Player UX
M06 — Downloads UX
M07 — Shared Libraries UX
M08 — Settings
```

---

# 29. M00 — Frontend Foundation

Deve entregar:

```text
Electron shell
React renderer
routing
layout
design tokens
component library
gamepad navigation
mock layer
frontend tests
basic CI
```

---

# 30. O que M00 não entrega

Não entrega:

```text
real torrent
real playback
database
remote APIs
```

---

# 31. M01 — Movies

Exemplo de Stories:

```text
Movies List
Create Movie Screen
Metadata Search Mock
Torrent Input Mock
Source Preview
Save Mock
Movie Details
```

---

# 32. Cadastro de filme

Fluxo desejado:

```text
Movies
↓
Add Movie
↓
Search by title
↓
Select metadata result
↓
Add magnet/.torrent
↓
Preview source
↓
Save
↓
Details
```

---

# 33. Regra de metadata

A UI não deve ser acoplada a:

```text
IMDb
```

ou:

```text
TMDB
```

Ela deve trabalhar com:

```text
MetadataProvider
```

---

# 34. Texto da UI

Preferir:

```text
Buscar filme
```

em vez de:

```text
Buscar IMDb
```

O provider real será decidido posteriormente.

---

# 35. Fase 2 — Application Layer

Somente após UX principal estar validada.

Adicionar progressivamente:

```text
Core
Persistence
Real Metadata Provider
Application Contracts
```

---

# 36. Entrada do Core

Core entra quando a UI já exigir comportamento persistente real.

Exemplo:

```text
Create Movie Mock
↓
UX approved
↓
MovieService real
```

---

# 37. Persistence

SQLite só entra quando:

```text
dados precisam sobreviver restart
```

e o fluxo correspondente já está aprovado.

---

# 38. Metadata Provider Real

Substituição:

```text
MockMetadataProvider
↓
TMDBMetadataProvider
```

ou outro provider.

A UI não deve mudar.

---

# 39. Contracts

Contratos formais entram quando duas camadas reais precisam se comunicar.

Exemplo:

```text
Core
↔
torrentd
```

Antes disso, interfaces TypeScript locais são suficientes.

---

# 40. Fase 3 — Runtime

Depois:

```text
torrentd
libtorrent
MPV
Health Engine
Source Selection
Sunshine integration
```

---

# 41. Fake → Real Adapter Pattern

Toda integração segue:

```text
Interface
├── Mock Implementation
└── Real Implementation
```

---

# 42. Torrent Adapter

```text
TorrentSourceService
├── MockTorrentSourceService
└── RpcTorrentSourceService
```

---

# 43. Player Adapter

```text
PlayerService
├── MockPlayerService
└── MpvPlayerService
```

---

# 44. Metadata Adapter

```text
MetadataProvider
├── MockMetadataProvider
└── TmdbMetadataProvider
```

---

# 45. Repository Adapter

```text
MovieRepository
├── MemoryMovieRepository
└── SQLiteMovieRepository
```

---

# 46. Vantagem principal

A substituição deve acontecer sem redesenhar UI.

Exemplo:

```text
MockMovieRepository
↓
SQLiteMovieRepository
```

não deve exigir alteração dos componentes React.

---

# 47. Progressive Architecture

A arquitetura deve crescer conforme o produto exige.

Não criar pacote só porque ele aparece em um diagrama futuro.

---

# 48. Regra de criação de package

Criar package quando:

```text
existe responsabilidade clara
+
existe mais de um consumidor
ou
isolamento é tecnicamente necessário
```

---

# 49. Evitar overengineering

Não criar antecipadamente:

```text
20 packages
10 abstractions
complex DI container
plugin system
event sourcing
microservices
```

---

# 50. CI inicial

No M00, CI deve executar apenas:

```text
format
lint
typecheck
unit tests
frontend build
```

---

# 51. CI evolutivo

Quando database entrar:

```text
+ migration tests
```

Quando torrentd entrar:

```text
+ Rust checks
+ RPC contracts
+ native build
```

Quando MPV entrar:

```text
+ player integration tests
```

Quando release entrar:

```text
+ code signing
+ SBOM
+ Canary/Beta/Stable
```

---

# 52. Documento CI/CD

`10-ci-cd-quality-gates.md` representa o estado final desejado.

Este documento define:

```text
quando cada gate passa a ser necessário
```

---

# 53. Gamepad desde o começo

Gamepad navigation não deve ser deixada para depois.

Deve fazer parte do frontend foundation.

---

# 54. Motivo

Se a UI for construída primeiro para mouse:

```text
TV navigation
```

pode exigir redesenho estrutural posterior.

---

# 55. Focus System

M00 deve incluir:

```text
focus management
spatial navigation
focus restoration
modal focus trap
```

---

# 56. TV Testing

Mesmo com mocks, o app deve poder ser aberto via Sunshine/Moonlight cedo.

Objetivo:

```text
testar experiência
```

não integração final.

---

# 57. Sunshine no início

Não precisa existir automação de Sunshine.

Pode simplesmente iniciar o Electron manualmente e streamar o desktop/app.

---

# 58. TV mode inicial

Pode existir:

```text
--tv
```

apenas para:

```text
fullscreen
hide chrome
controller-first layout
```

---

# 59. Design System

Deve nascer no M00.

Tokens:

```text
spacing
typography
radius
focus
elevation
motion
```

---

# 60. UI States

Todo componente importante deve suportar:

```text
default
focused
hovered
disabled
loading
error
empty
```

---

# 61. Component Storybook

Opcional.

Não obrigatório para iniciar.

Pode ser introduzido se ajudar a controlar design system.

---

# 62. Testing Strategy Inicial

Frontend:

```text
unit
component
interaction
basic E2E
```

---

# 63. Testes essenciais

Cobrir cedo:

```text
focus navigation
modal behavior
form validation
route restoration
gamepad actions
```

---

# 64. Não testar backend inexistente

Não criar testes fictícios para:

```text
libtorrent
MPV
database
```

antes de existirem.

---

# 65. Documentação como contrato futuro

As specs existentes definem:

```text
destination architecture
```

Não significam:

```text
implement everything immediately
```

---

# 66. Regra de derivação de infraestrutura

Toda infraestrutura deve responder a uma necessidade existente.

Exemplo:

```text
UI precisa salvar Movie
↓
Persistence necessária
↓
SQLite entra
```

---

# 67. Outro exemplo

```text
UI precisa tocar vídeo
↓
Player contract já validado
↓
MPV entra
```

---

# 68. Outro exemplo

```text
UI precisa medir source real
↓
Health mock já aprovado
↓
torrentd + Health Engine entram
```

---

# 69. Frontend Approval Gate

Cada feature passa por:

```text
UI mock
↓
usability validation
↓
approval
```

antes da integração real.

---

# 70. Story Order dentro de feature

Exemplo:

```text
Story 1
Screen Mock

Story 2
Navigation

Story 3
Validation

Story 4
Mock Service

Story 5
Error/Loading States

--- UX APPROVED ---

Story 6
Real Data

Story 7
Persistence

Story 8
Runtime Integration

Story 9
E2E
```

---

# 71. Milestone Update

Ao atualizar milestone, registrar:

```text
Frontend status
UX validation
Integration status
Remaining real adapters
```

---

# 72. Milestone Progress

Exemplo:

```text
Frontend         100%
UX Approved      YES
Application       40%
Runtime             0%
E2E                20%
```

---

# 73. Não confundir visual complete com feature complete

Pode existir:

```text
UI DONE
```

sem:

```text
FEATURE DONE
```

---

# 74. Estados de Story

Exemplo:

```text
PLANNED
FRONTEND
UX_REVIEW
APPROVED
INTEGRATION
QUALITY_GATE
DONE
```

---

# 75. Definition of Frontend Done

Frontend está pronto quando:

- fluxo navegável;
- loading;
- empty;
- error;
- keyboard/gamepad;
- responsive TV layout;
- mock scenarios;
- acceptance visual aprovada.

---

# 76. Definition of Feature Done

Feature completa quando:

```text
Frontend Done
+
Real Integration
+
Persistence if needed
+
Tests
+
CI Green
```

---

# 77. Regra para Claude Code

Claude deve implementar apenas a fase atual da Story.

Se Story é frontend:

```text
não implementar backend real
```

---

# 78. Proibição explícita para agentes

Durante stories frontend-first, agentes não devem adicionar:

```text
database
API real
torrent engine
MPV
RPC
```

sem a Story pedir explicitamente.

---

# 79. Goal File

Goal de milestone deve dizer:

```text
This milestone is frontend-first.
Do not implement real infrastructure unless explicitly requested by a Story.
Use mocks for unavailable integrations.
```

---

# 80. Mock Consistency

Mocks devem refletir contratos previstos suficientemente para não criar UX impossível.

Mas não precisam antecipar detalhes técnicos internos.

---

# 81. Mock Realism

Dados devem parecer reais.

Exemplo:

```text
4K HEVC
28.4 GB
Health Excelente
Pronto em ~1s
```

em vez de:

```text
Test Movie
Fake Data
```

---

# 82. Fixtures

Manter dados realistas e neutros.

---

# 83. UX Regression

Depois de aprovada, integração real não deve mudar UX arbitrariamente.

Se a implementação técnica exigir mudança:

```text
voltar para UX review
```

---

# 84. Technical Constraint Feedback

Fluxo:

```text
Frontend approved
↓
Integration discovers constraint
↓
document constraint
↓
UX review
↓
adjust deliberately
```

Nunca ajustar silenciosamente.

---

# 85. Architecture Evolution

Estrutura futura pode crescer para:

```text
packages/
├── core/
├── domain/
├── database/
├── contracts/
├── health/
└── source-selection/

apps/
├── desktop/
└── torrentd/
```

Mas apenas no momento necessário.

---

# 86. Target Architecture ≠ Initial Architecture

Arquitetura inicial:

```text
desktop
ui
mocks
types
```

Arquitetura alvo:

```text
desktop
core
domain
database
contracts
torrentd
player
health
sharing
```

---

# 87. Vantagem para agentes

Estrutura frontend-first deixa tarefas menores e verificáveis.

Claude consegue trabalhar em:

```text
uma tela
um fluxo
um componente
```

sem precisar entender todo runtime.

---

# 88. Vantagem para revisão humana

Você consegue abrir o app e verificar:

```text
faz sentido?
está rápido?
navegação está boa?
essa tela precisa mudar?
```

antes do custo técnico maior.

---

# 89. Vantagem para arquitetura

Integrações reais são derivadas de necessidades comprovadas.

Isso reduz:

```text
unused abstractions
wrong APIs
premature database models
runtime redesign
```

---

# 90. Vantagem para CI

Quality gates crescem junto com a complexidade real do projeto.

---

# 91. Setup Inicial — Checklist

```text
pnpm workspace
Turborepo
Electron
React
Vite
TypeScript strict
Tailwind
shadcn/ui
routing
design tokens
focus system
gamepad input
mocks
fixtures
frontend tests
basic CI
```

---

# 92. Setup Inicial — Não Fazer

```text
libtorrent binding
torrent daemon
SQLite migrations
MPV adapter
FFmpeg integration
RPC schema generation
remote registry
release signing
```

---

# 93. M00 Acceptance Criteria

M00 está concluído quando:

1. aplicativo Electron inicia;
2. renderer React funciona;
3. routing funciona;
4. layout base existe;
5. gamepad navega;
6. foco é visível;
7. mocks podem ser injetados;
8. telas podem usar fixtures;
9. frontend tests funcionam;
10. CI básico bloqueia regressões;
11. TV mode fullscreen básico funciona;
12. nenhum runtime complexo foi implementado prematuramente.

---

# 94. Architecture Gate

Antes de adicionar nova infraestrutura, responder:

```text
Qual fluxo aprovado exige isso?
```

Se não houver resposta clara:

```text
não implementar ainda
```

---

# 95. Exemplo correto

```text
Movie registration aprovado
↓
precisamos persistir movies
↓
SQLite entra
```

---

# 96. Exemplo incorreto

```text
Vamos instalar SQLite
porque provavelmente vamos precisar depois
```

---

# 97. Exemplo correto — Torrent

```text
Source UI aprovada
↓
MockTorrentSourceService validado
↓
precisamos dados reais
↓
torrentd entra
```

---

# 98. Exemplo incorreto — Torrent

```text
Vamos resolver libtorrent antes de construir a tela
```

---

# 99. Exemplo correto — Player

```text
Player UX aprovado
↓
MockPlayer funciona
↓
precisamos playback real
↓
MPV entra
```

---

# 100. Documentação oficial de implementação

A ordem passa a ser:

```text
Product Docs
↓
Architecture Target Docs
↓
Frontend-First Setup
↓
Epics
↓
Milestones
↓
Frontend Stories
↓
UX Approval
↓
Integration Stories
↓
Runtime Stories
↓
Quality Gates
```

---

# 101. Regra final

> **Primeiro provar a experiência. Depois implementar a complexidade necessária para sustentá-la. Nunca inverter essa ordem sem uma razão técnica concreta.**
