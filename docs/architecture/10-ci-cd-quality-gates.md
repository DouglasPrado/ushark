# Ushark — Architecture 10: CI/CD, Quality Gates & Anti-Drift

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Engineering / Delivery Architecture  
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

---

# 1. Objetivo

Este documento define a arquitetura de CI/CD, Quality Gates, release e proteção contra drift do Ushark.

O pipeline não deve existir apenas para:

```text
build
↓
release
```

Ele deve funcionar como um sistema automatizado de garantia de qualidade:

```text
Code
↓
Validation
↓
Quality Gates
↓
Artifact
↓
Promotion
↓
Release
```

Nenhuma alteração deve chegar à `main` ou a uma release sem comprovar:

- compilação;
- tipagem;
- qualidade;
- testes;
- compatibilidade;
- integridade de migrations;
- compatibilidade de contratos;
- segurança;
- ausência de drift;
- performance aceitável.

---

# 2. Regra central

> **Nenhum desenvolvedor ou agente declara uma Story concluída. O Quality Gate transforma uma Story em DONE.**

Isso se aplica a:

```text
Developer
Claude Code
Codex
Devflow
qualquer automação futura
```

---

# 3. Tipos de drift que o pipeline deve impedir

```text
Code Drift
Dependency Drift
Toolchain Drift
Contract Drift
Database Drift
Manifest Drift
Native Binary Drift
Architecture Drift
Security Drift
Performance Drift
Release Drift
Infrastructure Drift
```

---

# 4. Stack de CI/CD

Planejamento principal:

```text
GitHub Actions
GitHub Rulesets
GitHub Environments
```

Artifact Attestations devem ser utilizadas quando disponíveis para o repositório/plano em uso.

---

# 5. Branch Strategy

Branches permanentes:

```text
main
```

Branches temporárias:

```text
feature/*
fix/*
refactor/*
chore/*
```

Evitar `develop` permanente sem necessidade comprovada.

---

# 6. Proteção da main

`main` representa:

```text
código integrado
+
quality gates verdes
+
estado potencialmente releasable
```

Regras:

```text
push direto proibido
force push proibido
merge somente via PR
required status checks
branch atualizada antes do merge
```

---

# 7. Estratégia de merge

Preferência:

```text
Squash Merge
```

Objetivo:

```text
1 Story / PR
≈
1 commit na main
```

Isso melhora:

- rollback;
- changelog;
- auditoria;
- `git bisect`;
- rastreabilidade Story → Code.

---

# 8. Metadados obrigatórios do PR

Todo PR deve informar:

```text
Milestone
Story
FRs
NFRs
```

Exemplo:

```text
Story: MOVIE-003
FR: FR-009, FR-028
NFR: NFR-009, NFR-137
```

---

# 9. Workflows oficiais

```text
.github/workflows/
├── pr.yml
├── main.yml
├── nightly.yml
├── release.yml
└── reusable/
    ├── quality.yml
    ├── test.yml
    ├── build.yml
    └── security.yml
```

---

# 10. `pr.yml`

Executado em:

```text
pull_request
```

Objetivo:

> Provar que a alteração pode entrar na `main`.

Pipeline:

```text
Static Checks
↓
Unit
↓
Integration
↓
Contracts
↓
Migrations
↓
Security
↓
Build
↓
E2E Smoke
```

---

# 11. `main.yml`

Executado após merge na `main`.

Responsável por:

```text
full integration
package
build metadata
checksums
SBOM
provenance
Canary artifact
```

---

# 12. `nightly.yml`

Executado periodicamente.

Responsável por testes caros:

```text
large library
performance
memory
stress
torrent integration
failure injection
security extended
dependency audit
```

---

# 13. `release.yml`

Responsável por:

```text
candidate resolution
artifact verification
code signing
SBOM
checksums
attestation
promotion
release publication
```

---

# 14. Fast Fail

O pipeline deve executar primeiro os checks baratos:

```text
format
lint
typecheck
contract drift
```

Não executar build caro se TypeScript já estiver inválido.

---

# 15. Formatting

CI executa:

```text
pnpm format:check
```

CI valida, não corrige.

---

# 16. Lint

```text
pnpm lint
```

Cobertura:

```text
UI
Core
packages
scripts
tests
```

---

# 17. Typecheck

```text
pnpm typecheck
```

TypeScript deve usar:

```text
strict
```

---

# 18. Native Checks

Se `torrentd` for Rust:

```text
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

---

# 19. Unit Tests

Obrigatórios no PR.

Áreas críticas:

```text
Health Score
Source Selection
Manifest validation
Library domain
Cache rules
Path security
Sync rules
```

---

# 20. Integration Tests

Cobrem integração real entre módulos.

Exemplo:

```text
Content
+
Sources
+
Health
+
Source Selection
```

---

# 21. Contract Tests

Obrigatórios para:

```text
UI ↔ Core
Core ↔ torrentd
Core ↔ MPV adapter
Manifest ↔ Client
```

---

# 22. Contratos centralizados

Estrutura recomendada:

```text
packages/contracts/
```

Fonte declarativa deve gerar:

```text
TypeScript
JSON Schema
Fixtures
```

---

# 23. Contract Drift Gate

CI:

```text
pnpm contracts:generate
git diff --exit-code
```

Se houver alteração gerada não commitada:

```text
FAIL
```

---

# 24. Breaking Contracts

Mudança breaking exige nova protocol version.

Exemplo:

```text
core-torrentd/1
↓
core-torrentd/2
```

Nunca alterar o significado de um contrato existente silenciosamente.

---

# 25. Manifest Drift Gate

Mudanças no Manifest exigem:

```text
schema generation
fixture validation
backward compatibility tests
security fixtures
```

---

# 26. Golden Manifest Fixtures

```text
tests/fixtures/manifests/
├── valid-minimal.json
├── valid-large.json
├── previous-v1.json
├── invalid-path.json
├── invalid-signature.json
└── malicious.json
```

---

# 27. Database Drift Gate

Toda mudança de schema exige migration.

Proibido depender apenas do schema atual.

---

# 28. Migration Test — Fresh DB

```text
empty DB
↓
run all migrations
↓
validate schema
↓
smoke
```

---

# 29. Migration Test — Upgrade

```text
previous release DB
↓
new migrations
↓
validate data
↓
application smoke
```

---

# 30. Historical Database Fixtures

```text
tests/fixtures/databases/
├── v0.1.0.db
├── v0.2.0.db
└── v0.3.0.db
```

Uma migration não está pronta apenas porque uma DB nova funciona.

Ela precisa provar que um usuário existente consegue atualizar sem perder dados.

---

# 31. Migration destrutiva

Exige:

```text
backup strategy
explicit review
data preservation test
rollback strategy
```

---

# 32. JS Dependency Drift

Arquivo obrigatório:

```text
pnpm-lock.yaml
```

CI:

```text
pnpm install --frozen-lockfile
```

---

# 33. Toolchain Pinning

Versionar no repositório:

```text
Node
pnpm
Rust
Electron
```

Exemplos:

```text
.node-version
package.json#packageManager
rust-toolchain.toml
```

---

# 34. Native Dependency Drift

Dependências como:

```text
MPV
FFmpeg
ffprobe
libtorrent
```

devem possuir versão explícita e hash.

---

# 35. Native Dependency Manifest

Exemplo conceitual:

```yaml
mpv:
  version: <pinned>
  sha256: <expected>

ffmpeg:
  version: <pinned>
  sha256: <expected>

libtorrent:
  version: <pinned>
  sha256: <expected>
```

---

# 36. Nunca usar `latest`

Em releases:

```text
download latest
```

é proibido.

Usar:

```text
exact version
+
SHA-256
```

---

# 37. Build Platform

Plataforma oficial inicial:

```text
Windows x64
```

O build oficial deve acontecer em runner Windows para validar:

- Electron packaging;
- Named Pipes;
- MPV;
- native runtime;
- paths;
- installer.

---

# 38. Build Gate

Todo PR deve provar:

```text
UI builds
Core builds
torrentd builds
packaging config is valid
```

---

# 39. Packaged App Smoke

Pipeline completo:

```text
package
↓
launch packaged executable
↓
wait app ready
↓
validate window
↓
shutdown cleanly
```

---

# 40. E2E

Ferramenta sugerida:

```text
Playwright
```

A automação Electron deve ser complementada por smoke do executável empacotado.

---

# 41. E2E — Cadastro de Filme

```text
Open app
↓
Movies
↓
Cadastrar Filme
↓
Search metadata
↓
Add magnet/.torrent
↓
Save
↓
Open Details
```

---

# 42. E2E — Shared Library

```text
Import fixture
↓
Preview
↓
Confirm
↓
Library appears
↓
Navigate
```

---

# 43. E2E — Playback UI

Em ambiente controlado:

```text
Details
↓
Play
↓
Preparing
↓
Player
↓
Pause
↓
Seek
↓
Exit
```

---

# 44. Nightly Torrent Tests

Usar apenas conteúdo de teste autorizado:

```text
próprio
domínio público
Creative Commons
authorized fixture
```

Cenários:

```text
single file
season pack
few peers
seek
resume
disk limit
torrentd restart
```

---

# 45. Performance Gates

Benchmarks devem provar NFRs críticos.

Medir:

```text
Cold Start
Warm Start
Library Visible
Navigation
Search
Play → First Frame
Seek → Resume
Memory
```

---

# 46. Performance Baseline

A `main` mantém baseline.

PR compara com:

```text
current main
```

Regression threshold deve ser calibrado para evitar ruído.

Exemplo inicial:

```text
> 15% regression
→ warning/fail depending metric
```

---

# 47. Hard NFR Gate

Mesmo sem grande regressão percentual, violar budget absoluto pode bloquear release.

Exemplo:

```text
Cold Start > NFR budget
→ FAIL
```

---

# 48. Large Library Benchmarks

Nightly:

```text
100
1,000
10,000 Contents

10,000
50,000 Episodes
```

---

# 49. Memory Leak Gate

Executar ciclos como:

```text
Details
Play
Exit
repeat N times
```

Memória não deve crescer indefinidamente.

---

# 50. Security Gates

PR deve executar:

```text
dependency review
secret scanning
static analysis
security tests
```

Fixtures obrigatórias:

```text
path traversal
ZIP bomb metadata
SSRF
invalid signature
hash mismatch
malformed manifest
malformed torrent
invalid RPC payload
```

---

# 51. Vulnerable Dependencies

Nova dependência acima do severity threshold definido:

```text
FAIL
```

---

# 52. Secret Scanning

Nenhum secret deve entrar no repositório.

---

# 53. SBOM

Release deve gerar Software Bill of Materials.

Formato preferido:

```text
SPDX
```

---

# 54. Code Signing

Build Windows distribuído deve ser code signed.

Signing acontece apenas em job de release protegido.

Secrets de signing nunca ficam no repositório.

---

# 55. Artifact Attestation

Quando suportado pelo contexto do repositório/plano, gerar attestation de provenance.

Objetivo:

```text
binary
↓
workflow
↓
repository
↓
commit SHA
```

---

# 56. Checksums

Release deve incluir:

```text
SHA-256
```

para seus artefatos distribuídos.

---

# 57. Build Once, Promote Many

Regra obrigatória:

```text
build once
```

O mesmo artefato avança por:

```text
Canary
↓
Beta
↓
Stable
```

---

# 58. Proibido rebuild na promoção

Não fazer:

```text
Beta source
↓
new build
↓
Stable
```

Isso cria Release Drift.

Fazer:

```text
validated artifact
↓
promotion
```

---

# 59. Release Channels

```text
Canary
Beta
Stable
```

Exemplos:

```text
0.8.0-canary.<run>
0.8.0-beta.1
0.8.0
```

---

# 60. GitHub Environments

Configurar:

```text
canary
beta
stable
```

`stable` deve ter proteção mais forte:

```text
manual approval
restricted branches
release secrets
```

---

# 61. Release Artifact Set

Exemplo:

```text
Ushark-0.8.0-Setup.exe
Ushark-0.8.0.msi
checksums.txt
sbom.spdx.json
build-metadata.json
```

---

# 62. Build Metadata

Exemplo:

```json
{
  "version": "0.8.0",
  "commit": "...",
  "workflowRun": "...",
  "node": "...",
  "electron": "...",
  "torrentd": "...",
  "mpv": "...",
  "ffmpeg": "..."
}
```

---

# 63. Generated Files Gate

Qualquer código/schema gerado deve passar por:

```text
generate
↓
git diff --exit-code
```

Exemplos:

```text
IPC schemas
Manifest schema
JSON Schema
DB schema snapshot
fixtures generated
```

---

# 64. Architecture Drift

O CI deve impedir dependências proibidas.

Exemplo proibido:

```text
UI
→ libtorrent directly
```

Estrutura permitida:

```text
UI
→ Core facade
→ torrent adapter/contracts
```

---

# 65. Architecture Tests

Criar:

```text
pnpm architecture:check
```

Validar:

- boundaries;
- forbidden imports;
- circular dependencies;
- package direction.

---

# 66. Code Coverage

Coverage não deve ser tratado como única métrica de qualidade.

Pode existir mínimo maior para módulos críticos:

```text
Health Engine
Source Selection
Manifest Security
Path Security
Sync
Migrations
```

---

# 67. Flaky Test Policy

Flaky test não deve ser mascarado por retries infinitos.

Fluxo:

```text
identify
↓
quarantine temporariamente
↓
create issue
↓
fix
```

---

# 68. External Network em testes

PR tests devem evitar depender da internet pública.

TMDB/Registry:

```text
mock server
fixtures
```

Integrações reais:

```text
Nightly
Manual
Pre-release
```

---

# 69. Required PR Checks

Estado final esperado:

```text
format
lint
typecheck
unit-tests
integration-tests
contract-tests
migration-tests
architecture
security
build-windows
e2e-smoke
```

---

# 70. Main Pipeline

Após merge:

```text
Full Build
↓
Extended Integration
↓
Package
↓
Checksums
↓
SBOM
↓
Attestation
↓
Canary
```

---

# 71. Nightly Pipeline

```text
Stress
Performance
Memory
Torrent Integration
Failure Injection
Security Extended
```

Failure injection:

```text
torrentd crash
MPV crash
DB locked
disk full
network lost
registry timeout
manifest corruption
```

---

# 72. Stable Release Gate

Stable só pode ser promovida quando:

```text
main green
relevant nightly green
beta artifact validated
security green
migration green
manual approval
```

---

# 73. Release apenas pelo CI

Proibido distribuir build criado manualmente da máquina do desenvolvedor como release oficial.

Release oficial sempre aponta para:

```text
commit SHA exato
workflow run
artifact hash
```

---

# 74. Versioning

Usar Semantic Versioning.

```text
MAJOR
breaking compatibility

MINOR
backward-compatible features

PATCH
fixes
```

Protocol versions continuam independentes.

---

# 75. Changelog

Gerar a partir de:

```text
PR metadata
labels
conventional commits
stories
```

Categorias:

```text
Added
Changed
Fixed
Security
Performance
Migration
```

---

# 76. Auto Update — canais

Quando implementado:

```text
Stable user → Stable
Beta user   → Beta + Stable
Canary user → Canary + Beta + Stable
```

Auto-update deve validar integridade/assinatura do artefato.

---

# 77. Infrastructure Drift

Se Registry ou serviços remotos forem criados, infraestrutura deve ser declarativa.

Preferência:

```text
OpenTofu / Terraform
```

Fluxo:

```text
Git
↓
Plan
↓
Review
↓
Apply
```

---

# 78. No Manual Production Drift

Mudanças manuais em produção devem ser evitadas.

Drift check periódico:

```text
tofu plan
```

---

# 79. Immutable Infrastructure Artifacts

Containers e serviços devem usar:

```text
version/digest
```

Nunca:

```text
latest
```

---

# 80. Devflow / Agent Workflow

Fluxo oficial:

```text
Story
↓
Claude Code
↓
Local Quality Gate
↓
PR
↓
CI
↓
Codex Review
↓
Fixes
↓
CI
↓
Merge
```

---

# 81. Local Quality Gate

Antes de abrir PR:

```text
pnpm quality
```

Deve agregar pelo menos:

```text
format check
lint
typecheck
unit tests
contracts check
```

---

# 82. Agente não pode burlar gates

Agente não pode:

- apagar testes que falham para obter verde;
- desabilitar required checks;
- alterar baseline para esconder regressão;
- adicionar ignore sem justificativa;
- marcar Story como DONE antes do gate.

---

# 83. Story State Machine

```text
PLANNED
↓
IN_PROGRESS
↓
IMPLEMENTED
↓
PR_OPEN
↓
CI_FAILED / CI_GREEN
↓
REVIEW
↓
MERGED
↓
DONE
```

---

# 84. CI Failure

Se CI falhar:

```text
Story
→ FIXING / IN_PROGRESS
```

Nunca permanece como DONE.

---

# 85. Story Definition of Done

Story só é DONE quando:

```text
Acceptance Criteria
+
Linked FRs
+
Linked NFRs
+
Tests
+
Quality Gate Green
+
Review Complete
+
Merged
```

---

# 86. Milestone Definition of Done

Milestone fecha quando:

```text
all Stories DONE
+
Milestone E2E green
+
performance regression check
+
security check
+
manual usability validation
```

---

# 87. Frontend-First dentro do Milestone

Fluxo obrigatório:

```text
UX Flow
↓
Frontend Mock
↓
Usability Review
↓
Contracts
↓
Core/Backend
↓
Integration
↓
E2E
↓
Quality Gate
```

---

# 88. Gate Frontend

O milestone não avança para implementação profunda enquanto o fluxo visual principal não estiver validado.

---

# 89. Gate Contracts

Backend/Core começa apenas quando contratos necessários estiverem definidos.

---

# 90. Gate Integration

Story integrada precisa provar o fluxo real e não apenas módulos isolados.

---

# 91. Gate Manual

Automação não substitui completamente:

```text
TV usability
controller feeling
visual quality
Sunshine/Moonlight real experience
```

Esses itens entram como gate manual de Milestone/Release.

---

# 92. CI Permissions

GitHub Actions deve usar princípio de least privilege.

Default preferido:

```text
contents: read
```

Write somente em jobs que realmente precisam.

---

# 93. Signing Job Isolation

Signing deve ser isolado dos jobs de PR/teste.

Somente ambiente protegido de release recebe secrets de signing.

---

# 94. Third-party Actions

Fixar Actions em versões confiáveis e, quando necessário, commit SHA.

---

# 95. CI Artifacts em falhas

Quando E2E falhar, salvar:

```text
screenshots
videos
Playwright traces
logs
diagnostic bundle
```

Sem secrets.

---

# 96. Quality Dashboard

Métricas recomendadas:

```text
build health
test pass rate
flaky tests
coverage
startup performance
memory trend
release frequency
```

---

# 97. Devflow Integration

Devflow deve acompanhar pelo menos:

```text
Story
PR
CI status
Review status
Merge
```

O dashboard deve diferenciar:

```text
Implemented
```

de:

```text
Done
```

---

# 98. Example `pr.yml`

```yaml
name: PR Quality

on:
  pull_request:

jobs:
  quality:
    uses: ./.github/workflows/reusable/quality.yml

  test:
    uses: ./.github/workflows/reusable/test.yml

  build:
    needs:
      - quality
      - test
    uses: ./.github/workflows/reusable/build.yml
```

---

# 99. Example package scripts

```json
{
  "scripts": {
    "quality": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm contracts:check",
    "contracts:check": "pnpm contracts:generate && git diff --exit-code"
  }
}
```

---

# 100. Acceptance Criteria — PR CI

Considerado funcional quando:

1. push direto em `main` está bloqueado;
2. required checks existem;
3. lint/typecheck/tests bloqueiam merge;
4. contract drift é detectado;
5. migrations são testadas;
6. build Windows é validado;
7. regressões críticas de segurança bloqueiam merge;
8. smoke E2E roda automaticamente.

---

# 101. Acceptance Criteria — Anti-Drift

Considerado funcional quando:

1. lockfile é frozen;
2. toolchains são versionadas;
3. native binaries possuem versão/hash;
4. generated files são verificados;
5. breaking IPC exige protocol version;
6. manifest schema possui fixtures;
7. DB upgrade histórico é testado;
8. release não usa `latest`.

---

# 102. Acceptance Criteria — Release

Considerado funcional quando:

1. artifact é construído uma vez;
2. Canary/Beta/Stable promovem o mesmo artifact;
3. release possui checksum;
4. SBOM pode ser gerada;
5. code signing ocorre em job protegido;
6. provenance/attestation é gerada quando disponível;
7. Stable exige gates completos;
8. release aponta para commit SHA.

---

# 103. Acceptance Criteria — Devflow

Considerado funcional quando:

1. agente executa quality gate local;
2. agente cria PR;
3. Story não vira DONE antes do CI;
4. CI failure retorna Story para correção;
5. review acontece antes do merge;
6. milestone exige todas as Stories verdes;
7. validação manual pode bloquear release.

---

# 104. Relação com FRs

Este documento protege transversalmente todos os Functional Requirements.

Áreas especialmente sensíveis:

```text
FR-038–069
Streaming e Playback

FR-092–115
Health e Source Selection

FR-149–167
Library Sync

FR-194–210
Security e Error Handling
```

---

# 105. Relação com NFRs

Quality Gates devem comprovar principalmente:

```text
NFR-001–039
Performance e Streaming

NFR-051–060
Persistência e Integridade

NFR-083–110
Resiliência, Security e Privacy

NFR-131–148
Migrations, Maintainability e Testing

NFR-149–160
Resources e Performance SLOs
```

---

# 106. Decisões fechadas

```text
CI/CD
= GitHub Actions

Branch Protection
= GitHub Rulesets

main
= PR only

Merge
= Squash preferred

Dependencies
= pinned

Native Binaries
= pinned + SHA-256

Contracts
= generated + drift checked

Database
= historical migration tests

Release
= build once, promote many

Channels
= Canary → Beta → Stable

Stable
= protected promotion

Agents
= cannot declare DONE

Quality Gate
= source of truth
```

---

# 107. Arquitetura final

```text
Developer / Agent
        │
        ▼
Local Quality Gate
        │
        ▼
Feature Branch
        │
        ▼
Pull Request
        │
        ├── Static Analysis
        ├── Unit
        ├── Integration
        ├── Contracts
        ├── Migrations
        ├── Security
        ├── Build
        └── E2E Smoke
        │
        ▼
      Review
        │
        ▼
       main
        │
        ▼
   Full Build Once
        │
        ├── Checksums
        ├── SBOM
        ├── Signing
        └── Provenance
        │
        ▼
      Canary
        │
        ▼
       Beta
        │
        ▼
      Stable
```

---

# 108. Próxima etapa

Com este documento, a base anterior aos milestones passa a ser:

```text
Product Specs
↓
Architecture Specs
↓
Data / IPC / Security / UX
↓
CI/CD & Quality Gates
↓
Epics
↓
Milestones
↓
Stories
↓
Goal Files
```

O próximo documento recomendado é:

```text
11-epics-and-milestones.md
```

---

# 109. Regra final

> **Código só é considerado pronto quando o pipeline consegue provar que ele compila, funciona, é compatível, não introduz drift, não viola os Quality Gates e pode ser promovido de forma reproduzível.**
