# Ushark

Centro de mídia desktop com frontend React/Electron. M02–M22 chegaram ao
checkpoint funcional local: o Electron usa as integrações reais disponíveis e
o navegador preserva os mocks. A decisão funcional humana e os gates externos
continuam pendentes; nenhum milestone está `DONE`.

O frontend permite organizar filmes e episódios, buscar, simular playback e downloads, comparar fontes, administrar cache, criar curadorias, testar pacotes/assinaturas/publicações/subscriptions/forks, sessão TV, diagnóstico, backup e atualização. Torrent é fonte substituível; a identidade do conteúdo é independente.

## Executar

Use a versão de Node em `.node-version` e pnpm em `package.json`. O launcher
carrega automaticamente `apps/desktop/.env` e
`apps/desktop/.env.runtime`, quando presentes.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

- `pnpm dev --tv`: Electron fullscreen, usando o mesmo frontend.
- `pnpm dev:web`: prévia no navegador em `http://127.0.0.1:5173`.
- Torrent e stream reais exigem `USHARK_TORRENTD_PYTHON`,
  `USHARK_TORRENTD_PYTHONPATH` e `USHARK_MPV_PATH`; veja
  `apps/desktop/.env.example`. O modo web continua mockado e o modo TV não
  oferece ações de importação.
- No primeiro acesso, complete o onboarding e use os painéis **Cenários** para carregar exemplos e falhas. Depois de concluído, novos acessos abrem direto na Home.
- Catálogos, preferências e demais fixtures continuam apenas na sessão: recarregar a página/reabrir o processo reinicia esses mocks. Somente o marcador local de onboarding concluído é preservado; backup e restart na interface são simulações em memória.

O [roteiro único de revisão](docs/execution/FRONTEND_REVIEW.md) explica os acessos e fluxos conectados. A [auditoria frontend](docs/execution/FRONTEND_COVERAGE_AUDIT.md) relaciona jornadas, requisitos e evidências; [STATE](docs/execution/STATE.yaml) e [GOAL](docs/execution/GOAL.md) registram a política vigente.

## Validação

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright test --workers=4
```

Playwright cobre comportamento, boundaries mockados, layouts e Electron macOS. Capturas ficam em `docs/milestones/M*/evidence/`; resultados da auditoria final em `docs/execution/evidence/`. Instalação inicial de dependências/Chromium pode exigir rede; as fixtures dos testes não dependem de internet pública.

## Limites desta entrega

SQLite/WAL, MPV, torrentd/libtorrent e os demais adapters locais de S03–S05
estão integrados no Electron. O runtime torrent/MPV ainda não é distribuído no
installer e precisa ser configurado no ambiente de desenvolvimento. Registry e
providers externos dependem de endpoints/credenciais próprios; nenhuma
publicação de produção foi feita.

Windows x64 é a plataforma alvo inicial. Windows, TV, controle físico,
Sunshine/Moonlight, hardware decode, installer, code signing e budgets no
hardware permanecem pendentes. S06–S08 e M23–M28 não foram executadas; nenhum
milestone está `DONE`. Nenhum merge, deploy ou release foi feito nesta fase.

## Estrutura

- `apps/desktop`: shell Electron mínimo, UI e navegação.
- `packages/ui`: componentes compartilhados.
- `packages/types`: contratos provisórios substituíveis da experiência.
- `packages/mocks`: adapters e fixtures em memória.
- `tests`: Playwright, incluindo testes isolados de mocks.
- `docs/product`, `docs/architecture`, `docs/milestones`, `docs/execution`: requisitos, arquitetura alvo, milestones e evidências.

A arquitetura definitiva será integrada após revisão UX e autorização. Consulte o [plano vertical](docs/milestones/PLAN.md), [índice documental](docs/README.md), [CONTRIBUTING](CONTRIBUTING.md), [SUPPORT](SUPPORT.md) e [SECURITY](SECURITY.md).

Ferramenta neutra para conteúdo próprio, autorizado, domínio público e Creative Commons. Fixtures e artes locais são sintéticas. Código sob [MIT](LICENSE); dependências conservam suas respectivas licenças.
