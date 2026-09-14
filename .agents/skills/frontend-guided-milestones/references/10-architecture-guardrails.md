# Arquitetura como guardrail de milestones

Use esta referência quando o repositório possuir documentação arquitetural ou quando uma story alterar boundaries, ownership, contratos, persistência, processos, segurança, performance ou entrega.

## Papel da arquitetura

Produto define **o que** precisa existir. Arquitetura define **como** construir e quais propriedades precisam ser preservadas ou provadas. O milestone continua vertical e guiado pela experiência; não crie milestones por camada e não use a arquitetura para antecipar componentes futuros.

Antes de planejar ou implementar, classifique cada afirmação relevante da fonte como:

- **normativa**: princípio/regra central, decisão fechada, requisito explícito, proibição ou critério de aceite;
- **condicional**: aplica-se apenas quando a superfície, risco ou integração existir;
- **recomendação**: direção preferida que admite alternativa justificada;
- **exemplo/default**: ilustra a intenção, mas exige decisão antes de virar contrato;
- **futura/planejada**: destino arquitetural, não autorização para implementar agora.

Não copie diagramas, pseudocódigo, thresholds ou schemas exemplificativos como se fossem contratos finais. Cite a seção exata e preserve seu grau de obrigatoriedade.

## Descoberta e rastreabilidade

1. Leia as instruções do repositório, GOAL e STATE antes de retomar execução.
2. Descubra o índice e as decisões/ADRs existentes.
3. No planejamento macro, inventarie todas as fontes arquiteturais e mapeie cada constraint normativa a milestone, story e gate.
4. Em uma story, leia apenas as fontes mapeadas, mais dependências necessárias para interpretar o boundary.
5. Traduza cada constraint aplicável em acceptance criterion e validação observável.
6. Registre conflitos ou decisões abertas com owner e momento de resolução; bloqueie somente o trabalho realmente dependente.
7. Se a implementação precisar alterar uma decisão fechada, registre ADR/decisão e obtenha o checkpoint/autorização exigido. Não trate o desvio como refactor local.

## Gate por fase

| Fase | Prova arquitetural mínima |
|---|---|
| S00 | fontes aplicáveis, ownership, boundaries, estados e riscos identificados |
| S01–S02 | UX e mocks obedecem aos contratos substituíveis; nenhuma infraestrutura real antecipada |
| UX | jornada e estados perceptíveis aprováveis; simulações e limitações explícitas |
| S03 | entidades/IDs/owners, contratos, erros, versionamento, idempotência, trust e recovery formalizados |
| S04 | implementação respeita processos/camadas, segurança e infraestrutura estritamente necessária |
| S05 | adapter real substitui mock sem quebrar UI/contrato; jornada atravessa os boundaries reais |
| Functional | dados, processos, permissões, erros e ambiente real aplicáveis comprovados ponta a ponta |
| S06 | testes de contrato, integração, fixtures/migrations, E2E e anti-drift aplicáveis |
| S07 | segurança, isolamento, performance, observabilidade, acessibilidade, recovery e budgets |
| S08 | cobertura e desvios auditados; gates locais, CI, review, merge e manuais distinguidos |

## Mapa arquitetural do Ushark

Use este mapa para rotear a leitura; ele não substitui as especificações em `docs/architecture/`.

As especificações atuais são Draft v1; dentro delas, trate princípios/regras centrais, decisões fechadas, critérios de aceite e linguagem obrigatória como normativos para a versão até que uma decisão posterior os substitua. Consulte também `docs/milestones/SOURCE_ANALYSIS.md`, quando existir, para tensões já identificadas; esse registro orienta a leitura, mas não substitui a fonte original.

| Fonte | Leia quando a story tocar | Guardrails duráveis |
|---|---|---|
| A01 `01-library-manifest.md` | manifest, catálogo, Content, Source, Library, presentation, import/export | Content não é Source; manifest é declarativo; estado do usuário/runtime é local; paths são confinados; versões publicadas são imutáveis |
| A02 `02-torrent-streaming-engine.md` | torrent, streaming, cache, resume, scheduler, sessão | libtorrent fica atrás de adapter; `torrentd` é isolado da UI; priorizar startup/seek/buffer e recursos limitados, não completion bruto |
| A03 `03-health-score-source-selection.md` | health, ranking, probe, fallback | Health e seleção são conceitos separados; decisão é mecânica, determinística e sem LLM; confidence e explicabilidade acompanham score; preferência não vence inviabilidade |
| A04 `04-playback-mpv-sunshine.md` | player, MPV, TV, Sunshine/Moonlight, input, tracks | MPV é processo/adaptador separado; Core coordena playback/fallback; UI não expõe desktop/runtime; experiência é TV/gamepad-first |
| A05 `05-shared-libraries-sync.md` | compartilhamento, versão, assinatura, sync, Registry, fork | biblioteca compartilhada é curadoria versionada; versões são imutáveis; sync usa staging/commit atômico; user state/overrides são preservados; Registry não é obrigatório nem hospeda mídia como responsabilidade core |
| A06 `06-data-model.md` | SQLite, migrations, repositories, ownership, backup, busca | manifest de intercâmbio não é schema operacional; Content/Source são globais e separados; estado do usuário é independente; runtime temporário não vira acoplamento persistente; operações críticas são transacionais |
| A07 `07-ipc-contracts.md` | UI/Core, Core/torrentd, Core/MPV, eventos, retry | comunicação usa contratos explícitos, validados e versionados; operações longas usam IDs/eventos/snapshots; mídia pesada não trafega por RPC; comandos/path são allowlisted e não viram shell |
| A08 `08-security-model.md` | qualquer entrada externa, filesystem, Electron, IPC, rede, secrets | entrada externa é não confiável; conteúdo pode descrever dados, nunca executar comportamento privilegiado; sandbox/path/SSRF/limites são obrigatórios na fronteira; IPC é local e renderer é endurecido |
| A09 `09-ux-navigation-spec.md` | telas, navegação, async, controle, acessibilidade | TV/gamepad-first; foco visível/restaurável; voltar previsível; nenhuma ação principal depende de hover; feedback/recovery imediatos e hydration não bloqueante |
| A10 `10-ci-cd-quality-gates.md` | testes, contracts, build, CI, PR, release | gates são evidência, não declaração do agente; dependencies/toolchains/artifacts são fixados; drift é testado; build once/promote many; `IMPLEMENTED` não equivale a `DONE` |
| A11 `11-frontend-first-project-setup.md` | setup, entrypoints, renderer, packages, mocks, entrada de infraestrutura | `apps/desktop/src` separa `main`, `preload` e `renderer`; `packages/ui`, `packages/mocks` e `packages/types` possuem responsabilidades próprias; consumidores usam exports públicos do workspace; mock-first com interface e adapter Fake→Real; arquitetura cresce por necessidade de fluxo aprovado; arquitetura-alvo não é arquitetura inicial; gamepad/focus/testes entram cedo |

## Invariantes transversais do Ushark

- Preserve `Content`, `Source`, `Library`, presentation, user state e runtime como responsabilidades distintas.
- A UI conversa com capacidades/contratos; não controla diretamente SQLite, libtorrent, MPV ou processos privilegiados.
- Mocks representam comportamento e falhas atrás do mesmo boundary conceitual do adapter real, sem alegar persistência ou integração inexistente.
- Todo input de manifest, torrent, pacote, URL, asset, subtitle, path, deep link ou IPC é validado no boundary antes de produzir efeito.
- Trabalho assíncrono de metadata, health, torrent, sync e indexação não bloqueia a navegação; expõe estado, cancelamento/retry/recovery conforme o contrato.
- Recursos e operações de runtime possuem limites, cancelamento, timeouts, recovery e observabilidade proporcionais.
- Validação em mock/macOS/static check não substitui Windows, TV, gamepad, Sunshine/Moonlight, MPV, `torrentd`, rede ou CI real quando esses ambientes fazem parte do aceite.
- Sem autorização para PR/merge/release ou sem infraestrutura de gate existente, registre `IMPLEMENTED`/`LOCAL_VALIDATED` e a pendência; não fabrique `DONE`.

## Conflitos e evolução

Use esta ordem para interpretar o trabalho atual:

1. instrução explícita do usuário, dentro das permissões;
2. instruções persistentes e política ativa (`AGENTS.md`, `GOAL.md`, `STATE.yaml`);
3. decisões/ADRs aceitos;
4. documentação de produto e arquitetura;
5. milestone/story e exemplos.

Uma instrução explícita pode autorizar mudar a arquitetura, mas não apaga a necessidade de registrar a decisão, atualizar consumidores e provar novas consequências. Se duas fontes de mesmo nível conflitarem, registre a divergência e resolva no contrato da primeira story afetada; não expanda o bloqueio a milestones independentes.
