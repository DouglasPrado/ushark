# Ushark

Centro de mídia desktop com frontend React/Electron. A fase **M01–M22 / S00–S02** está implementada com mocks em memória. Revisão final de UX pendente para M04–M22; aceites anteriores de M01–M03 preservados. Isso não é conclusão funcional dos milestones.

O frontend permite organizar filmes e episódios, buscar, simular playback e downloads, comparar fontes, administrar cache, criar curadorias, testar pacotes/assinaturas/publicações/subscriptions/forks, sessão TV, diagnóstico, backup e atualização. Torrent é fonte substituível; a identidade do conteúdo é independente.

## Executar

Use a versão de Node em `.node-version` e pnpm em `package.json`. Após instalar dependências, o app funciona com fixtures locais, sem credenciais ou serviços externos.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

- `pnpm dev --tv`: Electron fullscreen, usando o mesmo frontend.
- `pnpm dev:web`: prévia no navegador em `http://127.0.0.1:5173`.
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

Não há SQLite/persistência definitiva, providers reais, vídeo/MPV, torrentd, Registry, criptografia de pacotes ou updater/installer de produção. Download, assinatura, publicação, backup e atualização da interface são demonstrativos. Nenhum pacote é publicado pela prévia; links `ushark.invalid` e códigos DEMO só resolvem nesta sessão.

Windows x64 é a plataforma alvo inicial. Windows, TV, controle físico, Sunshine/Moonlight, áudio/vídeo real, hardware decode e budgets em hardware continuam pendentes. S03–S08 e M23–M28 não foram executadas; nenhum milestone está DONE. Nenhum merge, deploy ou release foi feito nesta fase.

## Estrutura

- `apps/desktop`: shell Electron mínimo, UI e navegação.
- `packages/ui`: componentes compartilhados.
- `packages/types`: contratos provisórios substituíveis da experiência.
- `packages/mocks`: adapters e fixtures em memória.
- `tests`: Playwright, incluindo testes isolados de mocks.
- `docs/product`, `docs/architecture`, `docs/milestones`, `docs/execution`: requisitos, arquitetura alvo, milestones e evidências.

A arquitetura definitiva será integrada após revisão UX e autorização. Consulte o [plano vertical](docs/milestones/PLAN.md), [índice documental](docs/README.md), [CONTRIBUTING](CONTRIBUTING.md), [SUPPORT](SUPPORT.md) e [SECURITY](SECURITY.md).

Ferramenta neutra para conteúdo próprio, autorizado, domínio público e Creative Commons. Fixtures e artes locais são sintéticas. Código sob [MIT](LICENSE); dependências conservam suas respectivas licenças.
