# Plano de milestones — Ushark

Status: **MAPA APROVADO PELO USUÁRIO**. Data: 2026-09-12. Nenhuma implementação autorizada por este documento.

O plano organiza capacidades verticais, preserva os requisitos originais e identifica os refinamentos presentes nas jornadas e na arquitetura. Os IDs M01–M28 abaixo foram **aprovados no mapa**; não são equivalentes aos exemplos M00–M08 do roadmap anterior. A aprovação deste mapa não equivale à aprovação futura da UX nem autoriza publicação externa.

## Base e cobertura

Foram analisados os quatro documentos de produto, as onze especificações de arquitetura e os documentos de orientação da raiz. [Análise das fontes e pendências](SOURCE_ANALYSIS.md). A [matriz completa](REQUIREMENTS_COVERAGE.md) contém uma linha por FR/NFR, os complementos rastreáveis e as 80 jornadas.

- 227 FRs e 160 NFRs originais: todos alocados, sem alterar seus IDs.
- 58 complementos RX: requisitos/refinamentos sem ID próprio nos documentos originais.
- 6 grupos FUT: intenções explicitamente futuras, preservadas com destino de descoberta, sem fingir especificação ou implementação concluída.
- 22 milestones de entrega v1/P1 e 6 destinos de descoberta futura. Os futuros não são pré-requisito da v1.
- Cobertura significa **responsabilidade planejada**, não implementação/teste/aprovação. Nenhum requisito está DONE.

## Ordem e limites de execução

**Primeiro, provar a experiência completa com mocks.** Autorização posterior em 2026-09-13 permite preparar sequencialmente todos os milestones M01–M22; implementação continua uma story por vez e sujeita aos checkpoints. A primeira story executável de UI é S01; S00 apenas define contrato de experiência, estados, escopo e aceite.

Cada milestone percorre:

1. **S00 — contrato de experiência:** jornada, rotas, estados, requisitos e limites; sem schema completo de banco ou RPC prematuro.
2. **S01 — UI mockada:** fluxo inspecionável com serviços substituíveis e fixtures neutras.
3. **S02 — comportamento frontend:** interação, validação, foco, gamepad/teclado, loading/vazio/erro/offline, cancelamento e recuperação.
4. **Checkpoint UX humano:** registrar a aprovação. Sem ela, não iniciar backend, runtime, infraestrutura ou integração real correspondente.
5. **S03 — contrato de domínio necessário:** formalizar apenas o que o fluxo aprovado exige.
6. **S04 — adapters reais mínimos:** persistência, provider, processo ou serviço apenas quando derivados desse contrato; fracionar trabalho grande em sub-stories futuras.
7. **S05 — integração:** substituir mocks preservando a UX. Validar a jornada real no checkpoint funcional humano.
8. **S06 — testes pertinentes; S07 — hardening; S08 — closure:** evidências funcionais, NFRs aplicáveis, segurança, performance, revisão, CI e merge quando houver implementação. Testes/segurança necessários já acompanham as stories anteriores; não são adiados até S06/S07.

Todos os milestones têm duas dependências distintas: a **UI pode simular capacidades ainda ausentes**, enquanto a **integração e o fechamento exigem as dependências reais listadas**. Nenhum milestone com runtime/persistência pendente pode ser fechado só porque seu mock está pronto.

### Onda A — experiência principal, sem integrações reais

Percorrer S00–S02 e os checkpoints UX de M01 a M22, uma story por vez. M01 fornece o shell mínimo para inspecionar onboarding → Home vazia; os demais acrescentam fluxos verticais simulados. A preparação antecipada S00–S08 foi autorizada pelo usuário em 2026-09-13; isso não antecipa execução ou contratos definitivos. Para milestones cujo frontend depende de outro, reutilizar a interface mockada já aprovada.

A UX de M01–M22 deve estar aprovada antes da primeira persistência/provider/runtime real. A diretriz posterior do usuário — “o backend pode continuar pendente até o fim” — estende a precedência da UX principal (M01–M18) definida em Architecture 11 §35 até o fim da fase frontend planejada. Pendências de backend não bloqueiam a próxima fatia frontend após aceite UX; permanecem exigidas para integração e closure. M23–M28 continuam fora do escopo executável. As sequências de integração descritas por milestone serão retomadas nas ondas seguintes, após essa fase. O shell, mocks e testes frontend são ferramentas para inspecionar o produto; CI básico entra após a experiência inicial aprovada, sem antecipar pipelines nativos/deploy/release. Teste manual da UI transmitida por Sunshine já instalado pode ocorrer cedo, sem automação/serviço novo.

### Onda B — completar capacidades locais

Ordem sugerida de integração: **M01 → M02 → M06 → M03 → M04 → M05 → M12 → M13 → M14**. M06 precede a integração de packs em M03, apesar de a UI de séries aparecer antes. M05 usa arquivo local autorizado como fixture de mídia e não depende de streaming real. M13 entrega compartilhamento por arquivo, sem Registry.

### Onda C — streaming e curadoria remota

**M07 → M08 → M09 → M10 → M11 → M15 → M16 → M17 → M18 → M19**. Essa é uma ordem sugerida sem ciclos; dependências reais permitem adiantar M15 após M14 e M18 após M07, se a prioridade de produto aprovada assim indicar. Não há trabalho paralelo de agentes previsto.

### Onda D — recuperação e distribuição

**M20 → M21 → M22**. Não adiar segurança/crash recovery mínimos dos componentes para esta onda: aqui se comprovam a visão integrada, backup e entrega completa. Infra de release só nasce para distribuir a experiência validada. Recursos FUT permanecem fora dessas ondas.

## Mapa de capacidades

| ID | Milestone | Estado inspecionável ao concluir | Dependências reais | Escopo |
|---|---|---|---|---|
| [M01](#m01) | Entrar no app e configurar a biblioteca | Onboarding concluído, diretórios e preferências iniciais preservados ao reabrir. | — | Entrega v1/P1 planejada |
| [M02](#m02) | Cadastrar e organizar filmes | Filme manual ou identificado pelo provider aparece na lista e nos detalhes após restart. | M01 | Entrega v1/P1 planejada |
| [M03](#m03) | Importar e organizar séries e episódios | Season pack e episódios avulsos aparecem corretamente e mantêm os mapeamentos ao reabrir. | M02, M06 | Entrega v1/P1 planejada |
| [M04](#m04) | Encontrar conteúdo e continuar pela Home | Home, busca global e filtros levam ao mesmo Content e restauram foco/contexto. | M02, M03 | Entrega v1/P1 planejada |
| [M05](#m05) | Assistir mídia local e retomar | Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva. | M02 | Entrega v1/P1 planejada |
| [M06](#m06) | Adicionar torrents e resolver arquivos | Usuário importa, revisa arquivos e mantém tentativa pendente para retry. | M02 | Entrega v1/P1 planejada |
| [M07](#m07) | Reproduzir torrent progressivamente e buscar outra posição | Filme e episódio tocam parcialmente; seek descarta trabalho antigo e reconstrói buffer. | M03, M05, M06 | Entrega v1/P1 planejada |
| [M08](#m08) | Escolher a fonte adequada antes do Play | Details mostra medição progressiva e a escolha automática respeita preferências e limites reais. | M07 | Entrega v1/P1 planejada |
| [M09](#m09) | Baixar, pausar e retomar conteúdo | Download sobrevive ao restart e pode ser acompanhado e controlado. | M06, M07 | Entrega v1/P1 planejada |
| [M10](#m10) | Controlar espaço e retenção com segurança | Usuário inspeciona uso/liberação estimada, aplica política e promove cache para Keep sem redownload. | M09 | Entrega v1/P1 planejada |
| [M11](#m11) | Assistir episódios em sequência | Countdown cancelável e próximo episódio correto, com preflight limitado. | M03, M07, M08 | Entrega v1/P1 planejada |
| [M12](#m12) | Criar curadoria e visualizar como assinante | Draft persistido com identidade, coleções/seções e preview fiel. | M02, M03 | Entrega v1/P1 planejada |
| [M13](#m13) | Trocar bibliotecas por arquivo | .tslib exportado abre em outro perfil local com preview, layout e identidade preservados. | M12, M04 | Entrega v1/P1 planejada |
| [M14](#m14) | Verificar autoria e proteger identidade | Cliente verifica assinatura e lembra a identidade aceita; autor pode assinar pacote. | M13 | Entrega v1/P1 planejada |
| [M15](#m15) | Publicar uma versão e compartilhar seu link | Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação. | M14 | Entrega v1/P1 planejada |
| [M16](#m16) | Assinar e atualizar sem perder estado pessoal | Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais. | M15, M04 | Entrega v1/P1 planejada |
| [M17](#m17) | Duplicar curadoria e reorganizar pessoalmente | Fork possui novo ID, mantém apresentação e reutiliza conteúdos sem seguir updates da origem. | M12, M16 | Entrega v1/P1 planejada |
| [M18](#m18) | Assistir pela TV via Sunshine e Moonlight | TV abre app, controla player, desconecta/reconecta e sai corretamente. | M05, M07 | Entrega v1/P1 planejada |
| [M19](#m19) | Recuperar reprodução com outra fonte e aprender do histórico | Fallback compatível retoma posição e histórico ajuda decisões futuras sem depender de servidor. | M08 | Entrega v1/P1 planejada |
| [M20](#m20) | Inspecionar e limpar dados de diagnóstico | Painel técnico mostra runtime e exporta diagnóstico sanitizado; usuário limpa históricos/logs seletivamente. | M10, M11, M16, M18, M19 | Entrega v1/P1 planejada |
| [M21](#m21) | Recuperar biblioteca após falhas e restaurar backup | Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa. | M20, M17 | Entrega v1/P1 planejada |
| [M22](#m22) | Instalar e atualizar uma versão verificável | Candidato Windows x64 inspecionável, assinado e rastreável; promoção mantém o mesmo artefato. | M21 | Entrega v1/P1 planejada |
| [M23](#m23) | Coleções inteligentes | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M17, M19 | Descoberta futura, não executável ainda |
| [M24](#m24) | Descoberta e acesso a bibliotecas | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M16 | Descoberta futura, não executável ainda |
| [M25](#m25) | Interação social e edição colaborativa | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M24 | Descoberta futura, não executável ainda |
| [M26](#m26) | Personalizar reprodução avançada | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M18 | Descoberta futura, não executável ainda |
| [M27](#m27) | Extensibilidade controlada | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M22 | Descoberta futura, não executável ainda |
| [M28](#m28) | Evoluir compatibilidade e operação opcional | Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias. | M22 | Descoberta futura, não executável ainda |

## Critérios comuns de conclusão

Cada milestone deve demonstrar os requisitos primários e revalidar invariantes transversais que toca. O ownership único da matriz evita dupla responsabilidade; não isenta os demais milestones de segurança, privacidade, acessibilidade, performance, modularidade e persistência.

O milestone primário introduz a garantia no seu fluxo. Um requisito transversal só recebe aceite global quando os fluxos consumidores também tiverem evidência. Por exemplo, M01 comprova gamepad no onboarding/shell; FR-075/NFR-122 só terão comprovação de todas as funções essenciais após os demais fluxos e a sessão real de M18. M22 audita essa cobertura global; não basta somar milestones visualmente concluídos.

| Garantia transversal | Introdução / owner | Revalidação necessária |
|---|---|---|
| Biblioteca, ordem e memberships persistentes (FR-002) | M02 | M03, M12, M13, M16, M17; auditoria M22. |
| Correção manual e identidade estável (FR-007/019/020/223) | M02/M03 | M06, M13, M16, M17; não perder estado no merge. |
| Gamepad, foco, estados e legibilidade (FR-075–080/220; NFR-122–127) | M01/M18 | Toda nova tela; fluxo Windows/TV M18 e regressão M22. |
| Estado pessoal e overrides (FR-124/127/224/227) | M05/M02/M08 | M13, M16, M17, M19, M21. |
| Deduplicação e proteção de dados ativos (FR-033/051) | M06/M07 | M03, M09, M10, M11, M16, M17, M19. |
| UI local-first e não bloqueante | M01–M04 | Toda integração; comparar baseline com M07, M16, M18 e M22. |
| Segurança de fronteiras e contratos | M01/M06/M13 | Cada introdução/alteração de arquivo, rede, processo, deep link, assinatura ou publicação. |
| Persistência, migrações, isolamento e recovery | M02/M05/M06 | Toda superfície persistente; matriz integrada em M21 e upgrade em M22. |
| Privacidade, logs limitados e sem secrets | Desde o primeiro adapter real | M14–M16, M20 e artefatos de M22; não adiar sanitização para diagnóstico. |

- UX aprovada com caminho principal, vazio, loading, erro, offline/degradado e ações recuperáveis quando aplicáveis; funções essenciais via gamepad; foco preso/restaurado corretamente.
- Contratos proporcionais, sem dependências proibidas; mocks continuam utilizáveis para desenvolvimento isolado. Infra adicionada tem referência à necessidade do frontend aprovado.
- Jornada real demonstrada depois da integração; dados confirmados sobrevivem ao restart quando requerido. Testes de mocks não comprovam processo, disco, rede ou autenticação reais.
- Validações aplicáveis passam, com ambiente, versão, amostras e resultado registrados. Regressões críticas de segurança/estado/performance bloqueiam fechamento. Mudança necessária de UX volta à revisão.
- S08 registra cobertura, evidências, dívida e limitações; código revisado/CI verde/integrado segundo as regras do repositório. Nada disso foi executado nesta etapa documental.

### Budgets e evidências

Os números já documentados são metas em ambiente compatível e controlado: cold start <2s; warm start <500ms; biblioteca indexada visível <300ms após UI pronta (p95); navegação local <100ms (p95); poster cacheado dimensionado <50ms; alvo 60 FPS; feedback de Play <250ms; Play→primeiro frame 1–5s e seek→retomada 1–3s com source saudável; ranking local <10ms excluindo probes. Startup de torrent não é garantia em swarm arbitrário.

Antes de exigir aprovação quantitativa, S00/S03 do milestone responsável fixa hardware/OS/resolução, corpus, warm/cold, amostras/percentil, limites de perda de progresso e tolerância a ruído. Não transformar exemplos como cache 100GB, confiança 0,60, eviction ou regressão 15% em decisões aprovadas automaticamente. Comparar baseline e orçamento absoluto; registrar evidência manual na TV em M18/M22.

## Milestones detalhados

<a id="m01"></a>

### M01 — Entrar no app e configurar a biblioteca

- **ID:** M01.
- **Objetivo:** Chegar do primeiro acesso a uma Home vazia utilizável por controle.
- **Resultado esperado:** Onboarding concluído, diretórios e preferências iniciais preservados ao reabrir.
- **Escopo:** Shell Electron, layout TV/desktop, rotas, tokens, foco espacial, estados globais, onboarding, qualidade/resolução, idiomas, automação, defaults e configuração local mínima.
- **Requisitos cobertos (primários):** FR-001, FR-075–FR-080, FR-187–FR-193, FR-214–FR-218, FR-220, NFR-004–NFR-009, NFR-065, NFR-116, NFR-123–NFR-127, NFR-137–NFR-138, NFR-142, NFR-146, NFR-149, NFR-158–NFR-159, RX-001, RX-002, RX-003, RX-004, RX-049, RX-057. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** —. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Primeiro acesso, cancelar/voltar e reabrir preservam configuração; gamepad e teclado funcionam; UI inicia offline; renderer isolado; gates frontend básicos passam. Aplicam-se também os critérios comuns acima.
- **Riscos:** Inflar a fundação com telas ou serviços futuros; seleção de pasta na TV; defaults ainda não normativos.
- **Sequência sugerida de execução:** Onboarding e Home vazia com mocks → navegação/foco/configuração simulada → UX → contrato mínimo de configuração → persistir só configuração e biblioteca vazia → reabrir e validar. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m02"></a>

### M02 — Cadastrar e organizar filmes

- **ID:** M02.
- **Objetivo:** Transformar uma identificação de filme em um item organizado e durável.
- **Resultado esperado:** Filme manual ou identificado pelo provider aparece na lista e nos detalhes após restart.
- **Escopo:** Cadastro pelo título e entrada por source simulada; TMDB por adapter; IDs externos, múltiplas fontes declaradas, conteúdo sem fonte, edição de identificação, metadata/imagens locais, favoritos, remoção de membership separada de delete físico.
- **Requisitos cobertos (primários):** FR-002–FR-003, FR-006–FR-008, FR-019, FR-021–FR-025, FR-028, FR-034–FR-036, FR-087, FR-090–FR-091, FR-127, FR-205, FR-211–FR-212, FR-223–FR-224, NFR-010–NFR-013, NFR-051–NFR-052, NFR-062–NFR-063, NFR-089, NFR-108, NFR-119, NFR-129, NFR-132–NFR-133, NFR-141, NFR-155, RX-005, RX-006, RX-007, RX-050. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M01. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Criar, corrigir, favoritar, remover source e reabrir sem perder Content; provider indisponível permite cadastro manual; overrides não contaminam metadata global; imagens têm fallback/cache. Aplicam-se também os critérios comuns acima.
- **Riscos:** Merge de IDs e estado concorrente; catálogo externo incompleto; confundir source declarada com torrent resolvido.
- **Sequência sugerida de execução:** Lista/cadastro/details com provider e torrent mockados → ambiguidade/manual/erros → UX → contratos de Content/metadata → armazenamento e TMDB mínimos → validar cadastro real; resolução torrent será M06. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m03"></a>

### M03 — Importar e organizar séries e episódios

- **ID:** M03.
- **Objetivo:** Representar série, temporadas e episódios com associação corrigível de arquivos.
- **Resultado esperado:** Season pack e episódios avulsos aparecem corretamente e mantêm os mapeamentos ao reabrir.
- **Escopo:** Hierarquia, especiais, múltiplas temporadas, padrões SxxExx/1x01/Season Episode, seleção/revisão manual e deduplicação sem fundir episódios distintos.
- **Requisitos cobertos (primários):** FR-004–FR-005, FR-017–FR-018, FR-020, FR-206, NFR-080, RX-008. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M02, M06. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Importar pack, corrigir arquivo ambíguo e reabrir com mesmos selectors; múltiplos episódios compartilham runtime sem confundir suas identidades; dados ausentes não bloqueiam revisão. Aplicam-se também os critérios comuns acima.
- **Riscos:** Nomeação ambígua, episódios duplos sem regra definida, diferença entre Source e selector por episódio.
- **Sequência sugerida de execução:** Lista/série/temporada/revisão com fixtures → casos especiais e ambíguos → UX → contrato de episódio/selector → integrar inspeção M06 e metadata M02 → validar pack real. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m04"></a>

### M04 — Encontrar conteúdo e continuar pela Home

Preparação: [S00–S08 e checkpoints](M04-home-search/README.md) conferidos. M04 concluiu S00–S02 e está READY_FOR_REVIEW/PENDING; integração adiada. A divergência de atribuição do aceite foi reconciliada com o checkpoint específico M03. M03 tem UX aprovada.

- **ID:** M04.
- **Objetivo:** Permitir descoberta local rápida entre todas as origens.
- **Resultado esperado:** Home, busca global e filtros levam ao mesmo Content e restauram foco/contexto.
- **Escopo:** Hero, continuar assistindo, filmes/séries/recentes, favoritos/gêneros/coleções, memberships, busca por título/original/episódio/biblioteca/coleção, FTS5, paginação, virtualização e indexação incremental por watcher.
- **Requisitos cobertos (primários):** FR-060, FR-081–FR-086, FR-168–FR-173, FR-175–FR-181, NFR-001–NFR-003, NFR-014–NFR-017, NFR-061, NFR-072, NFR-079, NFR-081–NFR-082, NFR-128, NFR-145, NFR-157, RX-009, RX-010, RX-011. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M02, M03. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Busca independe de cards montados e da internet; alterar um arquivo reindexa apenas o afetado; Home não espera scan, provider ou health; listas grandes preservam foco; fontes futuras de subscriptions entram pelo mesmo contrato. Aplicam-se também os critérios comuns acima.
- **Riscos:** N+1, saltos de layout, teclado virtual não especificado, nomes de biblioteca duplicando resultados.
- **Sequência sugerida de execução:** Home/busca/filtros com biblioteca grande simulada → navegação/restauração/hydration → UX → consultas e watcher exigidos → índice local incremental → medir budgets e validar alterações externas. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m05"></a>

### M05 — Assistir mídia local e retomar

Preparação: [S00–S08 detalhadas](M05-local-playback/README.md#stories), status PREPARED em 2026-09-13; nenhuma story executada. Backend e integração adiados conforme GOAL.

- **ID:** M05.
- **Objetivo:** Provar a jornada de reprodução sem depender de swarm.
- **Resultado esperado:** Arquivo já disponível toca no MPV, aceita controles e retoma da posição salva.
- **Escopo:** Details → preparar → player → details; play/pause/seek, áudio, legendas internas/externas, volume/mute, fullscreen, hardware decode, progresso, assistido, histórico e retomada offline.
- **Requisitos cobertos (primários):** FR-057–FR-058, FR-061–FR-069, FR-124–FR-126, FR-174, FR-209, NFR-020, NFR-053, NFR-064, NFR-070–NFR-071, NFR-073, NFR-075, NFR-084, NFR-115, NFR-140, RX-012, RX-013, RX-014, RX-015. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M02. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** MPV separado toca mídia controlada; tracks mudam sem reiniciar source; sair salva imediatamente; crash do MPV preserva UI; progresso periódico tem budget explícito; primeira imagem é observada, não inferida do lançamento do processo. Aplicam-se também os critérios comuns acima.
- **Riscos:** Composição do overlay React com janela MPV; diferença de codecs/hardware; sinal confiável de primeiro frame; threshold assistido indefinido.
- **Sequência sugerida de execução:** Player mock e estados → controles/retomar/recomeçar/erro → UX → PlayerService e persistência do progresso → MPV em arquivo local de teste → validar reprodução e recovery. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m06"></a>

### M06 — Adicionar torrents e resolver arquivos

- **ID:** M06.
- **Objetivo:** Converter magnet ou .torrent em fontes reais inspecionáveis.
- **Resultado esperado:** Usuário importa, revisa arquivos e mantém tentativa pendente para retry.
- **Escopo:** torrentd/libtorrent estritamente para inspeção e lifecycle requerido; validação magnet/bencode/paths, cópia gerenciada, metadata timeout, arquivos/samples/extras, selectors, infoHash, deduplicação de sessões e eventos progressivos.
- **Requisitos cobertos (primários):** FR-009–FR-016, FR-029–FR-033, FR-044, FR-210, NFR-083, NFR-086–NFR-088, NFR-139, NFR-151, RX-016, RX-017, RX-018, RX-019, RX-051. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M02. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Importar ambos os formatos, cancelar e salvar pendente; entradas maliciosas rejeitadas; fonte reutilizada sem runtime redundante; UI continua disponível após falha do daemon; IPC local validado e autenticado conforme transporte. Aplicam-se também os critérios comuns acima.
- **Riscos:** Binding nativo e empacotamento Windows; metadata sem peers; process isolation não comprovada por tipos; limites de entrada precisam ser fechados.
- **Sequência sugerida de execução:** Import wizard com arquivos/peers simulados → timeout/retry/pendente/cancelar → UX → contrato de inspeção e operações → daemon/IPC mínimos → inspecionar torrents reais de teste. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m07"></a>

### M07 — Reproduzir torrent progressivamente e buscar outra posição

- **ID:** M07.
- **Objetivo:** Começar antes do download completo e alimentar o player na posição correta.
- **Resultado esperado:** Filme e episódio tocam parcialmente; seek descarta trabalho antigo e reconstrói buffer.
- **Escopo:** Integração torrentd/MPV, probe parcial, HEAD/TAIL, mapping tempo/byte/piece, janelas/deadlines, buffers adaptativos, cache RAM/disco mínimo limitado, Stream Only, prioridades de playback e falhas recuperáveis.
- **Requisitos cobertos (primários):** FR-037–FR-043, FR-045–FR-046, FR-051–FR-052, FR-226, NFR-018–NFR-019, NFR-022–NFR-028, NFR-040–NFR-042, NFR-048, NFR-069, NFR-076–NFR-078, RX-020, RX-021, RX-022, RX-023. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M03, M05, M06. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Play antes de completar e seek fora do cache comprovados; seeks rápidos respeitam última geração; season pack prioriza episódio atual; nenhum arquivo ativo é limpo; UI não bloqueia; startup 1–5s e seek 1–3s medidos em source saudável controlada. Aplicam-se também os critérios comuns acima.
- **Riscos:** MPV lendo holes de arquivo parcial; VBR/índice ausente; disputa de I/O; HTTP Range só se arquivo parcial demonstrar insuficiência.
- **Sequência sugerida de execução:** Playback parcial e timeline mockados → buffering/seek rápido/source lenta → UX → contrato stream/posição/readiness → scheduler e delivery mínimos → comparar primeiro frame, seek e buffer sob carga. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m08"></a>

### M08 — Escolher a fonte adequada antes do Play

- **ID:** M08.
- **Objetivo:** Traduzir medições locais em recomendação explicável.
- **Resultado esperado:** Details mostra medição progressiva e a escolha automática respeita preferências e limites reais.
- **Escopo:** Preflight em details/foco com cancelamento e orçamento; Health 0–100, barras/labels/confidence/ratio/startup; métricas úteis/availability/estabilidade; ranking local mecânico, cache/hardware, override e fontes de múltiplas origens válidas.
- **Requisitos cobertos (primários):** FR-088–FR-089, FR-092–FR-111, FR-221, FR-227, NFR-021, NFR-029–NFR-038, NFR-130, NFR-143, RX-024, RX-025, RX-026, RX-056. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M07. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Play permitido durante medição; arquivo local funciona sem health de rede; ranking determinístico com reason codes; usuário pode retirar override; 4K inviável não vence por resolução; sem flicker; ranking local <10ms no conjunto controlado. Aplicam-se também os critérios comuns acima.
- **Riscos:** Confundir bytes/s com bits/s; falsa precisão; peers iniciais gerando falso indisponível; calibrar pesos apresentados como exemplos.
- **Sequência sugerida de execução:** Details/lista de fontes com cenários contrastantes → preferências/override/medindo → UX → contrato metrics/Health/ranking → medições reais e seleção → ensaios determinísticos e validação pelo player. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m09"></a>

### M09 — Baixar, pausar e retomar conteúdo

- **ID:** M09.
- **Objetivo:** Gerenciar downloads sem perder a biblioteca ou prejudicar playback.
- **Resultado esperado:** Download sobrevive ao restart e pode ser acompanhado e controlado.
- **Escopo:** Fila, progresso, velocidade, peers, tamanho/destino/health, pausar/retomar/cancelar, prioridade, download completo, resume data e limites de sessão/download/upload.
- **Requisitos cobertos (primários):** FR-054, FR-056, FR-059, FR-116–FR-123, NFR-054, NFR-067–NFR-068, RX-027. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M06, M07. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Baixar/pause/restart/resume funciona sem recheck global desnecessário; cancelamento preserva catálogo; apagar dados é confirmação distinta; download em background cede para playback; falta de espaço pausa escrita com feedback. Aplicam-se também os critérios comuns acima.
- **Riscos:** Disco cheio, resume inválido, cancelamento concorrente, saturação LAN e sessões duplicadas.
- **Sequência sugerida de execução:** Downloads e destino mockados → prioridades/restart/cancelar com e sem dados → UX → contratos download/resume → persistência e comandos reais → testar retomada e concorrência. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m10"></a>

### M10 — Controlar espaço e retenção com segurança

- **ID:** M10.
- **Objetivo:** Permitir assistir temporariamente ou manter dados sem apagar estado importante.
- **Resultado esperado:** Usuário inspeciona uso/liberação estimada, aplica política e promove cache para Keep sem redownload.
- **Escopo:** Cache configurável, auto cleanup/LRU, retenção de parciais/favoritos/Keep, proteção de ativo, promoção/demotion explícita, volumes separados, reconciliação e reparo de cache corrompido.
- **Requisitos cobertos (primários):** FR-047–FR-050, FR-053, FR-055, FR-207–FR-208, NFR-043–NFR-047, NFR-049–NFR-050, NFR-060, RX-028. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M09. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Limpeza libera somente elegíveis; ativo/download/Keep/protegido permanece; limite considera espaço físico real; promoção reaproveita bytes; corrupção reconstrói cache sem afetar progresso/metadata; alteração de pasta tem tratamento de falha. Aplicam-se também os critérios comuns acima.
- **Riscos:** GC com corrida, movimentação entre volumes, confusão entre cache e biblioteca; ordem de eviction diverge entre exemplos.
- **Sequência sugerida de execução:** Tela de espaço com simulação de uso e economia → protegidos/disco cheio/corrupção → UX → contrato de elegibilidade e retenção → política/índice/filesystem reais → testar limpeza e recuperação. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m11"></a>

### M11 — Assistir episódios em sequência

- **ID:** M11.
- **Objetivo:** Reduzir interrupções sem tomar o controle do usuário.
- **Resultado esperado:** Countdown cancelável e próximo episódio correto, com preflight limitado.
- **Escopo:** Sequência, autoplay configurável, tocar agora/cancelar, fim de temporada/série, preflight antes do final, prioridades por arquivo e política de preparação.
- **Requisitos cobertos (primários):** FR-129–FR-132, RX-029. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M03, M07, M08. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Autoplay desligado não inicia próximo; cancelamento funciona; pack reutiliza sessão; próximo episódio não rouba banda do atual; episódio ausente possui saída recuperável. Aplicam-se também os critérios comuns acima.
- **Riscos:** Especial/ordem de episódios, contagem antecipada, erro de seleção e prefetch excessivo.
- **Sequência sugerida de execução:** Fim de episódio/countdown mockados → cancelamento/último episódio/falha → UX → contrato NextEpisode → integrar scheduler/seleção → validar sequência real. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m12"></a>

### M12 — Criar curadoria e visualizar como assinante

- **ID:** M12.
- **Objetivo:** Organizar uma biblioteca própria sem publicar alterações acidentalmente.
- **Resultado esperado:** Draft persistido com identidade, coleções/seções e preview fiel.
- **Escopo:** Nome/descrição/autor/avatar/logo/banner/accent, conteúdos e fontes selecionadas, hero/carousel/grid/continue-watching local, coleções determinísticas, ordenação e overrides de apresentação escopados.
- **Requisitos cobertos (primários):** FR-026–FR-027, FR-133–FR-143, FR-225, NFR-109, RX-030, RX-031. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M02, M03. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Reordenar/renomear preserva IDs; salvar e reabrir mantém draft; preview reproduz layout; estado pessoal não compõe dados exportáveis; curadoria não força runtime nem muda Content global. Aplicam-se também os critérios comuns acima.
- **Riscos:** Editor grande demais, confundir Collection com Section, UX avançada no controle versus desktop secundário.
- **Sequência sugerida de execução:** Editor/preview com mocks → ordenação/validações/vazio → UX → contrato draft/coleção/presentation → persistência local mínima → comparar editor e preview. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m13"></a>

### M13 — Trocar bibliotecas por arquivo

- **ID:** M13.
- **Objetivo:** Transferir curadoria de forma portátil e segura sem conta ou rede.
- **Resultado esperado:** .tslib exportado abre em outro perfil local com preview, layout e identidade preservados.
- **Escopo:** Manifest/schema e validação semântica, canonicalização/hash, snapshots imutáveis, pacote sem mídia/estado pessoal, sandbox/limites, assets, import atômico, deduplicação e compatibilidade de schema.
- **Requisitos cobertos (primários):** FR-144–FR-150, FR-152, FR-194–FR-200, NFR-058–NFR-059, NFR-091–NFR-104, NFR-134–NFR-136, NFR-144, NFR-148, NFR-156, RX-032, RX-033, RX-034, RX-035, RX-052. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M12, M04. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Roundtrip offline entre dois catálogos sem DB original; IDs/referências/ordem preservados; pacote malicioso não muda catálogo; traversal/symlink/ZIP bomb/HTML/CSS/scripts rejeitados; extensões desconhecidas não executam; versões incompatíveis têm erro explícito. Aplicam-se também os critérios comuns acima.
- **Riscos:** Exemplos divergentes de manifest e limites ainda não fechados; extração e TOCTOU; assinatura presente antes de verificador M14.
- **Sequência sugerida de execução:** Export/import/preview mockados → inválido/incompatível/cancelar → UX → schema canônico e limites → serialização/staging/import reais → roundtrip e fixtures de segurança; até M14 rejeitar assinatura que não possa verificar. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m14"></a>

### M14 — Verificar autoria e proteger identidade

- **ID:** M14.
- **Objetivo:** Distinguir biblioteca não assinada, válida, inválida e identidade alterada.
- **Resultado esperado:** Cliente verifica assinatura e lembra a identidade aceita; autor pode assinar pacote.
- **Escopo:** Ed25519 planejado, payload canônico assinado, TOFU, hash, key pinning, secure storage de chave privada, UI de confiança e mudança explícita de chave.
- **Requisitos cobertos (primários):** FR-201–FR-203, NFR-105–NFR-107, RX-036. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M13. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Não assinada pode ser aceita com identificação clara; inválida/hash divergente bloqueia; chave alterada não entra silenciosamente; assinatura persiste no roundtrip e secrets não aparecem no DB/logs. Aplicam-se também os critérios comuns acima.
- **Riscos:** Confundir autenticidade com autorização ou direitos; perda/rotação de chave sem política fechada.
- **Sequência sugerida de execução:** Preview de confiança e assinatura mockados → inválida/chave alterada/cancelamento → UX → contrato identity/trust → assinatura/verificação/storage reais → fixtures de integridade e key change. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m15"></a>

### M15 — Publicar uma versão e compartilhar seu link

- **ID:** M15.
- **Objetivo:** Permitir publicação remota explícita de curadoria validada.
- **Resultado esperado:** Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação.
- **Escopo:** Adapter remoto e Registry mínimo apenas aqui; auth/autorizações/quotas, stage de blobs, concorrência de versão, diff/preview, publicar nova versão baseada em anterior, retirar publicação sem apagar instalações locais.
- **Requisitos cobertos (primários):** NFR-110, RX-037, RX-038, RX-039. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M14. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Somente editor autorizado publica; vN não muda; falha de upload não deixa versão apontando para blob incompleto; conflito simultâneo é explícito; link resolve snapshot; conteúdo audiovisual/estado pessoal não é enviado. Aplicam-se também os critérios comuns acima.
- **Riscos:** Operação de serviço externo, credenciais, backend escolhido ainda indefinido, drift de infraestrutura e signing versus auth.
- **Sequência sugerida de execução:** Publicação/link/diff mockados → falha/conflict/permissão → UX → contrato remoto mínimo → adapter e serviço estritamente necessários → publicar em ambiente de teste e inspecionar snapshot; produção só em entrega autorizada. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m16"></a>

### M16 — Assinar e atualizar sem perder estado pessoal

- **ID:** M16.
- **Objetivo:** Acompanhar curadoria remota mantendo autonomia e funcionamento offline.
- **Resultado esperado:** Versão nova aplica atomicamente; falha mantém versão anterior e dados pessoais.
- **Escopo:** Link/código/deep link com preview; subscription instalada, check manual/auto/pausa, staging/diff/verify/atomic swap, rollback explícito, retry/backoff, origens, hide, salvar na pessoal, unsubscribe e GC por referências.
- **Requisitos cobertos (primários):** FR-128, FR-151, FR-153–FR-164, FR-213, FR-222, NFR-055–NFR-057, NFR-090, RX-040, RX-041, RX-042. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M15, M04. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Update e crash em cada fase preservam uma versão válida; progresso/favoritos/overrides/downloads sobrevivem update/unsubscribe/delete remoto; downgrade e mesma versão com outro hash bloqueiam; contexto/foco/playback preservados; snapshot abre sem Registry. Aplicam-se também os critérios comuns acima.
- **Riscos:** Transação DB/filesystem, duas sincronizações simultâneas, source removida durante playback, override órfão.
- **Sequência sugerida de execução:** Assinar/update/unsubscribe com fixtures → erro/rollback/offline/item focado removido → UX → contrato de sync e versões → fetch/scheduler/staging reais → failure injection e testes entre publicador/assinante. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m17"></a>

### M17 — Duplicar curadoria e reorganizar pessoalmente

- **ID:** M17.
- **Objetivo:** Dar ao assinante uma biblioteca independente editável.
- **Resultado esperado:** Fork possui novo ID, mantém apresentação e reutiliza conteúdos sem seguir updates da origem.
- **Escopo:** Duplicar, editar cópia, provenance opcional, coleções pessoais de conteúdo externo e preservação da subscription original.
- **Requisitos cobertos (primários):** FR-165–FR-167, RX-043. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M12, M16. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Fork transacional com novo libraryId; origem atualizada não altera cópia; Content/Source não duplicados; edição pessoal não muda remote; cancelar não cria cópia parcial. Aplicam-se também os critérios comuns acima.
- **Riscos:** Confundir fork com assinatura; GC removendo assets ainda referenciados.
- **Sequência sugerida de execução:** Duplicar/editar/coleção com mocks → comparar origem/cópia → UX → contrato de fork → operação transacional → atualizar origem e confirmar independência. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m18"></a>

### M18 — Assistir pela TV via Sunshine e Moonlight

- **ID:** M18.
- **Objetivo:** Completar a sessão de sala sem exposição do desktop.
- **Resultado esperado:** TV abre app, controla player, desconecta/reconecta e sai corretamente.
- **Escopo:** Registro/orientação Sunshine, --tv, fullscreen e foco entre janelas, captura de áudio/vídeo, controle virtual/hotplug, política pause/continue na desconexão, encerramento integrado e matriz de versões suportadas.
- **Requisitos cobertos (primários):** FR-070–FR-074, FR-219, NFR-066, NFR-074, NFR-120–NFR-122, RX-044. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M05, M07. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Fluxo real em Windows/TV sem terminal/desktop/mouse; áudio/vídeo e hardware encode quando disponível; foco retorna após MPV; reconectar preserva estado; sair encerra helpers dentro de timeout. Aplicam-se também os critérios comuns acima.
- **Riscos:** Detecção de sessão não especificada, permissões/foco Windows, overlay capturado incorretamente, dispositivos e versões diferentes.
- **Sequência sugerida de execução:** Jornada TV/desconexão simulada → controle/foco/hints/pause/continue → UX → definir sinal de sessão compatível → integrar Sunshine existente → inspeção manual ponta a ponta em LAN. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m19"></a>

### M19 — Recuperar reprodução com outra fonte e aprender do histórico

- **ID:** M19.
- **Objetivo:** Manter playback quando a fonte degrada, respeitando a escolha local.
- **Resultado esperado:** Fallback compatível retoma posição e histórico ajuda decisões futuras sem depender de servidor.
- **Escopo:** Histórico agregado local com expiração, versões de algoritmo, reranking, fallback manual/automático, preparo antes da troca, compatibilidade Content/episódio/duração, cooldown/blacklist temporária.
- **Requisitos cobertos (primários):** FR-112–FR-115, FR-204, NFR-039, RX-045. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M08. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Source lenta/sem peers produz retry/alternativa; auto-switch off impede troca; incompatibilidade de edição impede handoff automático; posição preservada; override original não apagado; histórico antigo perde peso; não há loop de troca. Aplicam-se também os critérios comuns acima.
- **Riscos:** Director’s cut versus versão comum, corrida seek/troca, confiança histórica inadequada, promise de handoff imperceptível.
- **Sequência sugerida de execução:** Queda/alternativa/troca mockadas → consentimento/duração incompatível/cooldown → UX → contrato de fallback/history → coordenação real → ensaios de perda de peers e troca. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m20"></a>

### M20 — Inspecionar e limpar dados de diagnóstico

- **ID:** M20.
- **Objetivo:** Permitir entender problemas sem expor informações pessoais.
- **Resultado esperado:** Painel técnico mostra runtime e exporta diagnóstico sanitizado; usuário limpa históricos/logs seletivamente.
- **Escopo:** Torrent/player/Health/DB/cache, decoder/FPS/drop frames quando disponíveis, razão de escolha, logs estruturados/correlation IDs/rotação/limites, diagnóstico exportável, retenção e limpeza separada.
- **Requisitos cobertos (primários):** FR-182–FR-186, NFR-111–NFR-114, NFR-117, RX-046. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M10, M11, M16, M18, M19. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Dados reais distinguem desconhecido de zero; export não inclui secrets/magnets privados/paths pessoais; logs e histórico não crescem sem limite; limpeza não apaga biblioteca; UI técnica é opcional. Aplicam-se também os critérios comuns acima.
- **Riscos:** Vazamento de dados em payloads, métricas ausentes no Sunshine, overhead e duplicação de logs.
- **Sequência sugerida de execução:** Diagnóstico/mock export preview/limpeza mockados → indisponibilidade/redação/confirmação → UX → DTOs e policy de retenção → conectar métricas e export → inspecionar pacote sanitizado. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m21"></a>

### M21 — Recuperar biblioteca após falhas e restaurar backup

- **ID:** M21.
- **Objetivo:** Preservar dados não reconstruíveis em crash, corrupção e migração.
- **Resultado esperado:** Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa.
- **Escopo:** Backup/restore de DB/manifests/resume/config/chaves conforme storage, falha de migração/DB lock/disk full, reconciliação de cache, supervisor/restart com limites e shutdown global.
- **Requisitos cobertos (primários):** NFR-085, NFR-147, NFR-150, NFR-152–NFR-154, NFR-160, RX-047, RX-048. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M20, M17. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Backup consistente em runtime restaura catálogo/estado/subscriptions/config; falha preserva original; migração fresh e upgrade histórico passam; crashes UI/Core/torrentd/MPV e sync/playback concorrentes têm recuperação observável; nenhum fechamento espera indefinidamente. Aplicam-se também os critérios comuns acima.
- **Riscos:** Backup incompleto de WAL/chaves; divergência DB/filesystem; restauração destrutiva; limites de perda de progresso indefinidos.
- **Sequência sugerida de execução:** Recovery/backup/restore mockados → falha parcial e escolha explícita → UX → contratos de backup/recovery → implementar apenas lacunas dos componentes existentes → matriz integrada de fault injection. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m22"></a>

### M22 — Instalar e atualizar uma versão verificável

- **ID:** M22.
- **Objetivo:** Entregar o produto completo com instalação e atualização preservando dados.
- **Resultado esperado:** Candidato Windows x64 inspecionável, assinado e rastreável; promoção mantém o mesmo artefato.
- **Escopo:** Installer/smoke, About/canais, update com integridade, pinning nativo, SBOM/checksums/provenance quando disponível, Canary/Beta/Stable, gates completos, documentação operacional e suporte.
- **Requisitos cobertos (primários):** NFR-118, NFR-131, RX-053, RX-054, RX-055, RX-058. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M21. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Instalar/abrir/atualizar/desinstalar conforme política preserva dados prometidos; upgrade histórico e smoke empacotado passam; budgets/segurança/nightly aplicáveis verdes; mesma identidade/hash do artefato promovido; Stable requer aprovação manual. Aplicam-se também os critérios comuns acima.
- **Riscos:** Code signing e permissões externas; assinatura alterar hash após validação; semver/canal conflitando com artefato único; hardware baseline não definido.
- **Sequência sugerida de execução:** Installer/About/update/erro mockados → preservar dados/canal/rollback suportado → UX → contrato de atualização → empacotar/assinar candidato e validar → promover o mesmo artefato somente após gates e autorização. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m23"></a>

### M23 — Coleções inteligentes

- **ID:** M23.
- **Objetivo:** Filtros dinâmicos e estratégias adicionais de seleção sem mudar identidade do conteúdo.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Smart Collections; Data Saver; Always 4K.
- **Requisitos cobertos (primários):** FUT-001. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M17, M19. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Critérios de coleção e conflito entre qualidade obrigatória e fonte inviável não definidos.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m24"></a>

### M24 — Descoberta e acesso a bibliotecas

- **ID:** M24.
- **Objetivo:** Encontrar bibliotecas e controlar acesso conforme política explícita.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Catálogo público, private/unlisted/public, perfis, moderação/abuse, deprecation/sucessora e migração A→B com aprovação.
- **Requisitos cobertos (primários):** FUT-002. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M16. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Contas, política de descoberta/moderação e migração não especificadas; separar submilestones após discovery.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m25"></a>

### M25 — Interação social e edição colaborativa

- **ID:** M25.
- **Objetivo:** Validar interações sociais opcionais em torno da curadoria.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Comentários, ratings compartilhados, social features e colaboração em drafts.
- **Requisitos cobertos (primários):** FUT-003. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M24. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Sem regras de autoria, edição concorrente, privacidade ou moderação; não prometer lançamento conjunto.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m26"></a>

### M26 — Personalizar reprodução avançada

- **ID:** M26.
- **Objetivo:** Inspecionar alternativas avançadas da experiência audiovisual.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Mapeamento configurável, refresh rate, HDR/tone mapping, device de áudio, timeout/reconexão automática, preview thumbnail, ajustes de créditos e animação reduzida.
- **Requisitos cobertos (primários):** FUT-004. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M18. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Dependência da cadeia GPU/OS/MPV/Sunshine/TV; vários itens condicionais; definir entregas independentes antes de executar.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m27"></a>

### M27 — Extensibilidade controlada

- **ID:** M27.
- **Objetivo:** Decidir um modelo futuro de extensão preservando a fronteira de confiança.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Plugins, extensões e propostas de scripts/remote plugins citadas como futuras; distinguir extensions declarativas já cobertas em M13.
- **Requisitos cobertos (primários):** FUT-005. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M22. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Execução de código externo conflita com manifest declarativo; exige nova decisão de arquitetura e threat model, nunca habilitar scripts no manifest v1.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

<a id="m28"></a>

### M28 — Evoluir compatibilidade e operação opcional

- **ID:** M28.
- **Objetivo:** Validar evoluções sem criar dependência remota no produto local.
- **Resultado esperado:** Protótipo inspecionável e decisão documentada de escopo; entrega funcional futura ainda depende de especificação e aprovação próprias.
- **Escopo:** Compatibilidade além de Windows, diagnóstico ampliado/métricas Sunshine, telemetria opt-in, delta de sync/CDN/compressão e republicação de fork.
- **Requisitos cobertos (primários):** FUT-006. Definições e fontes na [matriz](REQUIREMENTS_COVERAGE.md).
- **Dependências:** M22. Dependências reais são exigidas na integração/closure; primeiras stories utilizam mocks.
- **Critérios de conclusão:** Na etapa de descoberta: fluxo mockado inspecionado, requisitos/aceite mensuráveis definidos e submilestones limitados aprovados. Isso não representa implementação concluída dos recursos futuros. Aplicam-se também os critérios comuns acima.
- **Riscos:** Plataformas, consentimento, transporte e budgets não definidos; escopo deve ser subdividido antes de implementação.
- **Sequência sugerida de execução:** Extrair caso de uso → protótipo e interações mockadas → UX → fechar requisitos e dividir escopo → nova aprovação → somente então contratos/adapters/testes/closure. Seguir S00–S08 e ambos os checkpoints; nos destinos futuros, parar após discovery até nova especificação aprovada.

## Aprovação registrada

O usuário aprovou este mapa com “aprovadissimo”. Agrupamento, escopo e ordem aprovados; pendências técnicas permanecem nos contratos futuros. [M01](M01-onboarding/README.md) e [M02](M02-movies/README.md) têm frontend e UX aprovados, com integração e verificações físicas pendentes; S03–S08 continuam adiadas. [M03](M03-series/README.md) concluiu S00–S02 e tem UX aprovada; integração adiada. Aprovações UX/funcional dos demais milestones e publicação externa continuam independentes.

## Preparação M01–M22 — 2026-09-13

Todos os 22 milestones possuem S00–S08 e roteiros UX/funcional preparados. Veja [índice](README.md) e [auditoria](PREPARATION_AUDIT.md). Preparação não altera ownership, critérios de entrega ou aceites; contratos previstos serão refinados após UX.
