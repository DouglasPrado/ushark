# Auditoria da preparação M01–M22

Data: 2026-09-13. Resultado: PREPARATION_COMPLETE. Esta conclusão se refere à preparação documental; nenhum milestone foi fechado e nenhuma implementação foi executada por esta tarefa.

## Escopo e evidências de preparação

| Exigência | Evidência conferida | Resultado |
|---|---|---|
| Usar skill e fontes atuais | AGENTS, frontend-guided-milestones, lifecycle, story design, templates e política/estado; plano, matriz e fontes de produto | Processo aplicado; autorização explícita permite preparação antecipada |
| Preparar todos M01–M22 sequencialmente | 22 diretórios no índice; M01→M22 conferidos/preparados em ordem | Completo |
| S00–S08 com objetivo/contexto/escopo/exclusões/aceite/validação/conclusão | 198 arquivos de story; seções verificadas, aceitando nomes equivalentes em português; S04.1–S04.3 inline nos novos milestones | Completo documentalmente; execução permanece pendente |
| Jornadas, estados, dependências e contrato previsto por capacidade | READMEs e stories; revisão dos cenários na tabela abaixo | Preparados, contratos definitivos sujeitos à UX |
| Checkpoints UX e funcional | 44 arquivos; M05–M22 NOT_STARTED/PENDING | Nenhum aceite criado |
| Cobertura do escopo aprovado | 227 FR + 160 NFR comparados aos IDs dos documentos originais; 58 RX comparados à matriz; ownership único e 80 jornadas relacionadas | 445 requisitos e 80 jornadas rastreados sem omissões/duplicatas de ownership |
| Respeitar dependências | Todas referências resolvem M01–M22 e precedem consumidor na ordem de integração abaixo | Sem ciclos; UI pode simular dependência ainda não integrada |
| Preservar implementação/aceites | Checkpoints M01–M03 continuam APPROVED; posição corrente M04 mantida; divergência UX registrada, sem sobrescrever decisão de checkpoint | Preparação não altera aceite nem executa story |
| Manter STATE/UPDATE e política coerentes | Seção preparation completa, 22 prepared_milestone_evidence, índice e UPDATE global; UPDATE em cada milestone | Preparação separada de implementação |
| Não ampliar escopo futuro | Nenhum diretório M23–M28 criado; seus estados e ownership futuros mantidos | Fora desta preparação |
| Artefatos navegáveis | Caminhos locais dos artefatos preparados e índices conferidos; referências a evidência futura são instruções, não provas existentes | Links locais resolvidos após criação deste relatório |

A checagem de contagens/links/estrutura foi executada com Python sobre o checkout; isso prova organização e rastreabilidade, não qualidade funcional do produto. Revisão documental adicional conferiu os resultados específicos abaixo contra o plano e a cobertura de cada milestone. Testes de produto, builds, MPV, torrentd, rede, disco e hardware não foram executados por esta tarefa. Evidências anteriores permanecem atribuídas às stories que as produziram.

## Revisão por capacidade

| Milestone | Obrigações específicas preservadas na preparação | Evidência documental |
|---|---|---|
| [M01](M01-onboarding/README.md) | Primeiro acesso, cancelar/voltar e reabrir preservam configuração; gamepad e teclado funcionam; UI inicia offline; renderer isolado; gates frontend básicos passam. | [Rastreabilidade](M01-onboarding/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M02](M02-movies/README.md) | Criar, corrigir, favoritar, remover source e reabrir sem perder Content; provider indisponível permite cadastro manual; overrides não contaminam metadata global; imagens têm fallback/cache. | [Rastreabilidade](M02-movies/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M03](M03-series/README.md) | Importar pack, corrigir arquivo ambíguo e reabrir com mesmos selectors; múltiplos episódios compartilham runtime sem confundir suas identidades; dados ausentes não bloqueiam revisão. | [Rastreabilidade](M03-series/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M04](M04-home-search/README.md) | Busca independe de cards montados e da internet; alterar um arquivo reindexa apenas o afetado; Home não espera scan, provider ou health; listas grandes preservam foco; fontes futuras de subscriptions entram pelo mesmo contrato. | [Rastreabilidade](M04-home-search/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M05](M05-local-playback/README.md) | MPV separado toca mídia controlada; tracks mudam sem reiniciar source; sair salva imediatamente; crash do MPV preserva UI; progresso periódico tem budget explícito; primeira imagem é observada, não inferida do lançamento do processo. | [Rastreabilidade](M05-local-playback/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M06](M06-torrent-import/README.md) | Importar ambos os formatos, cancelar e salvar pendente; entradas maliciosas rejeitadas; fonte reutilizada sem runtime redundante; UI continua disponível após falha do daemon; IPC local validado e autenticado conforme transporte. | [Rastreabilidade](M06-torrent-import/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M07](M07-progressive-playback/README.md) | Play antes de completar e seek fora do cache comprovados; seeks rápidos respeitam última geração; season pack prioriza episódio atual; nenhum arquivo ativo é limpo; UI não bloqueia; startup 1–5s e seek 1–3s medidos em source saudável controlada. | [Rastreabilidade](M07-progressive-playback/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M08](M08-source-selection/README.md) | Play permitido durante medição; arquivo local funciona sem health de rede; ranking determinístico com reason codes; usuário pode retirar override; 4K inviável não vence por resolução; sem flicker; ranking local <10ms no conjunto controlado. | [Rastreabilidade](M08-source-selection/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M09](M09-downloads/README.md) | Baixar/pause/restart/resume funciona sem recheck global desnecessário; cancelamento preserva catálogo; apagar dados é confirmação distinta; download em background cede para playback; falta de espaço pausa escrita com feedback. | [Rastreabilidade](M09-downloads/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M10](M10-storage-retention/README.md) | Limpeza libera somente elegíveis; ativo/download/Keep/protegido permanece; limite considera espaço físico real; promoção reaproveita bytes; corrupção reconstrói cache sem afetar progresso/metadata; alteração de pasta tem tratamento de falha. | [Rastreabilidade](M10-storage-retention/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M11](M11-episode-sequence/README.md) | Autoplay desligado não inicia próximo; cancelamento funciona; pack reutiliza sessão; próximo episódio não rouba banda do atual; episódio ausente possui saída recuperável. | [Rastreabilidade](M11-episode-sequence/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M12](M12-curation-editor/README.md) | Reordenar/renomear preserva IDs; salvar e reabrir mantém draft; preview reproduz layout; estado pessoal não compõe dados exportáveis; curadoria não força runtime nem muda Content global. | [Rastreabilidade](M12-curation-editor/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M13](M13-library-file/README.md) | Roundtrip offline entre dois catálogos sem DB original; IDs/referências/ordem preservados; pacote malicioso não muda catálogo; traversal/symlink/ZIP bomb/HTML/CSS/scripts rejeitados; extensões desconhecidas não executam; versões incompatíveis têm erro explícito. | [Rastreabilidade](M13-library-file/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M14](M14-library-trust/README.md) | Não assinada pode ser aceita com identificação clara; inválida/hash divergente bloqueia; chave alterada não entra silenciosamente; assinatura persiste no roundtrip e secrets não aparecem no DB/logs. | [Rastreabilidade](M14-library-trust/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M15](M15-library-publish/README.md) | Somente editor autorizado publica; vN não muda; falha de upload não deixa versão apontando para blob incompleto; conflito simultâneo é explícito; link resolve snapshot; conteúdo audiovisual/estado pessoal não é enviado. | [Rastreabilidade](M15-library-publish/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M16](M16-library-subscriptions/README.md) | Update e crash em cada fase preservam uma versão válida; progresso/favoritos/overrides/downloads sobrevivem update/unsubscribe/delete remoto; downgrade e mesma versão com outro hash bloqueiam; contexto/foco/playback preservados; snapshot abre sem Registry. | [Rastreabilidade](M16-library-subscriptions/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M17](M17-library-fork/README.md) | Fork transacional com novo libraryId; origem atualizada não altera cópia; Content/Source não duplicados; edição pessoal não muda remote; cancelar não cria cópia parcial. | [Rastreabilidade](M17-library-fork/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M18](M18-tv-session/README.md) | Fluxo real em Windows/TV sem terminal/desktop/mouse; áudio/vídeo e hardware encode quando disponível; foco retorna após MPV; reconectar preserva estado; sair encerra helpers dentro de timeout. | [Rastreabilidade](M18-tv-session/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M19](M19-playback-fallback/README.md) | Source lenta/sem peers produz retry/alternativa; auto-switch off impede troca; incompatibilidade de edição impede handoff automático; posição preservada; override original não apagado; histórico antigo perde peso; não há loop de troca. | [Rastreabilidade](M19-playback-fallback/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M20](M20-diagnostics/README.md) | Dados reais distinguem desconhecido de zero; export não inclui secrets/magnets privados/paths pessoais; logs e histórico não crescem sem limite; limpeza não apaga biblioteca; UI técnica é opcional. | [Rastreabilidade](M20-diagnostics/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M21](M21-backup-recovery/README.md) | Backup consistente em runtime restaura catálogo/estado/subscriptions/config; falha preserva original; migração fresh e upgrade histórico passam; crashes UI/Core/torrentd/MPV e sync/playback concorrentes têm recuperação observável; nenhum fechamento espera indefinidamente. | [Rastreabilidade](M21-backup-recovery/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |
| [M22](M22-release-update/README.md) | Instalar/abrir/atualizar/desinstalar conforme política preserva dados prometidos; upgrade histórico e smoke empacotado passam; budgets/segurança/nightly aplicáveis verdes; mesma identidade/hash do artefato promovido; Stable requer aprovação manual. | [Rastreabilidade](M22-release-update/PREPARATION_COVERAGE.md), S00–S08 e checkpoints |

## Dependências e fase frontend

Integração prevista, sem ciclos: M01 → M02 → M06 → M03 → M04 → M05 → M12 → M13 → M14 → M07 → M08 → M09 → M10 → M11 → M15 → M16 → M17 → M18 → M19 → M20 → M21 → M22. Essa lista preserva as ondas B–D do plano, não autoriza executá-las agora.

M03 depende de M06 real, embora sua UI venha primeiro. M04 fornece leitura local a M13/M16; os dados de subscription futuros podem ser simulados e não geram dependência circular. M05 prova arquivo local sem depender de streaming. M14 exige pacote M13; M13 rejeita assinatura não verificável até existir M14. M18 depende de playback real M05/M07 e valida hardware; simulação de sessão não o encerra. M22 exige evidência global, não apenas soma de frontends aprovados.

S00–S02 de toda a fase M01–M22 usam mocks; contratos definitivos, backend, persistência e integrações permanecem adiados até UX dessa fase aprovada e autorização de execução. Os contratos previstos são recortes para orientar a experiência, sujeitos a refinamento em S03. S08 só poderá concluir um milestone com dependências e aceites reais.

## Preservação e alterações simultâneas

M01–M04 já tinham preparação; foi adicionada cobertura por requisito e atualizada a visão de preparação. A dependência antiga M01–M18 em S03 de M01 foi alinhada à política vigente M01–M22. M05–M22 possuem preparação completa e cenários próprios. O checkout já continha alterações de código antes desta tarefa e recebeu novos avanços simultâneos em M04 e registros de preparação M05; não são atribuídos a esta preparação documental.

M04: STATE registra `ux: approved` com a citação “aprovado”, mas o arquivo UX_CHECKPOINT mantém NOT_STARTED/PENDING. O registro foi preservado junto com a divergência; não há evidência suficiente para reconciliar o aceite automaticamente. Consultar o estado/stories atuais da implementação, que avançou simultaneamente, e confirmar a atribuição da evidência antes de usar esse aceite para avançar. Isso não impede completar PREPARE.

## Decisões ainda pendentes

- M05/M11: budget de perda de progresso, threshold de assistido e countdown; M05/M18: composição/captura/foco entre UI e MPV.
- M06/M13/M16: limites mensuráveis de entradas, containment, allowlists e forma canônica do manifest; M07/M08/M10: prioridades, pesos, TTL e eviction.
- M14/M21: perda/rotação/backup de chaves e compatibilidade com secure storage; M15/M16: serviço remoto, auth, ambiente e limites aprovados.
- M18: sinal verificável de sessão Sunshine, versões suportadas e hardware Windows/TV/gamepad; M19: compatibilidade de edição/duração e cooldown.
- M20: redação/retenção/limites de diagnóstico; M21: política de restore, tentativas e budgets de recovery; M22: candidato assinado, canal/versão, baseline e promoção do mesmo artefato.

Cada README indica momento de resolução em S00/UX/S03; [SOURCE_ANALYSIS](SOURCE_ANALYSIS.md) conserva D01–D22 e suas fontes. D02 contém o recorte histórico M01–M18; a política posterior no GOAL/PLAN amplia a exigência a M01–M22. Não foi escolhido um valor definitivo ou serviço externo para encerrar a preparação. Essas pendências bloqueiam somente implementação/aceite dependentes delas.

## Arquivos entregues

- M05–M22: README, UPDATE, PREPARATION_COVERAGE, UX_CHECKPOINT, FUNCTIONAL_CHECKPOINT e nove stories por milestone.
- M01–M04: PREPARATION_COVERAGE e complemento de UPDATE; correções pontuais de política/estado documental, preservando evidências e checkpoints existentes.
- Globais: docs/execution/GOAL.md, STATE.yaml e UPDATE.md; docs/milestones/PLAN.md, README.md, REQUIREMENTS_COVERAGE.md e este relatório.

Próxima ação pertence à implementação autorizada e ao estado corrente; esta conclusão não concede autorização nova de execução, aprovação humana, merge, publicação ou expansão para M23–M28.

## Resultado das verificações finais

Checagem documental executada: 22 milestones, 198 stories, 44 checkpoints, 445 requisitos (227 FR/160 NFR/58 RX), 80 jornadas; zero erros de estrutura, ownership, dependências e caminhos locais. STATE.yaml carregado pelo parser YAML com 22 evidências de preparação e status complete. `git diff --check` passou. Âncoras antigas de M05 foram redirecionadas para Stories e PREPARATION_COVERAGE. Nenhum teste de produto foi executado por esta tarefa.

## Reconciliação posterior — execução M04

Em 2026-09-13, a execução M04 conferiu o checkpoint específico M03: o “aprovado” registrado corresponde a M03 após correção do ícone de Séries. STATE agora preserva esse aceite em previous_M03_ux e registra M04 READY_FOR_REVIEW/PENDING após S00–S02. Isso resolve a divergência histórica descrita acima; não modifica os resultados da preparação. Ver [evidências M04](M04-home-search/evidence/VALIDATION.md).
