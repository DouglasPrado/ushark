# Análise das fontes e decisões pendentes

Status: proposta de planejamento, 2026-09-12. A análise utiliza a documentação local; nenhuma capacidade descrita foi presumida implementada. O checkout continha documentação e convenções, sem aplicativo, testes ou CI de produto.

## Documentação analisada

| Fonte | Contribuição ao plano |
|---|---|
| [PRD](../product/01-prd-master.md) | Identidade permanente de conteúdo, fontes substituíveis, curadoria, estado local, escopo e exclusões. |
| [80 jornadas](../product/02-user-journeys.md) | Fluxos completos, entradas alternativas, escolhas, erros e comportamentos não enumerados nos FRs. |
| [227 FRs](../product/03-functional-requirements.md) | IDs preservados integralmente e critérios funcionais vinculados na matriz. |
| [160 NFRs](../product/04-non-functional-requirements.md) | Performance, segurança, resiliência, privacidade, compatibilidade, testabilidade e cenários de validação. |
| [A01 Manifest](../architecture/01-library-manifest.md) | Contrato declarativo, selectors, versões, presentation, collections, restrições e evolução. |
| [A02 Torrent](../architecture/02-torrent-streaming-engine.md) | Inspeção, sessão, scheduler, seek, budgets, cache, resume, delivery e recuperação. |
| [A03 Health](../architecture/03-health-score-source-selection.md) | Sinais, confiança, ranking, explicabilidade, elegibilidade, fallback e histórico. |
| [A04 Playback/TV](../architecture/04-playback-mpv-sunshine.md) | MPV, overlay, codecs/tracks, input, lifecycle, transições e Sunshine/Moonlight. |
| [A05 Sharing](../architecture/05-shared-libraries-sync.md) | Draft, arquivo, publicação, Registry opcional, assinatura, sync, rollback, fork e futuro. |
| [A06 Dados](../architecture/06-data-model.md) | Ownership, normalização, transações, busca, merge, retenção, backup e migrações. |
| [A07 IPC](../architecture/07-ipc-contracts.md) | Contratos incrementais, versionamento, operações/eventos/snapshots, cancelamento, recovery e segurança. |
| [A08 Segurança](../architecture/08-security-model.md) | Fronteiras de confiança, limites, sandbox, SSRF, assinatura, Electron, IPC e secrets. |
| [A09 UX](../architecture/09-ux-navigation-spec.md) | Foco, controle, rotas, feedback, layouts, acessibilidade e estados durante atualizações. |
| [A10 CI/CD](../architecture/10-ci-cd-quality-gates.md) | Gates, evidências, anti-drift, revisão/merge, build/assinatura/promoção e infraestrutura condicional. |
| [A11 Frontend-first](../architecture/11-frontend-first-project-setup.md) | Ordem de implementação, setup mínimo, mocks substituíveis e aprovação anterior a infraestrutura. |
| [README](../../README.md), [ROADMAP](../../ROADMAP.md), [índice](../README.md) | Estado atual e exemplos anteriores de fase/milestone, ainda sem implementação. |
| [AGENTS](../../AGENTS.md), [EXECUTE](../../EXECUTE.md) | Processo de planejamento, aprovação, preparação e retomada. |
| [CONTRIBUTING](../../CONTRIBUTING.md), [CHANGELOG](../../CHANGELOG.md), [templates de PR](../../.github/PULL_REQUEST_TEMPLATE.md) e issues | Rastreabilidade, validação proporcional, divulgação de mudanças e fluxo de contribuição. |
| [SECURITY](../../SECURITY.md), [SUPPORT](../../SUPPORT.md), [CODE_OF_CONDUCT](../../CODE_OF_CONDUCT.md), [LICENSE](../../LICENSE) | Limites de comunicação, suporte, privacidade e distribuição; não criam módulos sociais no app. |

A skill [frontend-guided-milestones](../../.agents/skills/frontend-guided-milestones/SKILL.md), referências de planejamento/método/lifecycle e templates pertinentes orientaram a forma do plano. Exemplos de clientes/CRM dentro da skill não são requisitos do Ushark. O arquivo `MANIFEST.md` mencionado nas abas do IDE não foi encontrado no inventário do checkout; o documento de produto correspondente encontrado é A01, listado acima. Não foi presumido conteúdo de arquivo não salvo ou ausente.

## Como a cobertura foi extraída

1. Preservar cada FR/NFR, título e definição/aceite na matriz, com origem.
2. Cotejar todas as jornadas individualmente, incluindo retomada, falhas e ações destrutivas.
3. Cotejar arquitetura e PRD contra os IDs: obrigações adicionais recebem RX, sem renumerar a documentação original.
4. Manter opcionais/condicionais como tais. Um exemplo de threshold, transporte ou estrutura não se transforma automaticamente em decisão fechada.
5. Intenções futuras ficam em FUT e destinos M23–M28. São grupos de discovery, não milestones de implementação gigantes já autorizados; devem ser subdivididos em capacidades pequenas após especificação.
6. Atribuir ownership primário único e checar existência/cobertura/ciclos. Regras transversais são revalidadas onde houver impacto.

Não se trata de transformar cada tabela SQL, DTO exemplificativo ou linha de pseudocódigo em story. O plano preserva seus comportamentos/restrições e aponta para a spec que o contrato futuro deverá satisfazer.

## Divergências e decisões a fechar no momento adequado

| ID | Evidência / tensão | Tratamento proposto | Responsável / momento |
|---|---|---|---|
| D01 | ROADMAP e A11 §§28–34 exemplificam M00–M08 por telas; usuário e skill exigem capacidades verticais. | Adotar M01–M22 propostos com UI→integração→aceite por capacidade. Conservar fase inicial somente mockada. Exemplos antigos não equivalem aos novos IDs. | Aprovação deste plano. |
| D02 | A11 §35 exige UX principal validada antes da application layer; lifecycle vertical permite integrar após UX de cada milestone. | Validar a UX principal M01–M18 antes da primeira persistência/provider/runtime; cada integração ainda exige seu checkpoint individual. Não marcar milestone completo ao terminar apenas UI. | GOAL; aprovação deste plano. |
| D03 | FR-007/A01 §4 exigem ID imutável; UJ54 fala em atualizar contentId; A06 §§115–119 exige merge local→canônico. | Corrigir associação/merge por operação explícita que preserve relações/estado; não renomear PK silenciosamente. Definir resolução quando ambos os IDs já possuem progresso. | M02 S03, validado novamente em M03/M16. |
| D04 | A01 alterna sources por referência/objeto inline, metadata tmdbId/providers e episódios children/plano. | Fechar forma canônica v1 e normalização/compatibilidade dos exemplos antes do serializer. Não implementar todos como formatos separados sem decisão. | M13 S03. |
| D05 | FR-033 deduplica por infoHash; A05 §54 cita infoHash+selector; A06 distingue source/media/selector. | Reutilizar sessão/cache/resume por torrent; preservar vínculo por Content/arquivo/selector. Não fundir dois episódios só porque compartilham hash. | M06 S03 e M03. |
| D06 | FR-221 exige error; A03 inclui degraded/unavailable e exemplos omitem error. A05 adiciona staging/update-available. | Contrato distingue erro técnico, indisponibilidade/offline e estado de medição; mapear máquinas completas para UI sem perder estados mínimos de FR-220–222. | M08/M16 S03. |
| D07 | PRD fala em prioridade por menor tamanho; A03 formaliza três estratégias e resolução. | Preservar menor tamanho como RX-056; definir preferência/critério no ranking aprovado, sem substituir arbitrariamente por Data Saver futuro. | M08 UX/S03. |
| D08 | A08/A05 dão intervalos/exemplos de limites; A01 não define schema executável final. | Fixar limites mensuráveis de JSON, archive, imagem, torrent, URL e IPC antes de aceitar entrada real em cada fronteira. | M06/M13/M16 S03. |
| D09 | A02/A03 apresentam pesos, budgets, TTL e prioridades como exemplos; UJ46 e A02 §53 divergem na ordem de eviction. | Definir defaults e política única em contrato, mantendo como invariantes a proteção de ativos/Keep e prioridade do playback. Calibrar com testes. | M07/M08/M10 S03. |
| D10 | NFR-053 permite perda de alguns segundos; A06 §85 sugere 5–10s; watched e countdown são exemplos. | Fechar intervalo/budget de perda de progresso, threshold assistido e countdown antes do aceite real, sem converter valores exemplificativos em promessa. | M05/M11 S03. |
| D11 | A04 recomenda MPV separado com overlay React e sem exposição de desktop. | Após aprovar player mockado, testar composição/captura/foco reais. Se inviável, registrar limitação e voltar à UX antes de mudar estratégia. | M05/M18. |
| D12 | Pause on disconnect é requisito; não há API/sinal concreto de sessão Sunshine definido. | Selecionar sinal verificável e versões suportadas no contrato; ausência de sinal confiável é bloqueio real da integração, não justificar simulação como entrega. | M18 S03/S05. |
| D13 | Arquivo parcial é preferido; HTTP Range é alternativa. | Iniciar com arquivo parcial. Criar adapter somente com falha/necessidade comprovada e regras localhost/token/ranges. | M07 após UX. |
| D14 | A01 trata assinatura como futura; FR-201–203/A05/A08 requerem validação quando presente. | Não aceitar assinatura inválida/não verificável. M13 entrega pacote não assinado identificado ou rejeita assinatura não suportada; M14 habilita verificação/geração antes de publicação/subscription remotas. | M13/M14. |
| D15 | Registry é opcional, mas link/código/publicação remota são capacidades previstas. | Produto local e .tslib funcionam sem serviço; serviço mínimo só M15 após fluxo aprovado. Não antecipar catálogo público, nuvem de progresso ou hospedagem audiovisual. | M15/M16. |
| D16 | A10 pipeline final inclui checks inexistentes; A11 permite somente CI frontend inicial. | Acrescentar gates quando a superfície existir: migrations com DB, contratos/native com daemon, integração MPV com player, assinatura/SBOM/promoção com release. Segurança de cada superfície nasce junto dela. | Todos; RX-049–054. |
| D17 | Assinar binário altera bytes; A10 exige promover o mesmo artefato entre canais. | Definir candidato assinado, hash e metadados de canal antes de validação/promoção; não recompilar/reassinar entre Beta e Stable. Resolver versão exibida versus canal sem mutação silenciosa. | M22 S03. |
| D18 | NFR budgets dependem de hardware; ambiente atual é macOS e alvo oficial é Windows x64. | Medições do mock ou desenvolvimento no macOS não comprovam Windows/TV; definir baseline/corpus e reservar validação Windows/TV real. | M01/M04/M07/M18/M22. |
| D19 | Fonte manual vence; runtime vence declaração; A05 §81 menciona user title opcional acima do override da biblioteca. | Separar escolha de fonte/viabilidade, metadata técnica e apresentação. Custom title global/local é opcional e exige escopo explícito, sem alterar a precedência já obrigatória silenciosamente. | M02/M08/M12. |
| D20 | A01 cita scripts/plugins como futuros e proíbe execução no manifest v1. | M27 somente discovery com novo threat model; nunca interpretar aprovação do roadmap como autorização para executar código de bibliotecas. | M27, fora v1. |
| D21 | A08 allowlist geral de pacote e allowlist de legenda divergem (.ssa). | Definir políticas separadas para pacote e legenda local/remota; não ampliar allowlist de pacote sem decisão/teste. | M05/M13 S03. |
| D22 | Exemplos de segurança como startsWith(sandboxRoot) são conceituais. | Contrato exige contenção real por componentes de caminho/canonicalização/symlinks, com casos de prefixo semelhante; não copiar pseudocódigo como prova de sandbox. | M06/M13. |

Essas pendências não impedem avaliar o agrupamento dos milestones agora. Cada uma bloqueia apenas a implementação/aceitação que depende dela até decisão explícita no contrato apropriado.

## Escopo preservado e excluído da v1 obrigatória

A v1 preserva todos os FRs originais, inclusive os P1/condicionais, com suas condições de ativação. M22 é o fechamento proposto de v1/P1 completo; não se apresenta um subconjunto P0 como produto integral. Segurança de importação e cache ativo são obrigatórias antes de usar as superfícies reais.

Ficam rastreados em M23–M28: coleções inteligentes, social/ratings/comentários, catálogo público/moderação, colaboração de draft, plugins/extensões, compatibilidade ampliada, telemetria opcional e opções avançadas condicionais. Antes de implementar esses grupos, haverá nova extração de requisitos e divisão em milestones limitados. A presente documentação não permite prometer aceite funcional completo para intenções sem especificação.

Não são objetivos iniciais: cliente TV nativo Android/Tizen/WebOS, Chromecast ou player web dedicado; transcoding obrigatório/HLS; anonimato/DRM; catálogo central obrigatório; hospedagem de vídeo no Registry; sincronização em nuvem de progresso/favoritos/Health; dependências entre bibliotecas na v1; scripts executáveis dentro do manifest. Algumas possibilidades futuras podem exigir revisão desses limites, nunca mudança silenciosa.
