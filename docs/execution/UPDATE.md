# Integração M02–M22 até o checkpoint funcional

## Fechamento técnico da onda

M02–M22 estão em `READY_FOR_REVIEW/PENDING`, com S03–S05 concluídas dentro do
escopo autorizado. A regressão final passou **316/316 em 10,2 min** com um
worker, cobrindo browser, Electron, MPV real, libtorrent e persistência. Também
passaram formatação, lint, typecheck, build e geração local de
SBOM/checksums/proveniência. S06–S08 não foram iniciadas.

Permanecem gates externos: credenciais/provider/Registry quando aplicáveis,
runtime empacotado, Windows/TV/Sunshine/Moonlight/controle físico, installer,
code signing, CI e promoção. Nenhum milestone foi marcado `DONE`.

## M22 no checkpoint funcional local

M22 integrou feed assinado, verificação Ed25519/SHA-256/plataforma, backup e
staging de update; gerou SBOM/checksums/provenance local. 21/21 M13–M22 passaram.
Installer Windows, assinatura de código, CI e promoção continuam pendentes.

## M21 no checkpoint funcional

M21 integrou backup consistente, hash, restore atômico com original preservado
e supervisor limitado; 2/2 passaram. Checkpoint READY_FOR_REVIEW/PENDING.

## M20 no checkpoint funcional

M20 integrou métricas locais, logs limitados, redaction e limpeza seletiva; 2/2
passaram. Checkpoint READY_FOR_REVIEW/PENDING.

## M19 no checkpoint funcional

M19 integrou histórico/TTL/cooldown e preflight de fallback compatível; 2/2
passaram. Checkpoint READY_FOR_REVIEW/PENDING.

## M18 no checkpoint funcional

M18 integrou `--tv`, fullscreen, hotplug e shutdown limitado; 2/2 passaram.
Windows/Sunshine/Moonlight/controle físico seguem como gate obrigatório.

## M17 no checkpoint funcional

M17 integrou fork atômico/idempotente, identidade nova, referências e edição
independente; 4/4 com regressão M12 passaram.

## M16 no checkpoint funcional

M16 integrou sync persistente, trust, swap/rollback atômico e preservação de
dados pessoais; 2/2 passaram. Checkpoint READY_FOR_REVIEW/PENDING.

## M15 no checkpoint funcional

M15 integrou Registry HTTP, auth isolada, stage/commit otimista e retirada;
falha parcial não ativa versão. 2/2 passaram. Produção não foi publicada.

## M14 no checkpoint funcional

M14 concluiu S03–S05 com Ed25519, secure storage, TOFU persistente e detecção
de troca de chave. Tamper bloqueia, o secret não entra no DB e assinatura
persiste no `.tslib`; 3/3 passaram. Checkpoint READY_FOR_REVIEW/PENDING.

## M13 no checkpoint funcional

M13 concluiu S03–S05 com `.tslib` canônico, SHA-256, limites, staging seguro,
export atômico e import transacional/deduplicado. O roundtrip offline isolado
preservou IDs/ordem/layout e payloads maliciosos não alteraram o catálogo; 4/4
casos passaram. Checkpoint READY_FOR_REVIEW/PENDING; assinatura é M14 e S06–S08
permanecem pendentes.

## M12 no checkpoint funcional

M12 concluiu S03–S05 com drafts privados SQLite, revisão otimista, catálogo
M02/M03, sources escopadas, collections/sections e preview fiel. O ensaio
Electron salvou e reabriu a composição após restart; 5/5 passaram. Checkpoint
READY_FOR_REVIEW/PENDING; S06–S08 e hardware permanecem pendentes.

## M11 no checkpoint funcional

M11 concluiu S03–S05: sequência estrita, lacunas/especiais, countdown de 5 s,
preflight único, sessão/generation e claim idempotente estão integrados ao
Electron. O ensaio isolado resolveu e preparou o próximo arquivo Keep sem abrir
outro stream e rejeitou início duplicado; 6/6 passaram. Checkpoint
READY_FOR_REVIEW/PENDING; S06–S08 e hardware físico continuam pendentes.

## M09 no checkpoint funcional

M09 concluiu S03–S05 e está `READY_FOR_REVIEW/PENDING`. Fila/download manager,
limites de banda/concorrência, prioridade de playback, resume data libtorrent,
recovery, cancelamento e remoção confirmada estão integrados ao Electron. O
ensaio real fez enqueue, pause, restart, resume e cancel mantendo catálogo;
14/14 passaram. Windows/TV/hardware, disco cheio físico, swarm completo e
S06–S08 permanecem pendentes. A onda segue em M10/S03.

## M08 no checkpoint funcional

M08 concluiu S03–S05 e está `READY_FOR_REVIEW/PENDING`. Health v1 usa p25,
ratio, wanted-piece availability, peers úteis, estabilidade, startup,
confidence, caps críticos e histerese. Ranking, histórico limitado, decisões e
override são persistidos em SQLite. Electron usa IPC/preload restritos; recorte
M08 16/16, Electron 1/1 e torrentd/libtorrent 6/6 passaram. Windows/TV,
Moonlight, controle físico, sessão remota externa e S06–S08 continuam
pendentes. A onda segue em M09/S03.

## M07 no checkpoint funcional

M07 concluiu S03–S05 e está `READY_FOR_REVIEW/PENDING`. Mapping com offset,
HEAD/TAIL, scheduler 7/5/3, cache limitado, torrentd/libtorrent, delivery sparse,
MPV e Electron IPC estão integrados. O swarm sintético controlado mediu stream
ready em **2.660 ms**, primeiro frame em **2.764 ms** com **31/174 pieces**, seek
fora do cache em **509 ms** e somente a geração 4 após três seeks rápidos. O
recorte M07 passou **27/27**. Windows/TV/Moonlight, controle físico e packaging
continuam pendentes; S06–S08 não foram iniciadas. A onda segue em M08/S03.

## M05 no checkpoint funcional

M05 concluiu S03–S05 e está `READY_FOR_REVIEW/PENDING`. O caminho Electron
resolve somente arquivos registrados na biblioteca gerenciada, abre MPV 0.41
em processo separado, observa primeiro frame, executa controles/tracks reais e
persiste progresso/saída em SQLite. Preload/IPC v1 não expõem paths, PID, SQL ou
JSON bruto. O smoke H.264/AAC real passou do detalhe ao restart; testes focados
S04–S05 passaram **13/13**, repetição Electron concorrente **3/3** e regressão
integral **222 passed, 6 skipped, 0 failed**. Windows x64/TV/Moonlight,
composição visível, hardware decode e controle físico continuam pendentes;
S06–S08 não foram iniciados. A onda segue em M07/S03.

Em 2026-09-14 o usuário autorizou: “Vamos para o m02 ate o m22 deixando para o proximo checkpoint de cada um”. A execução seguirá M02 → M22, uma story por vez, cobrindo S03–S05 e deixando cada milestone em `FUNCTIONAL_CHECKPOINT / READY_FOR_REVIEW / PENDING`. S06–S08, aprovação funcional, hardware/serviços externos, CI, review, merge e publicação não são inferidos. O trabalho começou em M02/S03.

## M06 no checkpoint funcional

M06 concluiu S03–S05 e está `READY_FOR_REVIEW/PENDING`. O caminho Electron usa
um daemon Python/libtorrent real isolado por stdio, parser e staging seguro,
persistência SQLite de sessões, sources, selectors e pendências, IPC restrito e
rehydration após restart. A suíte afetada passou **47/47** e um magnet derivado
do torrent oficial Ubuntu 26.04.1 resolveu metadata pública em **6,6 s** sem
baixar o conteúdo. Empacotamento do runtime, Windows/TV/controle/Moonlight e
decisão funcional humana continuam pendentes; S06–S08 não foram iniciadas. A
onda segue em M03/S03.

## Integração M01 S03–S08 concluída tecnicamente

Em 2026-09-14 o usuário confirmou “O frontend foi aprovado ja” e em seguida autorizou: “Registre a aprovação e execute M01 S03–S08”. A UX consolidada M01–M22 está aprovada. M01 retomou em S03; integrações dos demais milestones continuam sem autorização.

A execução pode atravessar tecnicamente o checkpoint funcional de M01 para cumprir S03–S08, mas isso não registra aprovação funcional humana. Windows/TV/controle físicos permanecem um gate separado até existir evidência nesse ambiente. Nenhum merge, deploy ou publicação foi autorizado.

S03–S08 foram executadas: contrato/schema/protocolo v1, SQLite local atômico, biblioteca vazia persistente, preload/IPC restritos, integração Electron, seletor nativo, restart, reset seletivo, recovery, testes e hardening. Os gates estáticos passaram, a suíte focada M01 passou 27/27 e a regressão integral serial passou **150/150 em 9,3 min**. M01 está `LOCAL_VALIDATED / READY_FOR_FUNCTIONAL_REVIEW`; não está `DONE` porque o aceite funcional humano, Windows/TV/controle físicos e CI/review/merge permanecem pendentes.

## Histórico da fase frontend

S00–S02 dos 22 milestones implementadas no checkout real, com mocks em memória e journeys conectadas. Trabalho anterior e aceites M01–M03 preservados; M04–M22 READY_FOR_REVIEW/PENDING. Revisão intermediária foi adiada pelo usuário, sem aprovação por inferência.

Regressão final: **141 testes passaram**, incluindo Electron macOS, browser, layouts, boundaries mockados, organização do renderer, design system com dois botões, toolbar única, card compartilhado vertical/horizontal, Recomendados no mesmo trilho da Home, scroll vertical azul, retorno ao topo ao alcançar o primeiro botão, marca não interativa, detalhe rico, seeds IMDb, Torrent Health, navegação por controle remoto/gamepad, imagem/GIF dos episódios e chrome do player. Lint, typecheck, build Vite/Turbo e formatação dos arquivos deste ajuste passaram; permanece o aviso conhecido de chunk acima de 500 kB. Inspeções visuais e limites estão em [FINAL_VALIDATION](evidence/FINAL_VALIDATION.md) e [RENDERER_REFACTOR](evidence/RENDERER_REFACTOR.md).

[Revisão final](FRONTEND_REVIEW.md) · [Auditoria](FRONTEND_COVERAGE_AUDIT.md) · [445 requisitos e 80 jornadas](FRONTEND_REQUIREMENTS_AUDIT.md).

PR [#1](https://github.com/DouglasPrado/ushark/pull/1) aberto a partir de `feat/frontend-m01-m22`; nenhum check remoto foi reportado no momento da criação. A validação local desta publicação passou em formatação, lint, typecheck e build. A repetição da regressão Playwright foi interrompida por `ENOSPC` no host, sem falha de assertion; a última regressão integral preservada permanece 141/141.

Backend, persistência definitiva, providers/MPV/torrentd/Registry e integrações reais não implementados. S03–S08 DEFERRED; nenhum milestone DONE. Windows/TV/controle físicos e runtime de mídia pendentes. Nenhum merge/deploy/M23–M28 executado. Próxima ação: revisão humana do PR e decisão UX; novas etapas exigem autorização.

## Ajuste durante a revisão — renderer e design system

O renderer deixou de ser uma pasta plana e agora está separado em `app`, `catalog`, `playback`, `workspace`, `system`, `torrent` e `tv`, mantendo CSS junto da família responsável. `packages/ui` passou a fornecer o botão compartilhado com apenas `primary`/`secondary`, a barra `FilterToolbar` usada em Filmes/Séries/Busca e o `MediaCard` comum. O mesmo card exibe Filmes e Séries: `portrait` nas grades verticais e `landscape` nos trilhos da Home. Um gate estrutural impede retorno ao layout achatado, à terceira variante de botão ou à duplicação desses componentes. Typecheck, lint, build, 16 testes de estrutura/layout/contenção, seis casos de correção e a regressão integral **141/141 em 3,2 min** passaram. Capturas de Filmes, Séries, Home e Busca foram inspecionadas. Checkpoints humanos continuam inalterados.

## Ajuste durante a revisão — detalhe de Filme como página

Filmes deixaram de abrir em modal tanto na Home/busca M04 quanto no catálogo M02. Ambos usam o mesmo componente na rota canônica `#/content/:contentId`, com Hero em largura total, sinopse, badges, fatos, Assistir/Voltar/Baixar/Trailer e Recomendados; a aba Filmes acrescenta apenas suas ações contextuais de gestão. A lista subjacente não aparece atrás da composição. Voltar e a saída do player restauram o contexto, scroll e foco, inclusive para filme importado. Séries continuam em modal. A suíte direcionada passou **48/48** e a regressão limpa passou **136/136 em 2,2 min**; M04 permanece READY_FOR_REVIEW/PENDING e o aceite histórico de M02 foi preservado.

## Correção durante a revisão

O onboarding agora aparece somente no primeiro acesso: a conclusão bem-sucedida grava um marcador local versionado e recarregar/reabrir começa na Home. Demais mocks continuam descartáveis e a persistência definitiva segue adiada. A revisão humana continua PENDING para M04–M22.

A Home M04 também foi aproximada do padrão de navegação de serviços de streaming: cabeçalho sobreposto, Hero de largura total, navegação principal e trilhos horizontais panorâmicos. A busca continua em grade e os boundaries/mock data não mudaram. Capturas responsivas e navegação por foco foram revalidadas; esse ajuste não representa aceite UX automático.

No ajuste do seed IMDb, o boundary da Home passou a carregar `backdrop`: Hero e trilhos panorâmicos usam as imagens horizontais locais do IMDb, enquanto a busca mantém os pôsteres verticais. Typecheck, lint, build Vite e a suíte focada M04 12/12 passaram. [Print 1080p](../milestones/M04-home-search/evidence/imdb-home-1920.png). A revisão M04 continua PENDING.

Filmes M02 recebeu a mesma limpeza visual: lateral e barra inferior removidas, navegação superior consistente, ações secundárias por ícones acessíveis e linguagem interna de mock/provisoriedade retirada da interface. Importação e seleção de fontes conservam os mesmos boundaries. O aceite histórico de M02 foi preservado, mas a alteração posterior aguarda confirmação visual e não recebeu novo aceite por inferência.

O seed padrão de Filmes/Home agora usa oito títulos reais identificados por IMDb ID, com ano, duração e gêneros obtidos do `title.basics`, além de nota e quantidade de votos do `title.ratings`. A tela Filmes exibe esses dados em cada card e repete título original, avaliação e ID nos detalhes. Títulos de apresentação em português, sinopses e fontes permanecem fixtures locais; pôsteres e backdrops são snapshots locais das imagens exibidas nas páginas públicas dos títulos no IMDb. Não foi adicionado acesso de rede em runtime nem uma integração de provider; a evidência e os limites de licença estão em [IMDB_SEED](../milestones/M02-movies/evidence/IMDB_SEED.md).

Séries recebeu o mesmo padrão após solicitação explícita: oito títulos reais com período, gêneros, nota/votos/ID, pôsteres e backdrops locais do IMDb; duas temporadas e seis episódios por série continuam fixtures de demonstração. A navegação foi alinhada ao shell superior de Filmes/Home e os backdrops alimentam o trilho Séries da Home. [Evidência e limites](../milestones/M03-series/evidence/IMDB_SERIES_SEED.md). Regressão atual: **125/125**. O aceite histórico de M03 foi preservado, mas esta alteração posterior aguarda confirmação visual própria.

Após esclarecimento do usuário, a interpretação inicial do sinalizador como resolução foi corrigida. Cards de Filmes, Séries, Home e busca agora mostram Torrent Health com barras crescentes tipo sinal de celular e rótulo textual; Hero, detalhes e comparação de fontes reutilizam o mesmo componente. `4K`/`1080p` ficam separados na metadata. O snapshot é determinístico e vem do boundary mockado de M08, sem alegar probe real ou dado do IMDb. Prints foram atualizados; os três fluxos visuais, os três testes M08 e a regressão completa **125/125** passaram. A revisão humana dessas alterações continua pendente.

Na sequência, Séries ganhou Health em cada episódio. A capa, o card e o detalhe da série exibem `Média` e agregam cada `sourceId` uma única vez, mesmo quando a source de uma temporada está associada a vários episódios. A Home aplica a mesma média no trilho Séries. Catálogo, detalhe, episódios e Home foram recapturados; 16 testes focados e a regressão completa **125/125** passaram. O cálculo continua mockado e substituível; probe real permanece adiado.

O ajuste seguinte refez o motor de navegação compartilhado conforme A09. Controle remoto, D-pad e analógico usam seleção espacial determinística; grupos horizontais evitam saltos de seção, cima/baixo preservam a coluna, scroll acompanha o foco e segurar o direcional repete de forma controlada. OK/A e Voltar/B não repetem, modal é o scope ativo e o foco retorna ao card de origem. A Home identifica o input mais recente e o modo TV oculta o cursor após input por controle. Dois testes novos e a regressão completa **127/127** passaram; [print com foco](../milestones/M01-onboarding/evidence/fluid-navigation-home-1920.png). Validação física permanece pendente.

Séries recebeu então arte por episódio: as linhas usam thumbnail 16:9 e o detalhe permite enviar JPEG, PNG, WebP ou GIF de até 12 MB. Sem arte própria, o backdrop da série ocupa o espaço reservado; arquivo inválido produz erro e um upload válido atualiza detalhe/card na mesma sessão. O contrato permanece substituível e o mock não alega persistência, cópia segura nem validação privilegiada de bytes. [Print dos episódios](../milestones/M03-series/evidence/imdb-series-episodes-1920.png). Suíte focada 6/6 e regressão **128/128** passaram.

Após a revisão visual, o mapeamento provisório que reutilizava capas com nomes antigos foi primeiro isolado por título. Atendendo à correção seguinte do usuário, os SVGs intermediários saíram do seed: cada título agora usa um pôster vertical e um backdrop horizontal do IMDb, copiados para assets locais. Catálogo e detalhe foram recapturados; os testes verificam caminho, carregamento e execução offline no Electron.

O modo TV M18 agora é uma superfície somente de consumo, inclusive quando o Electron é iniciado com `--tv`: Home, Filmes, Séries e Player ocultam bibliotecas, downloads, cadastro, torrent, edição, gestão de fontes, diagnóstico, preferências e cenários. Busca, favoritos, reprodução, transporte, áudio e legendas permanecem acessíveis. Ferramentas de fixture da sessão exigem `?review=1`. A alteração aguarda confirmação UX; hardware e runtime reais continuam pendentes.

A organização frontend agora segue A11: `apps/desktop/src` separa `main`, `preload` e `renderer`; `packages/mocks` separa diretamente `data`, `services` e `scenarios`; e renderer/testes consomem `@ushark/ui`, `@ushark/types` e `@ushark/mocks` pelos exports dos workspaces. O skill `frontend-guided-milestones` recebeu a mesma regra e um gate estrutural automatizado impede o retorno aos entrypoints achatados ou a travessias diretas para diretórios internos de `packages/*`.

O player M05 foi refinado para o padrão visual de streaming: chrome inferior transparente, progresso e controles em linha única, nove ações somente por ícones com nomes acessíveis e auto-ocultação após quatro segundos. Input revela a barra; pausa e diálogo de faixas a mantêm visível. Diagnóstico, recuperação, cenários e linguagem de fixture foram removidos da experiência comum e preservados apenas em `?review=1`. [Captura 1080p](../milestones/M05-local-playback/evidence/player-streaming-1080.png). A alteração aguarda confirmação UX e não comprova reprodução de vídeo real.

O detalhe comum de M04 foi enriquecido para Filmes e Séries com composição cinematográfica, backdrop, sinopse, badges, gêneros, elenco disponível, avaliação/votos, duração ou temporadas/episódios, resolução, Torrent Health, disponibilidade, IDs e memberships. Voltar fica imediatamente ao lado de Assistir/Continuar, seguido por Baixar e Trailer na mesma linha; o fechamento restaura o foco no card. O trailer é uma prévia local temporizada no modal, não uma integração de vídeo. Dez testes focados e a regressão completa **131/131** passaram; [capturas](../milestones/M04-home-search/evidence/VALIDATION.md). A revisão M04 continua PENDING.

No rodapé desse detalhe, Recomendados agora mostra seis cards 16:9 ordenados deterministicamente por tipo, gêneros, memberships e avaliação. O título atual é excluído; escolher outro atualiza o mesmo modal, retorna ao topo e não perde a origem de foco. A [captura 1080p](../milestones/M04-home-search/evidence/rich-series-recommendations-1920.png) foi inspecionada. Cinco testes focados e a regressão completa **131/131** passaram; o ranking real continua adiado com o backend.

As listas de Filmes e Séries agora possuem busca local e seletor de ordenação com `Em destaque`, `Mais votados` e `A–Z`. A busca ignora acentos, aceita termos separados e considera título localizado, título original e gêneros; o ranking por votos usa o snapshot IMDb já presente no mock. [Filmes](../milestones/M02-movies/evidence/catalog-search-sort-1920.png) e [Séries](../milestones/M03-series/evidence/catalog-search-sort-1920.png) foram inspecionados em 1920×1080. O teste conjunto cobre busca e as duas ordenações; typecheck, lint, build e regressão completa **132/132 em 2,3 min** passaram. Os aceites históricos de M02/M03 permanecem preservados e não aprovam automaticamente este ajuste posterior.

A marca textual `Ushark` no cabeçalho de Home, Filmes e Séries deixou de ser botão: não executa navegação, não recebe foco por teclado/controle, não responde a pointer e não permite seleção acidental do texto. O acesso à Home permanece no item explícito `Início`. Um teste dedicado verifica semântica, foco e CSS nas três superfícies; typecheck, lint, build e regressão completa **133/133 em 2,3 min** passaram. Os checkpoints anteriores permanecem preservados e esta correção não implica novo aceite UX.

Na correção dos overlays, os cards de Filmes e da busca foram encapsulados em superfícies de mídia próprias. Torrent Health e favorito ficam ancorados e recortados no pôster, com largura limitada em breakpoints estreitos. O teste específico passou **2/2** em 480, 700, 761, 1100 e 1920 px; lint, typecheck e build passaram. A regressão completa posterior passou **136/136**. M04–M22 permanecem READY_FOR_REVIEW/PENDING, sem novo aceite inferido.

No refinamento atual dos detalhes, a linha de ações foi invertida para começar com Voltar somente por ícone, seguido por Assistir/Continuar e Trailer imediatamente à direita; Baixar e ações de gestão vêm depois. Assistir/Continuar recebe foco ao abrir pela Home, busca ou Filmes, ao trocar uma recomendação e ao retornar do player. Acessibilidade preserva o nome `Voltar` no botão sem texto. Quinze testes direcionados, layouts 1080p/1440p/4K, inspeção visual, lint, typecheck, build e a regressão completa **136/136 em 2,2 min** passaram. M04 continua PENDING e os aceites históricos não foram ampliados.

Na correção atual da lista de Filmes, pôster, Health, favorito, título e metadata passaram a formar uma única superfície de card. A área textual ganhou largura, recorte e truncamento próprios para impedir que IMDb, votos, identificador, ano, fontes ou gêneros escapem; o intervalo até 1000 px usa três colunas, evitando cards excessivamente estreitos. O teste geométrico agora percorre overlays e conteúdo interno em 480, 700, 761, 1100 e 1920 px. Dezenove testes focados, lint, typecheck, build e a regressão completa **137/137 em 2,2 min** passaram. [Captura em 761 px](../milestones/M02-movies/evidence/card-internals-761.png). O aceite histórico de M02 permanece preservado, sem aprovação automática deste ajuste.

No ajuste global atual, todo scroll vertical do renderer usa o azul padrão `#87bbef`, com trilho escuro, thumb arredondado e hover azul-claro. A regra usa `scrollbar-color`/`scrollbar-width` e os pseudos suportados pelo Chromium/Electron; os trilhos horizontais da Home e do player continuam ocultos por suas regras específicas. O teste dedicado e os layouts de onboarding, Home, Filmes e Séries passaram **19/19**; lint, typecheck, build e a regressão completa passaram **138/138 em 2,2 min**. Checkpoints e aceites anteriores foram preservados.

No refinamento seguinte, o agrupamento Voltar, Assistir/Continuar, Trailer, Baixar e ações contextuais foi movido para imediatamente depois do Hero e antes da sinopse. A composição vale para a página canônica de Filme e para o modal de Série, sem alterar ordem, foco inicial ou handlers. Oito testes direcionados, os seis layouts 1080p/1440p/4K, inspeção das capturas de Filme e Série, lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. M04 continua PENDING e o aceite histórico de M02 permanece preservado.

Na página canônica de Filme, a faixa de ações foi aproximada novamente do Hero: o espaçamento superior caiu de 28px para 8px somente nessa superfície, mantendo uma pequena separação sem sobrepor o backdrop. Sete testes focados verificaram comportamento e distância máxima de 16px em 1080p/1440p/4K; lint, typecheck, build e a regressão completa **138/138 em 2,2 min** passaram. A captura de Interestelar foi renovada e inspecionada. M04 continua PENDING e o aceite histórico de M02 permanece preservado.

No refinamento seguinte, a página canônica de Filme passou a compor o Hero em duas colunas. À esquerda, título, badges e botões pertencem ao mesmo bloco e o título sobe naturalmente para acomodar as ações; à direita, a sinopse, os gêneros e o elenco formam um card translúcido. Os fatos permanecem abaixo do Hero. O modal de Série não mudou. Sete testes focados verificam hierarquia DOM e geometria em 1080p/1440p/4K; lint, typecheck, build e a segunda regressão completa passaram **138/138 em 2,2 min**. A primeira rodada completa teve um timeout isolado no Electron M02; o caso passou sozinho em 3,1s e na rodada completa seguinte, sem correção de produto. M04 continua PENDING e o aceite histórico de M02 permanece preservado.

No ajuste atual de navegação, alcançar o primeiro botão visível da superfície por teclado, controle remoto ou gamepad também leva o scroll vertical ao topo. O motor compartilhado aplica a regra à página e, quando o scope ativo é um diálogo rolável, ao próprio diálogo; os demais destinos continuam usando revelação por proximidade. O novo teste parte da Home rolada, move o foco de Filmes para Início e comprova foco e `scrollY = 0`. A suíte de navegação passou **3/3** e a regressão completa sem traces passou **139/139 em 2,4 min**. Lint, typecheck, build e formatação dos arquivos alterados passaram. Os checkpoints e aceites humanos permanecem inalterados.

No ajuste atual dos detalhes, Recomendados passou a usar o mesmo componente `DiscoveryRail`/`DiscoveryCard` de `Filmes para descobrir`, `Continuar assistindo` e demais trilhos da Home. A grade exclusiva foi removida; arte panorâmica, tipo/ano/qualidade, Torrent Health, progresso opcional, foco e deslocamento horizontal agora seguem um único contrato visual. Ranking, exclusão do título aberto, troca na mesma superfície e retorno ao card de origem foram preservados. A captura [rich-detail-1920.png](../milestones/M04-home-search/evidence/rich-detail-1920.png) foi inspecionada. A suíte focada passou **19/19** e a regressão integral final passou **141/141 em 2,2 min**, após estabilizar a reorganização A11 e regenerar o build Electron. Lint, typecheck, build e hashes passaram; M04 continua READY_FOR_REVIEW/PENDING e os aceites históricos de M02/M03 foram preservados.

No ajuste visual seguinte, o fundo do card de sinopse do detalhe canônico de Filme caiu de cerca de 72% para **58% de opacidade**, mantendo blur de 14px e conteúdo totalmente opaco. A mesma regra atende Home/busca e Filmes via `ContentDetails`. Oito validações direcionadas passaram: seis layouts compartilhados em 1080p/1440p/4K e dois fluxos que regeneraram as capturas de Interestelar. A primeira tentativa de alta resolução encontrou apenas falta de espaço ao gravar traces; foram removidos caches temporários regeneráveis e a repetição sequencial passou. A regressão integral anterior permanece **141/141**.

No refinamento seguinte de `content/movie`, as colunas do Hero deixaram de alinhar apenas pela base e passaram a compartilhar o mesmo centro vertical. Título/badges/ações continuam juntos à esquerda e sinopse/gêneros/elenco à direita. Fatos, cenários e Recomendados também passaram a usar exatamente a mesma guia lateral e largura máxima. A geometria mediu diferença de centro de 0–0,01 px em 1920/2560/3840, guias idênticas e nenhum overflow; em 480 px, os blocos empilham na ordem correta. Os layouts M02/M04 em 1920 passaram **2/2**, assim como lint, typecheck, build e hashes. A tentativa inicial mais ampla parou apenas ao gravar capturas por `ENOSPC`; a regressão integral anterior permanece **141/141**, sem ser reapresentada como uma nova execução. M04 continua PENDING e o aceite histórico de M02 foi preservado.

No ajuste seguinte da página canônica de Filme, a faixa abaixo do Hero com título original, avaliação, disponibilidade, IMDb e memberships foi removida por repetir informação já apresentada na composição principal. O conjunto do Hero foi elevado discretamente e Recomendados passou a ser o bloco imediatamente seguinte, antes dos cenários exclusivos de revisão. O modal de Série preserva seus fatos. O teste rico e os layouts M02/M04 em 1920 passaram **3/3**; uma medição adicional confirmou a ligação Hero → Recomendados, ausência de overflow e remoção da faixa em 1920/2560/3840/480, além da preservação dos fatos de Série. Lint, typecheck, build e hashes passaram. A regressão integral anterior permanece **141/141**; M04 continua PENDING e o aceite histórico de M02 foi preservado.

## Ajuste posterior — Filmes e Séries por categorias

As listas padrão M02/M03 agora seguem a composição da Home: `Em destaque` e trilhos panorâmicos por categorias editoriais amplas. Busca, Favoritos e ordenações explícitas preservam a grade vertical; conteúdo sem correspondência entra em `Outros`. O detalhe restaura foco, scroll e origem exata mesmo quando um título se repete em vários trilhos. O boundary continua mockado e substituível, sem nova integração de rede ou provider. Typecheck, lint e build passaram; a regressão browser isolada passou **142/142 em 2,1 min**, e os fluxos Electron de Filmes e Séries passaram **2/2**. [Evidência](evidence/CATALOG_CATEGORY_RAILS.md). O estado concorrente da integração M01 foi preservado e nenhum novo aceite humano foi inferido.

## Ajuste posterior — busca recolhida nos catálogos

Filmes e Séries agora iniciam somente com uma lupa no grupo de ações à direita; o input de busca é criado e focado apenas após ativação. Fechar ou usar Voltar/Escape limpa a consulta, recolhe o campo e restaura o foco na lupa, evitando que um controle textual permanente interrompa a navegação pelos trilhos. A suíte direcionada passou **3/3**, a regressão browser isolada passou **144/144 em 2,2 min**, e Electron M02/M03 passou **2/2**. [Evidência](evidence/COLLAPSED_CATALOG_SEARCH.md). A integração M01 concorrente e os checkpoints humanos foram preservados.
## M10 — checkpoint funcional pronto

M10 concluiu S03–S05 em 2026-09-14. Armazenamento real usa índice/policy
SQLite, capacidade física, leases, limpeza revalidada e promoção Keep com
preservação da origem em falha. IPC/preload e adapter Electron substituem o
mock no runtime desktop. Suíte focada M09/M10 passou 13/13 e o ensaio Electron
removeu/moveu arquivos físicos. Checkpoint funcional READY_FOR_REVIEW/PENDING;
S06–S08 e Windows/TV/hardware permanecem pendentes.
