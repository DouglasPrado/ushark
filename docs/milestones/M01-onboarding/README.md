# M01 — Entrar no app e configurar a biblioteca

Status: FRONTEND_UX_APPROVED — S00–S02 implementadas com mocks; UX aprovada explicitamente pelo usuário: “a ux esta aprovado”. Validação Windows/TV física e controle físico pendentes. Integração e fechamento continuam adiados.

## Objetivo e resultado

Primeiro acesso → boas-vindas → pasta de biblioteca → pasta/limite de cache → preferências → Home vazia. Usuário navega por controle e pode rever configurações. A conclusão do onboarding já fica marcada localmente para que os próximos acessos abram direto na Home; biblioteca e preferências completas continuam aguardando a integração posterior para sobreviver ao restart.

## Requisitos

FR-001, FR-075–FR-080, FR-187–FR-193, FR-214–FR-218, FR-220, NFR-004–NFR-009, NFR-065, NFR-116, NFR-123–NFR-127, NFR-137–NFR-138, NFR-142, NFR-146, NFR-149, NFR-158–NFR-159, RX-001, RX-002, RX-003, RX-004, RX-049, RX-057. Definições e fontes na [matriz](../REQUIREMENTS_COVERAGE.md).

Jornadas: UJ01, UJ22, UJ62, UJ79 e UJ80. O escopo é o M01 do [plano aprovado](../PLAN.md#m01).

## Superfícies e estados

Rotas propostas para S00: /onboarding, /home e /settings. Estados: idle/loading/ready/degraded/offline/error, validação de campos, saving/success e Home vazia. Biblioteca/cache inacessíveis, falha ao salvar e cancelamento têm fixtures. Seleção de pasta é simulada inicialmente; preferência de playback não aciona runtime inexistente.

## Sequência preparada

- [S00 — Contrato da experiência](stories/S00-contract.md)
- [S01 — Onboarding e Home vazia com mocks](stories/S01-mock-ui.md)
- [S02 — Navegação e preferências simuladas](stories/S02-frontend-behavior.md)
- [S03 — Contrato mínimo de configuração](stories/S03-domain-contract.md)
- [S04 — Salvar configuração e biblioteca vazia](stories/S04-configuration-storage.md)
- [S05 — Concluir onboarding com dados locais](stories/S05-integration.md)
- [S06 — Comprovar o primeiro acesso](stories/S06-tests.md)
- [S07 — Consolidar segurança e uso na TV](stories/S07-hardening.md)
- [S08 — Fechar M01 com evidências](stories/S08-closure.md)

Entre S02 e S03: [checkpoint UX](UX_CHECKPOINT.md). Entre S05 e S06: [checkpoint funcional](FUNCTIONAL_CHECKPOINT.md).

Na onda A, S00–S02 têm implementação e aprovação UX; verificações Windows/TV física e controle físico continuam pendentes. A integração S03–S05 aguarda o fim da fase frontend M01–M22 aprovada, conforme diretriz posterior do usuário. Não tratar essa espera planejada como falha nem encerrar M01; preparar o próximo frontend quando autorizado. CI frontend básico pode entrar após aprovação da experiência inicial, sem antecipar gates de componentes ausentes.

## Dependências e limites

Sem dependência funcional anterior. Execução S00–S02 autorizada; toolchain frontend e contrato da experiência disponíveis. Não há banco, torrentd, player, provider ou serviço remoto no frontend. Defaults, estratégia de paths no controle e hardware de medição são decisões de S00/UX; não foram aprovados implicitamente pelo mapa.

## Conclusão

S08 com UX e funcional aprovados, fluxo real persistido e reabrível, gates e revisão/merge aplicáveis, evidências de foco/segurança/performance e ausência de perda silenciosa. M01 não comprova gamepad nas telas futuras nem sessão Sunshine/Moonlight real.

## Preparação documental M01–M22

S00–S08 e roteiros de checkpoints conferidos em 2026-09-13. [Cobertura individual](PREPARATION_COVERAGE.md) e [auditoria global](../PREPARATION_AUDIT.md). Esta conferência não executou stories nem alterou aceites.

## Estado da fase frontend M01–M22

S00–S02 implementadas no checkout real com mocks. UX aprovada anteriormente; aceite humano preservado. S03–S08 DEFERRED; não DONE. [Roteiro único](../../execution/FRONTEND_REVIEW.md), [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [regressão final](../../execution/evidence/FINAL_VALIDATION.md). Planos futuros neste README continuam sujeitos à integração e autorização.
