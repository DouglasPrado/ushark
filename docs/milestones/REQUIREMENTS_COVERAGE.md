# Matriz de cobertura — Requisito → Milestone

Status: **OWNERSHIP PLANEJADO; ENTREGA DEFINITIVA NÃO ENCERRADA**. Ownership primário único. Cada definição original permanece normativa em sua fonte, inclusive condicionais como pode/quando suportado. Os resumos não substituem seus critérios de aceite.

FR/NFR são os IDs existentes. RX identifica complemento extraído de seção não numerada por requisito; alguns refinam um FR em vez de criar funcionalidade nova. FUT preserva intenção futura ainda insuficientemente especificada. UJ é índice de jornada, não requisito adicional no total.

A coluna de milestone aponta para a responsabilidade final. **S01/S02 simulam; S03–S05 realizam após UX; S06–S08 comprovam e fecham.** A conclusão depende das regras transversais do [plano](PLAN.md). Nos FUT, cobertura é somente alocação para discovery, não cobertura de implementação já especificada.

M01–M22 possuem preparação S00–S08 e cobertura individual vinculada no [índice](README.md). M01–M03 preservam UX aprovada; M04 concluiu S00–S02 e está [pronto para revisão UX](M04-home-search/UX_CHECKPOINT.md), com [evidências frontend](M04-home-search/evidence/VALIDATION.md); aceite PENDING e integração adiada. A atribuição do aceite M03 no estado foi reconciliada. Nenhum requisito foi promovido a DONE por esta preparação. M05–M22 têm implementação e checkpoints pendentes.

## Funcionais e não funcionais

| Requisito | Resumo original | Critério/definição extraída | Milestone primário | Fonte (linha de referência) |
|---|---|---|---|---|
| FR-001 | Criar biblioteca local | **Prioridade:** P0 **Tipo:** DOMAIN O sistema deve permitir a criação de uma biblioteca local. Critérios de aceite - deve existir um `libraryId`; - deve existir nome; - deve existir pasta associada; - deve ser indexada localmente; - deve poder existir mesmo sem conteúdo. | [M01](PLAN.md#m01) | [FR-001](../product/03-functional-requirements.md):71 |
| FR-002 | Persistir biblioteca local | O sistema deve persistir bibliotecas entre reinicializações. Critérios de aceite - fechar e reabrir o app não pode apagar a biblioteca; - ordem das sections deve ser preservada; - memberships devem ser preservadas. | [M02](PLAN.md#m02) | [FR-002](../product/03-functional-requirements.md):88 |
| FR-003 | Suportar filmes | O sistema deve representar filmes como entidades independentes das sources. Critério principal Content != Torrent | [M02](PLAN.md#m02) | [FR-003](../product/03-functional-requirements.md):100 |
| FR-004 | Suportar séries | O sistema deve representar séries com temporadas e episódios. | [M03](PLAN.md#m03) | [FR-004](../product/03-functional-requirements.md):112 |
| FR-005 | Suportar episódios | Cada episódio deve possuir identidade independente. | [M03](PLAN.md#m03) | [FR-005](../product/03-functional-requirements.md):118 |
| FR-006 | Suportar conteúdo sem provider externo | Conteúdo manual/local deve ser permitido. Exemplo: movie:local:<id> | [M02](PLAN.md#m02) | [FR-006](../product/03-functional-requirements.md):124 |
| FR-007 | Identidade estável de Content | Cada Content deve possuir identificador imutável. | [M02](PLAN.md#m02) | [FR-007](../product/03-functional-requirements.md):136 |
| FR-008 | Deduplicar Content | Se o mesmo conteúdo aparecer em múltiplas bibliotecas, o sistema deve reutilizar a mesma entidade. | [M02](PLAN.md#m02) | [FR-008](../product/03-functional-requirements.md):142 |
| FR-009 | Importar arquivo `.torrent` | **Prioridade:** P0 **Tipo:** TORRENT O sistema deve permitir selecionar e importar arquivos `.torrent`. | [M06](PLAN.md#m06) | [FR-009](../product/03-functional-requirements.md):150 |
| FR-010 | Importar magnet link | O sistema deve permitir adicionar magnet links. | [M06](PLAN.md#m06) | [FR-010](../product/03-functional-requirements.md):159 |
| FR-011 | Resolver metadata do torrent | Após receber magnet ou torrent, o sistema deve obter: - nome; - infoHash; - lista de arquivos; - tamanhos; - piece metadata quando disponível. | [M06](PLAN.md#m06) | [FR-011](../product/03-functional-requirements.md):165 |
| FR-012 | Mostrar progresso de resolução | Enquanto metadata não estiver disponível, a UI deve mostrar estado intermediário. | [M06](PLAN.md#m06) | [FR-012](../product/03-functional-requirements.md):177 |
| FR-013 | Salvar torrent pendente | Se metadata não estiver disponível, o usuário deve poder manter a source para nova tentativa futura. | [M06](PLAN.md#m06) | [FR-013](../product/03-functional-requirements.md):183 |
| FR-014 | Detectar arquivos de vídeo | O sistema deve identificar arquivos de mídia por extensão e características. | [M06](PLAN.md#m06) | [FR-014](../product/03-functional-requirements.md):191 |
| FR-015 | Ignorar samples | Arquivos pequenos identificados como sample não devem ser escolhidos automaticamente como mídia principal. | [M06](PLAN.md#m06) | [FR-015](../product/03-functional-requirements.md):197 |
| FR-016 | Inferir filme pelo nome | O sistema deve tentar inferir: - título; - ano; - qualidade; - codec. | [M06](PLAN.md#m06) | [FR-016](../product/03-functional-requirements.md):203 |
| FR-017 | Inferir série | O sistema deve identificar padrões como: S01E01 1x01 Season 01 Episode 01 | [M03](PLAN.md#m03) | [FR-017](../product/03-functional-requirements.md):214 |
| FR-018 | Mapear episódio automaticamente | Arquivos identificados como episódios devem ser vinculados ao episódio correspondente. | [M03](PLAN.md#m03) | [FR-018](../product/03-functional-requirements.md):226 |
| FR-019 | Permitir correção manual | Toda identificação automática deve poder ser corrigida. | [M02](PLAN.md#m02) | [FR-019](../product/03-functional-requirements.md):232 |
| FR-020 | Persistir selector | A associação entre source e arquivo deve ser persistida. Selectors mínimos: largest-video filename episode manual | [M03](PLAN.md#m03) | [FR-020](../product/03-functional-requirements.md):238 |
| FR-021 | Resolver metadata via TMDB | O sistema deve conseguir buscar metadata externa usando TMDB. | [M02](PLAN.md#m02) | [FR-021](../product/03-functional-requirements.md):255 |
| FR-022 | Armazenar external IDs | Deve ser possível guardar IDs como: TMDB IMDb | [M02](PLAN.md#m02) | [FR-022](../product/03-functional-requirements.md):261 |
| FR-023 | Cachear metadata | Metadata resolvida deve ser salva localmente. | [M02](PLAN.md#m02) | [FR-023](../product/03-functional-requirements.md):272 |
| FR-024 | Cachear posters | Posters devem ser persistidos localmente. | [M02](PLAN.md#m02) | [FR-024](../product/03-functional-requirements.md):278 |
| FR-025 | Cachear backdrops | Backdrops devem ser persistidos localmente. | [M02](PLAN.md#m02) | [FR-025](../product/03-functional-requirements.md):284 |
| FR-026 | Permitir metadata override | Bibliotecas podem sobrescrever dados de apresentação. | [M12](PLAN.md#m12) | [FR-026](../product/03-functional-requirements.md):290 |
| FR-027 | Preservar metadata global | Overrides não devem alterar cadastro global do Content. | [M12](PLAN.md#m12) | [FR-027](../product/03-functional-requirements.md):296 |
| FR-028 | Vincular múltiplas sources | Um Content pode possuir múltiplas sources. | [M02](PLAN.md#m02) | [FR-028](../product/03-functional-requirements.md):304 |
| FR-029 | Source torrent | A v1 deve suportar source do tipo: torrent | [M06](PLAN.md#m06) | [FR-029](../product/03-functional-requirements.md):310 |
| FR-030 | Source por magnet | Uma source pode referenciar magnet. | [M06](PLAN.md#m06) | [FR-030](../product/03-functional-requirements.md):320 |
| FR-031 | Source por arquivo `.torrent` | Uma source pode referenciar um arquivo torrent local ou empacotado. | [M06](PLAN.md#m06) | [FR-031](../product/03-functional-requirements.md):326 |
| FR-032 | Armazenar infoHash | Sempre que disponível, infoHash deve ser armazenado. | [M06](PLAN.md#m06) | [FR-032](../product/03-functional-requirements.md):332 |
| FR-033 | Deduplicar sources por infoHash | Mesma source não deve criar runtimes redundantes. | [M06](PLAN.md#m06) | [FR-033](../product/03-functional-requirements.md):338 |
| FR-034 | Remover source sem remover Content | Remover uma source não deve remover automaticamente o Content. | [M02](PLAN.md#m02) | [FR-034](../product/03-functional-requirements.md):344 |
| FR-035 | Conteúdo sem source | O sistema deve permitir Content sem source reproduzível. | [M02](PLAN.md#m02) | [FR-035](../product/03-functional-requirements.md):350 |
| FR-036 | Armazenar metadata técnica | A source pode armazenar: - resolução; - codec de vídeo; - codec de áudio; - HDR; - canais; - tamanho; - bitrate. | [M02](PLAN.md#m02) | [FR-036](../product/03-functional-requirements.md):358 |
| FR-037 | Detectar metadata técnica real | Dados detectados localmente devem ter precedência sobre dados declarados. | [M07](PLAN.md#m07) | [FR-037](../product/03-functional-requirements.md):372 |
| FR-038 | Reproduzir antes do download completo | **Prioridade:** P0 O sistema deve permitir playback progressivo. | [M07](PLAN.md#m07) | [FR-038](../product/03-functional-requirements.md):380 |
| FR-039 | Priorizar pieces próximos | O engine deve priorizar pieces necessários para o playback atual. | [M07](PLAN.md#m07) | [FR-039](../product/03-functional-requirements.md):388 |
| FR-040 | Janela de prioridade | O engine deve suportar níveis de prioridade por distância do playback. | [M07](PLAN.md#m07) | [FR-040](../product/03-functional-requirements.md):394 |
| FR-041 | Reagir a seek | Ao receber seek: - prioridade antiga deve ser reduzida; - nova região deve receber prioridade; - buffer deve ser reconstruído. | [M07](PLAN.md#m07) | [FR-041](../product/03-functional-requirements.md):400 |
| FR-042 | Prefetch inicial | O sistema deve suportar prefetch antes do Play. | [M07](PLAN.md#m07) | [FR-042](../product/03-functional-requirements.md):410 |
| FR-043 | Prefetch de extremidades | Quando necessário, o sistema deve poder priorizar começo e fim do arquivo. | [M07](PLAN.md#m07) | [FR-043](../product/03-functional-requirements.md):416 |
| FR-044 | Não bloquear UI | Operações torrent não devem bloquear navegação da interface. | [M06](PLAN.md#m06) | [FR-044](../product/03-functional-requirements.md):422 |
| FR-045 | RAM cache | O sistema deve possuir cache quente em memória quando aplicável. | [M07](PLAN.md#m07) | [FR-045](../product/03-functional-requirements.md):430 |
| FR-046 | Disk cache | O sistema deve suportar cache persistente em disco. | [M07](PLAN.md#m07) | [FR-046](../product/03-functional-requirements.md):436 |
| FR-047 | Configurar pasta de cache | Usuário pode escolher diretório. | [M10](PLAN.md#m10) | [FR-047](../product/03-functional-requirements.md):442 |
| FR-048 | Configurar limite de cache | Usuário pode definir tamanho máximo. | [M10](PLAN.md#m10) | [FR-048](../product/03-functional-requirements.md):448 |
| FR-049 | Limpeza automática | O sistema deve conseguir liberar espaço automaticamente. | [M10](PLAN.md#m10) | [FR-049](../product/03-functional-requirements.md):454 |
| FR-050 | Política LRU | Conteúdo elegível deve poder ser removido por política de uso recente. | [M10](PLAN.md#m10) | [FR-050](../product/03-functional-requirements.md):460 |
| FR-051 | Proteger conteúdo ativo | Nunca limpar automaticamente: - playback ativo; - torrent ativo; - conteúdo protegido; - conteúdo marcado Keep. | [M07](PLAN.md#m07) | [FR-051](../product/03-functional-requirements.md):466 |
| FR-052 | Stream Only | O usuário deve poder assistir usando apenas cache temporário. | [M07](PLAN.md#m07) | [FR-052](../product/03-functional-requirements.md):479 |
| FR-053 | Keep After Watching | Usuário pode manter arquivo depois de assistir. | [M10](PLAN.md#m10) | [FR-053](../product/03-functional-requirements.md):485 |
| FR-054 | Download completo | Usuário pode solicitar download completo. | [M09](PLAN.md#m09) | [FR-054](../product/03-functional-requirements.md):491 |
| FR-055 | Alterar modo | O modo de retenção pode ser alterado posteriormente. | [M10](PLAN.md#m10) | [FR-055](../product/03-functional-requirements.md):497 |
| FR-056 | Persistir resume data | Torrent runtime deve poder ser retomado. | [M09](PLAN.md#m09) | [FR-056](../product/03-functional-requirements.md):505 |
| FR-057 | Persistir posição de playback | Posição deve ser salva continuamente. | [M05](PLAN.md#m05) | [FR-057](../product/03-functional-requirements.md):511 |
| FR-058 | Retomar playback | Ao reabrir conteúdo, usuário deve poder continuar. | [M05](PLAN.md#m05) | [FR-058](../product/03-functional-requirements.md):517 |
| FR-059 | Restaurar torrents ativos | Após reinicialização, torrents ativos devem poder ser restaurados. | [M09](PLAN.md#m09) | [FR-059](../product/03-functional-requirements.md):523 |
| FR-060 | Evitar reindexação global | Reabrir o app não deve exigir scan completo para mostrar a Home. | [M04](PLAN.md#m04) | [FR-060](../product/03-functional-requirements.md):529 |
| FR-061 | Reproduzir com MPV | A arquitetura prevista deve suportar MPV como player principal. | [M05](PLAN.md#m05) | [FR-061](../product/03-functional-requirements.md):537 |
| FR-062 | Direct Play | Quando possível, o arquivo deve ser reproduzido sem transcoding. | [M05](PLAN.md#m05) | [FR-062](../product/03-functional-requirements.md):543 |
| FR-063 | Hardware decode | Playback deve suportar aceleração de hardware. | [M05](PLAN.md#m05) | [FR-063](../product/03-functional-requirements.md):549 |
| FR-064 | Play/Pause | O usuário deve controlar reprodução. | [M05](PLAN.md#m05) | [FR-064](../product/03-functional-requirements.md):555 |
| FR-065 | Seek | O usuário deve poder avançar e voltar. | [M05](PLAN.md#m05) | [FR-065](../product/03-functional-requirements.md):561 |
| FR-066 | Múltiplas faixas de áudio | O player deve permitir troca de áudio. | [M05](PLAN.md#m05) | [FR-066](../product/03-functional-requirements.md):567 |
| FR-067 | Legendas embutidas | O player deve suportar legendas presentes no arquivo. | [M05](PLAN.md#m05) | [FR-067](../product/03-functional-requirements.md):573 |
| FR-068 | Legendas externas | O sistema deve permitir legendas externas quando suportado. | [M05](PLAN.md#m05) | [FR-068](../product/03-functional-requirements.md):579 |
| FR-069 | Fullscreen | Playback deve funcionar em fullscreen sem exposição do desktop. | [M05](PLAN.md#m05) | [FR-069](../product/03-functional-requirements.md):585 |
| FR-070 | Inicialização via Sunshine | O Ushark deve poder ser executado como app do Sunshine. | [M18](PLAN.md#m18) | [FR-070](../product/03-functional-requirements.md):593 |
| FR-071 | Detectar modo TV | Quando iniciado por esse fluxo, o app pode entrar em experiência de TV. | [M18](PLAN.md#m18) | [FR-071](../product/03-functional-requirements.md):599 |
| FR-072 | Fullscreen automático | Modo TV deve poder iniciar fullscreen. | [M18](PLAN.md#m18) | [FR-072](../product/03-functional-requirements.md):605 |
| FR-073 | Encerramento integrado | Ao sair do app, a sessão deve poder terminar corretamente. | [M18](PLAN.md#m18) | [FR-073](../product/03-functional-requirements.md):611 |
| FR-074 | Pausar ao desconectar Moonlight | Comportamento deve ser configurável. | [M18](PLAN.md#m18) | [FR-074](../product/03-functional-requirements.md):617 |
| FR-075 | Navegação por gamepad | Toda função principal deve ser utilizável sem mouse. | [M01](PLAN.md#m01) | [FR-075](../product/03-functional-requirements.md):625 |
| FR-076 | D-pad | Deve navegar entre elementos focáveis. | [M01](PLAN.md#m01) | [FR-076](../product/03-functional-requirements.md):631 |
| FR-077 | Botão selecionar | Deve existir ação padrão de confirmação. | [M01](PLAN.md#m01) | [FR-077](../product/03-functional-requirements.md):637 |
| FR-078 | Botão voltar | Deve existir navegação reversa consistente. | [M01](PLAN.md#m01) | [FR-078](../product/03-functional-requirements.md):643 |
| FR-079 | Preservar foco | Ao voltar de detalhes, a posição anterior deve ser restaurada. | [M01](PLAN.md#m01) | [FR-079](../product/03-functional-requirements.md):649 |
| FR-080 | Foco visível | Elemento ativo deve possuir estado visual inequívoco. | [M01](PLAN.md#m01) | [FR-080](../product/03-functional-requirements.md):655 |
| FR-081 | Hero | A Home deve suportar conteúdo destacado. | [M04](PLAN.md#m04) | [FR-081](../product/03-functional-requirements.md):663 |
| FR-082 | Continuar assistindo | A Home deve mostrar conteúdos incompletos recentes. | [M04](PLAN.md#m04) | [FR-082](../product/03-functional-requirements.md):669 |
| FR-083 | Filmes | A Home pode mostrar seção de filmes. | [M04](PLAN.md#m04) | [FR-083](../product/03-functional-requirements.md):675 |
| FR-084 | Séries | A Home pode mostrar seção de séries. | [M04](PLAN.md#m04) | [FR-084](../product/03-functional-requirements.md):681 |
| FR-085 | Recentes | A Home pode mostrar conteúdos adicionados recentemente. | [M04](PLAN.md#m04) | [FR-085](../product/03-functional-requirements.md):687 |
| FR-086 | Bibliotecas compartilhadas | A Home deve permitir acesso às subscriptions. | [M04](PLAN.md#m04) | [FR-086](../product/03-functional-requirements.md):693 |
| FR-087 | Tela de detalhes | Deve mostrar: - título; - descrição; - ano; - duração; - metadata; - health; - ações. | [M02](PLAN.md#m02) | [FR-087](../product/03-functional-requirements.md):701 |
| FR-088 | Iniciar preflight ao abrir details | Sources podem começar a ser avaliadas antes do Play. | [M08](PLAN.md#m08) | [FR-088](../product/03-functional-requirements.md):715 |
| FR-089 | Ação Assistir | Deve iniciar Source Selection e playback. | [M08](PLAN.md#m08) | [FR-089](../product/03-functional-requirements.md):721 |
| FR-090 | Ação Fontes | Deve permitir visualizar sources disponíveis. | [M02](PLAN.md#m02) | [FR-090](../product/03-functional-requirements.md):727 |
| FR-091 | Favoritar | Deve permitir favoritar localmente. | [M02](PLAN.md#m02) | [FR-091](../product/03-functional-requirements.md):733 |
| FR-092 | Calcular Streaming Health | **Prioridade:** P0 O sistema deve calcular adequação de uma source para streaming. | [M08](PLAN.md#m08) | [FR-092](../product/03-functional-requirements.md):741 |
| FR-093 | Medir throughput | Health deve considerar velocidade observada. | [M08](PLAN.md#m08) | [FR-093](../product/03-functional-requirements.md):749 |
| FR-094 | Medir piece availability | Health deve considerar disponibilidade de pieces relevantes. | [M08](PLAN.md#m08) | [FR-094](../product/03-functional-requirements.md):755 |
| FR-095 | Considerar peers úteis | Peers conectados e capazes de fornecer dados devem influenciar o score. | [M08](PLAN.md#m08) | [FR-095](../product/03-functional-requirements.md):761 |
| FR-096 | Considerar estabilidade | Oscilação de throughput deve influenciar negativamente. | [M08](PLAN.md#m08) | [FR-096](../product/03-functional-requirements.md):767 |
| FR-097 | Considerar bitrate | O score deve relacionar capacidade da source à necessidade do conteúdo. | [M08](PLAN.md#m08) | [FR-097](../product/03-functional-requirements.md):773 |
| FR-098 | Calcular Streaming Ratio | sustainable throughput / media bitrate | [M08](PLAN.md#m08) | [FR-098](../product/03-functional-requirements.md):779 |
| FR-099 | Confidence | Toda medição pode possuir nível de confiança. | [M08](PLAN.md#m08) | [FR-099](../product/03-functional-requirements.md):787 |
| FR-100 | Estado Medindo | UI deve suportar estado ainda sem score confiável. | [M08](PLAN.md#m08) | [FR-100](../product/03-functional-requirements.md):793 |
| FR-101 | Barras visuais | O score deve ser apresentado em indicador simples. | [M08](PLAN.md#m08) | [FR-101](../product/03-functional-requirements.md):799 |
| FR-102 | Labels | Labels mínimas: Excelente Muito bom Bom Instável Ruim | [M08](PLAN.md#m08) | [FR-102](../product/03-functional-requirements.md):805 |
| FR-103 | Startup estimate | O sistema deve poder estimar tempo até Play. | [M08](PLAN.md#m08) | [FR-103](../product/03-functional-requirements.md):819 |
| FR-104 | Separar Swarm Health | Internamente, saúde geral do swarm deve ser distinta de Streaming Health. | [M08](PLAN.md#m08) | [FR-104](../product/03-functional-requirements.md):825 |
| FR-105 | Comparar sources | O sistema deve conseguir avaliar múltiplas sources de um Content. | [M08](PLAN.md#m08) | [FR-105](../product/03-functional-requirements.md):833 |
| FR-106 | Selecionar automaticamente | Se habilitado, a melhor source deve ser escolhida sem intervenção. | [M08](PLAN.md#m08) | [FR-106](../product/03-functional-requirements.md):839 |
| FR-107 | Respeitar preferência de qualidade | Usuário pode definir prioridades. | [M08](PLAN.md#m08) | [FR-107](../product/03-functional-requirements.md):845 |
| FR-108 | Respeitar resolução máxima | Source Selection deve poder filtrar resoluções. | [M08](PLAN.md#m08) | [FR-108](../product/03-functional-requirements.md):851 |
| FR-109 | Preferir estabilidade | Modo de equilíbrio deve penalizar sources instáveis. | [M08](PLAN.md#m08) | [FR-109](../product/03-functional-requirements.md):857 |
| FR-110 | Permitir escolha manual | Usuário sempre pode selecionar source específica. | [M08](PLAN.md#m08) | [FR-110](../product/03-functional-requirements.md):863 |
| FR-111 | Persistir source override | Seleção manual pode ser salva. | [M08](PLAN.md#m08) | [FR-111](../product/03-functional-requirements.md):869 |
| FR-112 | Fallback automático | Se uma source falhar, o sistema pode procurar alternativa. | [M19](PLAN.md#m19) | [FR-112](../product/03-functional-requirements.md):875 |
| FR-113 | Troca automática configurável | Usuário pode permitir ou bloquear troca automática. | [M19](PLAN.md#m19) | [FR-113](../product/03-functional-requirements.md):881 |
| FR-114 | Persistir histórico por source | Pode armazenar: - throughput; - startup; - buffering; - failures; - timestamp. | [M19](PLAN.md#m19) | [FR-114](../product/03-functional-requirements.md):889 |
| FR-115 | Usar histórico como sinal | O sistema pode combinar histórico e medição atual. | [M19](PLAN.md#m19) | [FR-115](../product/03-functional-requirements.md):901 |
| FR-116 | Tela de downloads | Deve mostrar torrents ativos. | [M09](PLAN.md#m09) | [FR-116](../product/03-functional-requirements.md):909 |
| FR-117 | Mostrar progresso | Exibir porcentagem. | [M09](PLAN.md#m09) | [FR-117](../product/03-functional-requirements.md):915 |
| FR-118 | Mostrar velocidade | Exibir throughput. | [M09](PLAN.md#m09) | [FR-118](../product/03-functional-requirements.md):921 |
| FR-119 | Mostrar peers | Exibir número de peers quando disponível. | [M09](PLAN.md#m09) | [FR-119](../product/03-functional-requirements.md):927 |
| FR-120 | Pausar | Usuário pode pausar download. | [M09](PLAN.md#m09) | [FR-120](../product/03-functional-requirements.md):933 |
| FR-121 | Retomar | Usuário pode continuar. | [M09](PLAN.md#m09) | [FR-121](../product/03-functional-requirements.md):939 |
| FR-122 | Cancelar | Usuário pode cancelar. | [M09](PLAN.md#m09) | [FR-122](../product/03-functional-requirements.md):945 |
| FR-123 | Abrir Content | Item de download deve levar aos detalhes. | [M09](PLAN.md#m09) | [FR-123](../product/03-functional-requirements.md):951 |
| FR-124 | Salvar progresso | Playback progress deve ser local. | [M05](PLAN.md#m05) | [FR-124](../product/03-functional-requirements.md):959 |
| FR-125 | Marcar assistido | Sistema deve registrar conclusão. | [M05](PLAN.md#m05) | [FR-125](../product/03-functional-requirements.md):965 |
| FR-126 | Remover de Continuar Assistindo | Conteúdo concluído deve sair da seção apropriada. | [M05](PLAN.md#m05) | [FR-126](../product/03-functional-requirements.md):971 |
| FR-127 | Favoritos locais | Favoritos não pertencem a bibliotecas compartilhadas. | [M02](PLAN.md#m02) | [FR-127](../product/03-functional-requirements.md):977 |
| FR-128 | Preservar histórico após unsubscribe | Remover biblioteca não deve apagar histórico. | [M16](PLAN.md#m16) | [FR-128](../product/03-functional-requirements.md):983 |
| FR-129 | Detectar próximo episódio | Player deve conhecer sequência da série. | [M11](PLAN.md#m11) | [FR-129](../product/03-functional-requirements.md):991 |
| FR-130 | Autoplay configurável | Usuário pode habilitar reprodução automática. | [M11](PLAN.md#m11) | [FR-130](../product/03-functional-requirements.md):997 |
| FR-131 | Countdown | Pode existir contagem regressiva antes do próximo episódio. | [M11](PLAN.md#m11) | [FR-131](../product/03-functional-requirements.md):1003 |
| FR-132 | Preflight antecipado | Próximo episódio pode ser preparado antes do atual acabar. | [M11](PLAN.md#m11) | [FR-132](../product/03-functional-requirements.md):1009 |
| FR-133 | Criar biblioteca compartilhável | **Prioridade:** P0 **Tipo:** SHARING Usuário pode criar biblioteca independente. | [M12](PLAN.md#m12) | [FR-133](../product/03-functional-requirements.md):1017 |
| FR-134 | Nome da biblioteca | Campo obrigatório. | [M12](PLAN.md#m12) | [FR-134](../product/03-functional-requirements.md):1026 |
| FR-135 | Descrição | Campo opcional. | [M12](PLAN.md#m12) | [FR-135](../product/03-functional-requirements.md):1032 |
| FR-136 | Identidade visual | Pode possuir: - avatar; - logo; - banner; - accent color. | [M12](PLAN.md#m12) | [FR-136](../product/03-functional-requirements.md):1038 |
| FR-137 | Adicionar Content existente | Curador pode adicionar Contents já conhecidos. | [M12](PLAN.md#m12) | [FR-137](../product/03-functional-requirements.md):1049 |
| FR-138 | Selecionar sources publicadas | Curador decide quais sources fazem parte da biblioteca. | [M12](PLAN.md#m12) | [FR-138](../product/03-functional-requirements.md):1055 |
| FR-139 | Criar sections | Curador pode criar seções. | [M12](PLAN.md#m12) | [FR-139](../product/03-functional-requirements.md):1061 |
| FR-140 | Ordenar sections | Ordem publicada deve ser persistida. | [M12](PLAN.md#m12) | [FR-140](../product/03-functional-requirements.md):1067 |
| FR-141 | Ordenar items | Ordem dentro da section deve ser persistida. | [M12](PLAN.md#m12) | [FR-141](../product/03-functional-requirements.md):1073 |
| FR-142 | Hero | Curador pode definir conteúdo de destaque. | [M12](PLAN.md#m12) | [FR-142](../product/03-functional-requirements.md):1079 |
| FR-143 | Preview | Curador deve visualizar experiência antes de publicar. | [M12](PLAN.md#m12) | [FR-143](../product/03-functional-requirements.md):1085 |
| FR-144 | Gerar manifest | Biblioteca compartilhada deve ser serializável. | [M13](PLAN.md#m13) | [FR-144](../product/03-functional-requirements.md):1093 |
| FR-145 | Validar manifest | Manifest deve seguir schema conhecido. | [M13](PLAN.md#m13) | [FR-145](../product/03-functional-requirements.md):1099 |
| FR-146 | Versionar manifest | Toda publicação gera versão. | [M13](PLAN.md#m13) | [FR-146](../product/03-functional-requirements.md):1105 |
| FR-147 | Tornar versão imutável | Versão publicada não deve ser editada em-place. | [M13](PLAN.md#m13) | [FR-147](../product/03-functional-requirements.md):1111 |
| FR-148 | Hash de integridade | Manifest pode possuir hash de conteúdo. | [M13](PLAN.md#m13) | [FR-148](../product/03-functional-requirements.md):1117 |
| FR-149 | Exportar arquivo de biblioteca | Sistema deve permitir pacote compartilhável. | [M13](PLAN.md#m13) | [FR-149](../product/03-functional-requirements.md):1125 |
| FR-150 | Importar arquivo de biblioteca | Sistema deve validar antes de importar. | [M13](PLAN.md#m13) | [FR-150](../product/03-functional-requirements.md):1131 |
| FR-151 | Importar por link/código | Sistema deve suportar identificador remoto. | [M16](PLAN.md#m16) | [FR-151](../product/03-functional-requirements.md):1137 |
| FR-152 | Preview antes da importação | Mostrar: - nome; - autor; - quantidade de conteúdos; - versão. | [M13](PLAN.md#m13) | [FR-152](../product/03-functional-requirements.md):1143 |
| FR-153 | Assinar biblioteca | Usuário pode acompanhar biblioteca remota. | [M16](PLAN.md#m16) | [FR-153](../product/03-functional-requirements.md):1156 |
| FR-154 | Persistir versão instalada | Subscription deve conhecer versão atual. | [M16](PLAN.md#m16) | [FR-154](../product/03-functional-requirements.md):1162 |
| FR-155 | Verificar atualização | Sistema pode consultar nova versão. | [M16](PLAN.md#m16) | [FR-155](../product/03-functional-requirements.md):1168 |
| FR-156 | Baixar atualização | Nova versão deve ser obtida sem remover a atual primeiro. | [M16](PLAN.md#m16) | [FR-156](../product/03-functional-requirements.md):1174 |
| FR-157 | Validar atualização | Antes de ativar. | [M16](PLAN.md#m16) | [FR-157](../product/03-functional-requirements.md):1180 |
| FR-158 | Aplicar atomicamente | Swap somente após sucesso. | [M16](PLAN.md#m16) | [FR-158](../product/03-functional-requirements.md):1186 |
| FR-159 | Preservar versão anterior em falha | Nunca deixar biblioteca parcialmente atualizada. | [M16](PLAN.md#m16) | [FR-159](../product/03-functional-requirements.md):1192 |
| FR-160 | Preservar user overrides | Atualização remota não pode apagar preferências locais. | [M16](PLAN.md#m16) | [FR-160](../product/03-functional-requirements.md):1200 |
| FR-161 | Preservar progresso | Atualização não pode apagar playback state. | [M16](PLAN.md#m16) | [FR-161](../product/03-functional-requirements.md):1206 |
| FR-162 | Preservar favoritos | Atualização não pode apagar favoritos. | [M16](PLAN.md#m16) | [FR-162](../product/03-functional-requirements.md):1212 |
| FR-163 | Remoção remota não apaga Content pessoal | Se usuário adicionou item à biblioteca própria, ele continua existindo. | [M16](PLAN.md#m16) | [FR-163](../product/03-functional-requirements.md):1218 |
| FR-164 | Ocultar item localmente | Usuário pode esconder item de uma library subscription. | [M16](PLAN.md#m16) | [FR-164](../product/03-functional-requirements.md):1224 |
| FR-165 | Duplicar biblioteca | Usuário pode criar cópia independente. | [M17](PLAN.md#m17) | [FR-165](../product/03-functional-requirements.md):1232 |
| FR-166 | Novo ID | Fork deve receber novo `libraryId`. | [M17](PLAN.md#m17) | [FR-166](../product/03-functional-requirements.md):1238 |
| FR-167 | Parar sincronização automática da cópia | Fork não deve seguir o original automaticamente. | [M17](PLAN.md#m17) | [FR-167](../product/03-functional-requirements.md):1244 |
| FR-168 | Busca global | Busca deve consultar todos os Contents indexados. | [M04](PLAN.md#m04) | [FR-168](../product/03-functional-requirements.md):1252 |
| FR-169 | Buscar por título | Obrigatório. | [M04](PLAN.md#m04) | [FR-169](../product/03-functional-requirements.md):1258 |
| FR-170 | Buscar por título original | Quando disponível. | [M04](PLAN.md#m04) | [FR-170](../product/03-functional-requirements.md):1264 |
| FR-171 | Buscar séries e episódios | Obrigatório. | [M04](PLAN.md#m04) | [FR-171](../product/03-functional-requirements.md):1270 |
| FR-172 | Mostrar memberships | Resultado pode indicar bibliotecas onde o Content aparece. | [M04](PLAN.md#m04) | [FR-172](../product/03-functional-requirements.md):1276 |
| FR-173 | Abrir biblioteca offline | Dados cacheados devem continuar acessíveis. | [M04](PLAN.md#m04) | [FR-173](../product/03-functional-requirements.md):1284 |
| FR-174 | Reproduzir conteúdo local offline | Conteúdo já armazenado deve tocar. | [M05](PLAN.md#m05) | [FR-174](../product/03-functional-requirements.md):1290 |
| FR-175 | Indicar funções indisponíveis | UI deve informar quando sync ou peer discovery não estiver disponível. | [M04](PLAN.md#m04) | [FR-175](../product/03-functional-requirements.md):1296 |
| FR-176 | File watcher | Mudanças em biblioteca local devem ser detectadas. | [M04](PLAN.md#m04) | [FR-176](../product/03-functional-requirements.md):1304 |
| FR-177 | Indexação incremental | Somente itens alterados devem ser reprocessados. | [M04](PLAN.md#m04) | [FR-177](../product/03-functional-requirements.md):1310 |
| FR-178 | Não bloquear startup | Indexer pode continuar em background. | [M04](PLAN.md#m04) | [FR-178](../product/03-functional-requirements.md):1316 |
| FR-179 | Virtualizar listas grandes | Cards não visíveis não devem ser renderizados desnecessariamente. | [M04](PLAN.md#m04) | [FR-179](../product/03-functional-requirements.md):1324 |
| FR-180 | Progressive hydration | UI pode renderizar antes de metadata remota completar. | [M04](PLAN.md#m04) | [FR-180](../product/03-functional-requirements.md):1330 |
| FR-181 | Thumbnails otimizadas | Interface deve usar imagens adequadas ao tamanho exibido. | [M04](PLAN.md#m04) | [FR-181](../product/03-functional-requirements.md):1336 |
| FR-182 | Tela técnica opcional | Usuário avançado pode visualizar runtime. | [M20](PLAN.md#m20) | [FR-182](../product/03-functional-requirements.md):1344 |
| FR-183 | Mostrar download speed | Diagnóstico deve exibir throughput. | [M20](PLAN.md#m20) | [FR-183](../product/03-functional-requirements.md):1350 |
| FR-184 | Mostrar buffer | Diagnóstico deve exibir buffer estimado. | [M20](PLAN.md#m20) | [FR-184](../product/03-functional-requirements.md):1356 |
| FR-185 | Mostrar Streaming Ratio | Quando disponível. | [M20](PLAN.md#m20) | [FR-185](../product/03-functional-requirements.md):1362 |
| FR-186 | Mostrar decoder | Player pode informar codec/hardware decode. | [M20](PLAN.md#m20) | [FR-186](../product/03-functional-requirements.md):1368 |
| FR-187 | Configurar qualidade preferida | Usuário pode definir política. | [M01](PLAN.md#m01) | [FR-187](../product/03-functional-requirements.md):1376 |
| FR-188 | Configurar resolução máxima | Obrigatório. | [M01](PLAN.md#m01) | [FR-188](../product/03-functional-requirements.md):1382 |
| FR-189 | Configurar source auto-switch | Obrigatório. | [M01](PLAN.md#m01) | [FR-189](../product/03-functional-requirements.md):1388 |
| FR-190 | Configurar autoplay | Obrigatório. | [M01](PLAN.md#m01) | [FR-190](../product/03-functional-requirements.md):1394 |
| FR-191 | Configurar idioma de áudio | Preferência local. | [M01](PLAN.md#m01) | [FR-191](../product/03-functional-requirements.md):1400 |
| FR-192 | Configurar idioma de legenda | Preferência local. | [M01](PLAN.md#m01) | [FR-192](../product/03-functional-requirements.md):1406 |
| FR-193 | Configurar comportamento ao desconectar Moonlight | Exemplo: pause continue | [M01](PLAN.md#m01) | [FR-193](../product/03-functional-requirements.md):1412 |
| FR-194 | Rejeitar código executável em manifest | Nenhuma biblioteca deve executar código. | [M13](PLAN.md#m13) | [FR-194](../product/03-functional-requirements.md):1425 |
| FR-195 | Rejeitar path traversal | Paths como: ../../ devem ser inválidos. | [M13](PLAN.md#m13) | [FR-195](../product/03-functional-requirements.md):1431 |
| FR-196 | Rejeitar paths absolutos externos | Manifest remoto não deve acessar arquivos arbitrários. | [M13](PLAN.md#m13) | [FR-196](../product/03-functional-requirements.md):1443 |
| FR-197 | Limitar tamanho de manifest | Parser deve aplicar limites. | [M13](PLAN.md#m13) | [FR-197](../product/03-functional-requirements.md):1449 |
| FR-198 | Limitar profundidade JSON | Obrigatório. | [M13](PLAN.md#m13) | [FR-198](../product/03-functional-requirements.md):1455 |
| FR-199 | Limitar assets | Obrigatório. | [M13](PLAN.md#m13) | [FR-199](../product/03-functional-requirements.md):1461 |
| FR-200 | Validar schema antes de persistir | Obrigatório. | [M13](PLAN.md#m13) | [FR-200](../product/03-functional-requirements.md):1467 |
| FR-201 | Verificar assinatura | Quando presente, assinatura deve poder ser validada. | [M14](PLAN.md#m14) | [FR-201](../product/03-functional-requirements.md):1475 |
| FR-202 | Detectar mudança de identidade | Uma subscription assinada não deve aceitar nova identidade silenciosamente. | [M14](PLAN.md#m14) | [FR-202](../product/03-functional-requirements.md):1481 |
| FR-203 | Exibir status de verificação | UI pode informar: Assinatura válida Assinatura inválida Não assinada | [M14](PLAN.md#m14) | [FR-203](../product/03-functional-requirements.md):1487 |
| FR-204 | Tratar source sem peers | Sistema deve oferecer retry ou fallback. | [M19](PLAN.md#m19) | [FR-204](../product/03-functional-requirements.md):1501 |
| FR-205 | Tratar metadata ausente | Usuário pode criar item manualmente. | [M02](PLAN.md#m02) | [FR-205](../product/03-functional-requirements.md):1507 |
| FR-206 | Tratar episódio não identificado | Usuário pode mapear manualmente. | [M03](PLAN.md#m03) | [FR-206](../product/03-functional-requirements.md):1513 |
| FR-207 | Tratar falta de espaço | Mostrar ações possíveis. | [M10](PLAN.md#m10) | [FR-207](../product/03-functional-requirements.md):1519 |
| FR-208 | Tratar cache corrompido | Sistema deve poder invalidar e reconstruir dados afetados. | [M10](PLAN.md#m10) | [FR-208](../product/03-functional-requirements.md):1525 |
| FR-209 | Tratar falha do player | Playback failure não deve derrubar a UI inteira. | [M05](PLAN.md#m05) | [FR-209](../product/03-functional-requirements.md):1531 |
| FR-210 | Tratar falha de torrent runtime | UI deve continuar disponível quando possível. | [M06](PLAN.md#m06) | [FR-210](../product/03-functional-requirements.md):1537 |
| FR-211 | Diferenciar remover da biblioteca de apagar arquivo | As ações devem ser distintas. | [M02](PLAN.md#m02) | [FR-211](../product/03-functional-requirements.md):1545 |
| FR-212 | Confirmar delete físico | Arquivo local não deve ser apagado silenciosamente. | [M02](PLAN.md#m02) | [FR-212](../product/03-functional-requirements.md):1551 |
| FR-213 | Unsubscribe preserva estado | UI deve informar o que será mantido. | [M16](PLAN.md#m16) | [FR-213](../product/03-functional-requirements.md):1557 |
| FR-214 | Onboarding | Primeiro acesso deve possuir fluxo inicial. | [M01](PLAN.md#m01) | [FR-214](../product/03-functional-requirements.md):1565 |
| FR-215 | Selecionar pasta da biblioteca | Obrigatório ou com default válido. | [M01](PLAN.md#m01) | [FR-215](../product/03-functional-requirements.md):1571 |
| FR-216 | Selecionar pasta de cache | Obrigatório ou com default válido. | [M01](PLAN.md#m01) | [FR-216](../product/03-functional-requirements.md):1577 |
| FR-217 | Definir limite inicial de cache | Deve existir valor padrão. | [M01](PLAN.md#m01) | [FR-217](../product/03-functional-requirements.md):1583 |
| FR-218 | Definir política de qualidade inicial | Usuário pode escolher uma opção. | [M01](PLAN.md#m01) | [FR-218](../product/03-functional-requirements.md):1589 |
| FR-219 | Detectar Sunshine opcionalmente | Sistema pode orientar integração. | [M18](PLAN.md#m18) | [FR-219](../product/03-functional-requirements.md):1595 |
| FR-220 | Estados previsíveis de UI | Componentes assíncronos devem utilizar estados explícitos. Mínimos: idle loading ready degraded offline error | [M01](PLAN.md#m01) | [FR-220](../product/03-functional-requirements.md):1603 |
| FR-221 | Estados de Health | Mínimos: idle measuring ready error | [M08](PLAN.md#m08) | [FR-221](../product/03-functional-requirements.md):1620 |
| FR-222 | Estados de Sync | Mínimos: idle checking downloading validating applying ready error | [M16](PLAN.md#m16) | [FR-222](../product/03-functional-requirements.md):1633 |
| FR-223 | Content é independente de Source | Nunca modelar torrent como Content. | [M02](PLAN.md#m02) | [FR-223](../product/03-functional-requirements.md):1651 |
| FR-224 | Estado do usuário é independente de Library | Progresso e preferências não pertencem ao manifest. | [M02](PLAN.md#m02) | [FR-224](../product/03-functional-requirements.md):1657 |
| FR-225 | Biblioteca compartilhada não controla runtime local | Curador pode recomendar source, não forçar execução. | [M12](PLAN.md#m12) | [FR-225](../product/03-functional-requirements.md):1663 |
| FR-226 | Runtime real vence metadata declarativa | Exemplo: Manifest: 4K Probe: 1080p Resultado técnico: 1080p | [M07](PLAN.md#m07) | [FR-226](../product/03-functional-requirements.md):1669 |
| FR-227 | User override tem maior prioridade local | Escolhas explícitas do usuário devem ser respeitadas. | [M08](PLAN.md#m08) | [FR-227](../product/03-functional-requirements.md):1682 |
| NFR-001 | Cold Start | **Prioridade:** P0 O aplicativo deve atingir uma Home utilizável em: < 2 segundos em hardware compatível e biblioteca já indexada. Condições Não inclui: - primeira indexação completa; - download de metadata remota; - resolução de novos torrents. | [M04](PLAN.md#m04) | [NFR-001](../product/04-non-functional-requirements.md):66 |
| NFR-002 | Warm Start | Reabertura com processos/cache disponíveis deve atingir UI utilizável em: < 500 ms como meta de otimização. | [M04](PLAN.md#m04) | [NFR-002](../product/04-non-functional-requirements.md):88 |
| NFR-003 | Biblioteca visível | Dados locais já indexados devem produzir conteúdo visível em: < 300 ms após a UI estar pronta. | [M04](PLAN.md#m04) | [NFR-003](../product/04-non-functional-requirements.md):100 |
| NFR-004 | Nenhuma dependência remota para render inicial | A Home não deve aguardar: - TMDB; - trackers; - DHT; - health probes; - sincronização de bibliotecas remotas. | [M01](PLAN.md#m01) | [NFR-004](../product/04-non-functional-requirements.md):112 |
| NFR-005 | Navegação | Trocas de tela baseadas em dados locais devem responder em: < 100 ms como meta perceptual. | [M01](PLAN.md#m01) | [NFR-005](../product/04-non-functional-requirements.md):126 |
| NFR-006 | Frame Rate | A interface de TV deve buscar: 60 FPS em hardware suportado. | [M01](PLAN.md#m01) | [NFR-006](../product/04-non-functional-requirements.md):138 |
| NFR-007 | Input Latency | O app deve processar ações de controle sem atraso perceptível adicional relevante além da latência introduzida por Sunshine/Moonlight. | [M01](PLAN.md#m01) | [NFR-007](../product/04-non-functional-requirements.md):150 |
| NFR-008 | Foco imediato | Mudança de foco entre cards não deve depender de request de rede. | [M01](PLAN.md#m01) | [NFR-008](../product/04-non-functional-requirements.md):156 |
| NFR-009 | Operações assíncronas | Nenhuma operação de: - torrent; - metadata; - sync; - indexação; - image processing; deve bloquear a thread principal da UI. | [M01](PLAN.md#m01) | [NFR-009](../product/04-non-functional-requirements.md):162 |
| NFR-010 | Poster local | Poster já cacheado e dimensionado deve ser disponibilizado em: < 50 ms como meta. | [M02](PLAN.md#m02) | [NFR-010](../product/04-non-functional-requirements.md):178 |
| NFR-011 | Thumbnails | A UI não deve carregar imagem original quando existir variante adequada. | [M02](PLAN.md#m02) | [NFR-011](../product/04-non-functional-requirements.md):190 |
| NFR-012 | Tamanhos derivados | O sistema deve permitir variantes de imagem adequadas a: cards pequenos cards grandes hero backdrop | [M02](PLAN.md#m02) | [NFR-012](../product/04-non-functional-requirements.md):196 |
| NFR-013 | Carregamento progressivo | Imagens podem aparecer progressivamente sem bloquear navegação. | [M02](PLAN.md#m02) | [NFR-013](../product/04-non-functional-requirements.md):209 |
| NFR-014 | Virtualização | A interface deve continuar responsiva com milhares de Contents. | [M04](PLAN.md#m04) | [NFR-014](../product/04-non-functional-requirements.md):217 |
| NFR-015 | Render limitado | Somente elementos visíveis ou próximos devem ser montados sempre que possível. | [M04](PLAN.md#m04) | [NFR-015](../product/04-non-functional-requirements.md):223 |
| NFR-016 | Busca independente do volume visual | Busca local não deve depender de cards renderizados. | [M04](PLAN.md#m04) | [NFR-016](../product/04-non-functional-requirements.md):229 |
| NFR-017 | Indexação incremental | Alterar um único item não deve provocar reindexação global. | [M04](PLAN.md#m04) | [NFR-017](../product/04-non-functional-requirements.md):235 |
| NFR-018 | Startup desejado | Com source saudável: 1 a 5 segundos entre Play e reprodução. | [M07](PLAN.md#m07) | [NFR-018](../product/04-non-functional-requirements.md):243 |
| NFR-019 | Startup não garantido | O sistema deve reconhecer que startup depende de: - peers; - swarm; - latência; - bitrate; - disco; - rede. Por isso o valor é uma meta operacional, não garantia absoluta. | [M07](PLAN.md#m07) | [NFR-019](../product/04-non-functional-requirements.md):255 |
| NFR-020 | Feedback de startup | Se playback não iniciar imediatamente, o usuário deve receber feedback em menos de: 250 ms após clicar Play. | [M05](PLAN.md#m05) | [NFR-020](../product/04-non-functional-requirements.md):270 |
| NFR-021 | Preflight | Trabalho antecipado deve ser utilizado para reduzir startup percebido. | [M08](PLAN.md#m08) | [NFR-021](../product/04-non-functional-requirements.md):282 |
| NFR-022 | Seek desejado | Em source saudável: 1 a 3 segundos para retomar reprodução após seek significativo. | [M07](PLAN.md#m07) | [NFR-022](../product/04-non-functional-requirements.md):290 |
| NFR-023 | Cancelamento de prioridade antiga | O engine deve reagir ao seek imediatamente. | [M07](PLAN.md#m07) | [NFR-023](../product/04-non-functional-requirements.md):302 |
| NFR-024 | Novo buffer | O sistema não deve aguardar completion de download da região anterior. | [M07](PLAN.md#m07) | [NFR-024](../product/04-non-functional-requirements.md):308 |
| NFR-025 | Buffer adaptativo | O buffer deve poder aumentar ou diminuir conforme: - bitrate; - throughput; - estabilidade; - disponibilidade. | [M07](PLAN.md#m07) | [NFR-025](../product/04-non-functional-requirements.md):316 |
| NFR-026 | Baixo buffer | Quando buffer entrar em zona crítica, engine deve aumentar agressividade de download. | [M07](PLAN.md#m07) | [NFR-026](../product/04-non-functional-requirements.md):327 |
| NFR-027 | Buffer saudável | Quando buffer estiver confortável, engine pode reduzir pressão de I/O/rede. | [M07](PLAN.md#m07) | [NFR-027](../product/04-non-functional-requirements.md):333 |
| NFR-028 | Sem valor fixo universal | O sistema não deve assumir que o mesmo número de MB serve para todos os conteúdos. | [M07](PLAN.md#m07) | [NFR-028](../product/04-non-functional-requirements.md):339 |
| NFR-029 | Ratio mensurável | O sistema deve conseguir calcular: throughput sustentável / bitrate necessário | [M08](PLAN.md#m08) | [NFR-029](../product/04-non-functional-requirements.md):347 |
| NFR-030 | Ratio atualizado | Streaming Ratio deve ser atualizado ao longo da reprodução. | [M08](PLAN.md#m08) | [NFR-030](../product/04-non-functional-requirements.md):357 |
| NFR-031 | Oscilações | O valor exibido ou utilizado internamente deve evitar reagir excessivamente a picos momentâneos. | [M08](PLAN.md#m08) | [NFR-031](../product/04-non-functional-requirements.md):363 |
| NFR-032 | Health inicial progressivo | O sistema deve aceitar score de baixa confiança inicialmente. | [M08](PLAN.md#m08) | [NFR-032](../product/04-non-functional-requirements.md):371 |
| NFR-033 | Confidence | Toda decisão automática baseada em Health deve poder considerar confiança da medição. | [M08](PLAN.md#m08) | [NFR-033](../product/04-non-functional-requirements.md):377 |
| NFR-034 | Reavaliação contínua | Health não é valor estático. | [M08](PLAN.md#m08) | [NFR-034](../product/04-non-functional-requirements.md):383 |
| NFR-035 | Métricas reais | Seeder count isolado não pode determinar o score. | [M08](PLAN.md#m08) | [NFR-035](../product/04-non-functional-requirements.md):389 |
| NFR-036 | Streaming Health separado | Adequação para playback deve ser separada da saúde geral do swarm. | [M08](PLAN.md#m08) | [NFR-036](../product/04-non-functional-requirements.md):395 |
| NFR-037 | Decisão explicável | O sistema deve poder registrar por que uma source foi escolhida. Exemplo interno: higher stable throughput acceptable quality lower startup estimate | [M08](PLAN.md#m08) | [NFR-037](../product/04-non-functional-requirements.md):403 |
| NFR-038 | Não escolher apenas por resolução | Resolução máxima não deve ser a única variável. | [M08](PLAN.md#m08) | [NFR-038](../product/04-non-functional-requirements.md):417 |
| NFR-039 | Fallback | Se a source escolhida falhar, a arquitetura deve permitir troca sem reiniciar o aplicativo. | [M19](PLAN.md#m19) | [NFR-039](../product/04-non-functional-requirements.md):423 |
| NFR-040 | Memória limitada | RAM cache deve possuir limite configurável ou adaptativo. | [M07](PLAN.md#m07) | [NFR-040](../product/04-non-functional-requirements.md):431 |
| NFR-041 | Sem crescimento ilimitado | Cache não deve consumir memória indefinidamente. | [M07](PLAN.md#m07) | [NFR-041](../product/04-non-functional-requirements.md):437 |
| NFR-042 | Prioridade de dados quentes | Pieces relevantes ao playback devem ter precedência. | [M07](PLAN.md#m07) | [NFR-042](../product/04-non-functional-requirements.md):443 |
| NFR-043 | Limite configurável | Usuário deve poder estabelecer máximo. | [M10](PLAN.md#m10) | [NFR-043](../product/04-non-functional-requirements.md):451 |
| NFR-044 | Diretório configurável | Cache não deve estar preso a um volume específico. | [M10](PLAN.md#m10) | [NFR-044](../product/04-non-functional-requirements.md):457 |
| NFR-045 | Preferência por armazenamento rápido | A documentação deve recomendar SSD/NVMe para cache ativo. | [M10](PLAN.md#m10) | [NFR-045](../product/04-non-functional-requirements.md):463 |
| NFR-046 | Sem corrupção da biblioteca | Limpeza de cache não pode apagar metadata estrutural ou estado do usuário. | [M10](PLAN.md#m10) | [NFR-046](../product/04-non-functional-requirements.md):469 |
| NFR-047 | LRU segura | Limpeza automática deve respeitar proteções. | [M10](PLAN.md#m10) | [NFR-047](../product/04-non-functional-requirements.md):477 |
| NFR-048 | Nunca remover ativo | Arquivos usados em playback não devem ser removidos. | [M07](PLAN.md#m07) | [NFR-048](../product/04-non-functional-requirements.md):483 |
| NFR-049 | Nunca remover protegido | Conteúdo marcado para retenção deve permanecer. | [M10](PLAN.md#m10) | [NFR-049](../product/04-non-functional-requirements.md):489 |
| NFR-050 | Recuperação de espaço previsível | O sistema deve saber estimar quanto pode liberar antes de uma operação de limpeza. | [M10](PLAN.md#m10) | [NFR-050](../product/04-non-functional-requirements.md):495 |
| NFR-051 | Estado transacional | Alterações críticas devem ser persistidas de forma consistente. | [M02](PLAN.md#m02) | [NFR-051](../product/04-non-functional-requirements.md):503 |
| NFR-052 | WAL | SQLite deve ser configurável para modo apropriado de concorrência, como WAL, conforme spec técnica. | [M02](PLAN.md#m02) | [NFR-052](../product/04-non-functional-requirements.md):509 |
| NFR-053 | Playback progress | Perda abrupta do app não deve causar perda significativa de progresso. Meta: perder no máximo alguns segundos de posição | [M05](PLAN.md#m05) | [NFR-053](../product/04-non-functional-requirements.md):515 |
| NFR-054 | Resume Data | Estado torrent deve ser salvo periodicamente e no shutdown normal. | [M09](PLAN.md#m09) | [NFR-054](../product/04-non-functional-requirements.md):527 |
| NFR-055 | Library Update | Atualização de biblioteca remota deve ser atômica. | [M16](PLAN.md#m16) | [NFR-055](../product/04-non-functional-requirements.md):535 |
| NFR-056 | Rollback | Versão anterior deve permanecer disponível até confirmação da nova. | [M16](PLAN.md#m16) | [NFR-056](../product/04-non-functional-requirements.md):541 |
| NFR-057 | Crash during update | Crash durante sync não deve deixar manifest parcialmente aplicado. | [M16](PLAN.md#m16) | [NFR-057](../product/04-non-functional-requirements.md):547 |
| NFR-058 | Hash | Artefatos importantes podem possuir hash de integridade. | [M13](PLAN.md#m13) | [NFR-058](../product/04-non-functional-requirements.md):555 |
| NFR-059 | Manifest imutável por versão | Conteúdo identificado como versão X não deve mudar silenciosamente. | [M13](PLAN.md#m13) | [NFR-059](../product/04-non-functional-requirements.md):561 |
| NFR-060 | Dados corrompidos | Cache corrompido deve ser invalidável sem apagar estado do usuário. | [M10](PLAN.md#m10) | [NFR-060](../product/04-non-functional-requirements.md):567 |
| NFR-061 | Home offline | Aplicativo deve abrir sem internet usando dados locais. | [M04](PLAN.md#m04) | [NFR-061](../product/04-non-functional-requirements.md):575 |
| NFR-062 | Metadata offline | Metadata previamente sincronizada deve continuar disponível. | [M02](PLAN.md#m02) | [NFR-062](../product/04-non-functional-requirements.md):581 |
| NFR-063 | Imagens offline | Posters previamente cacheados devem continuar disponíveis. | [M02](PLAN.md#m02) | [NFR-063](../product/04-non-functional-requirements.md):587 |
| NFR-064 | Conteúdo local | Mídia já presente em disco deve continuar reproduzível. | [M05](PLAN.md#m05) | [NFR-064](../product/04-non-functional-requirements.md):593 |
| NFR-065 | Degradação clara | Recursos indisponíveis por falta de internet devem indicar estado, não quebrar a UI. | [M01](PLAN.md#m01) | [NFR-065](../product/04-non-functional-requirements.md):599 |
| NFR-066 | Operação em LAN | Uso via Sunshine/Moonlight deve funcionar adequadamente em rede local compatível. | [M18](PLAN.md#m18) | [NFR-066](../product/04-non-functional-requirements.md):607 |
| NFR-067 | Não saturar rede desnecessariamente | Torrent engine deve poder limitar download/upload. | [M09](PLAN.md#m09) | [NFR-067](../product/04-non-functional-requirements.md):613 |
| NFR-068 | Limites configuráveis | Usuário pode definir: download limit upload limit se a implementação expuser esse controle. | [M09](PLAN.md#m09) | [NFR-068](../product/04-non-functional-requirements.md):619 |
| NFR-069 | Prioridade de playback | Se houver conflito entre download geral e streaming ativo, playback deve ter precedência. | [M07](PLAN.md#m07) | [NFR-069](../product/04-non-functional-requirements.md):632 |
| NFR-070 | Evitar transcoding desnecessário | Direct Play deve ser preferido. | [M05](PLAN.md#m05) | [NFR-070](../product/04-non-functional-requirements.md):640 |
| NFR-071 | Hardware decode | Quando disponível, usar aceleração de hardware. | [M05](PLAN.md#m05) | [NFR-071](../product/04-non-functional-requirements.md):646 |
| NFR-072 | Não bloquear UI com CPU heavy tasks | Parsing, hashing e probing devem ficar fora da thread principal. | [M04](PLAN.md#m04) | [NFR-072](../product/04-non-functional-requirements.md):652 |
| NFR-073 | GPU decode | Player deve poder usar hardware decode. | [M05](PLAN.md#m05) | [NFR-073](../product/04-non-functional-requirements.md):660 |
| NFR-074 | Sunshine hardware encode | Arquitetura deve permitir que Sunshine utilize encoder de hardware quando disponível. | [M18](PLAN.md#m18) | [NFR-074](../product/04-non-functional-requirements.md):666 |
| NFR-075 | Sem dupla transcodificação desnecessária | Evitar pipelines que decodificam/transcodificam sem necessidade. | [M05](PLAN.md#m05) | [NFR-075](../product/04-non-functional-requirements.md):672 |
| NFR-076 | I/O concorrente controlado | Torrent engine e player não devem causar thrashing excessivo de disco. | [M07](PLAN.md#m07) | [NFR-076](../product/04-non-functional-requirements.md):680 |
| NFR-077 | Cache quente separado | Arquitetura deve permitir cache ativo em volume diferente da biblioteca permanente. | [M07](PLAN.md#m07) | [NFR-077](../product/04-non-functional-requirements.md):686 |
| NFR-078 | Escrita desnecessária | Não persistir cada pequena atualização de runtime como arquivo JSON. | [M07](PLAN.md#m07) | [NFR-078](../product/04-non-functional-requirements.md):692 |
| NFR-079 | Milhares de conteúdos | Arquitetura deve suportar milhares de filmes/séries indexados. | [M04](PLAN.md#m04) | [NFR-079](../product/04-non-functional-requirements.md):700 |
| NFR-080 | Dezenas de milhares de episódios | Data model não deve assumir biblioteca pequena. | [M03](PLAN.md#m03) | [NFR-080](../product/04-non-functional-requirements.md):706 |
| NFR-081 | Múltiplas bibliotecas | Usuário pode assinar diversas libraries sem duplicar Content. | [M04](PLAN.md#m04) | [NFR-081](../product/04-non-functional-requirements.md):712 |
| NFR-082 | Múltiplas sources | Um Content pode ter várias sources sem degradação estrutural. | [M04](PLAN.md#m04) | [NFR-082](../product/04-non-functional-requirements.md):718 |
| NFR-083 | UI separada do Torrent Runtime | Crash da UI não deve necessariamente invalidar sessão torrent. | [M06](PLAN.md#m06) | [NFR-083](../product/04-non-functional-requirements.md):726 |
| NFR-084 | Player isolado | Falha do player não deve derrubar todo o app. | [M05](PLAN.md#m05) | [NFR-084](../product/04-non-functional-requirements.md):732 |
| NFR-085 | Reinício de componente | Componentes isolados devem poder ser reiniciados quando possível. | [M21](PLAN.md#m21) | [NFR-085](../product/04-non-functional-requirements.md):738 |
| NFR-086 | Tracker failure | Falha de tracker não deve encerrar automaticamente o torrent. | [M06](PLAN.md#m06) | [NFR-086](../product/04-non-functional-requirements.md):746 |
| NFR-087 | Peer loss | Peer disconnect deve ser tratado como condição normal. | [M06](PLAN.md#m06) | [NFR-087](../product/04-non-functional-requirements.md):752 |
| NFR-088 | Network reconnect | Após retorno da rede, componentes devem tentar recuperação. | [M06](PLAN.md#m06) | [NFR-088](../product/04-non-functional-requirements.md):758 |
| NFR-089 | Metadata provider failure | Falha do TMDB não deve impedir acesso ao catálogo local. | [M02](PLAN.md#m02) | [NFR-089](../product/04-non-functional-requirements.md):764 |
| NFR-090 | Shared library service failure | Subscriptions existentes devem continuar acessíveis localmente. | [M16](PLAN.md#m16) | [NFR-090](../product/04-non-functional-requirements.md):770 |
| NFR-091 | Declarative only | Manifest não pode executar código. | [M13](PLAN.md#m13) | [NFR-091](../product/04-non-functional-requirements.md):778 |
| NFR-092 | Path sandbox | Todos os paths internos devem ser validados. | [M13](PLAN.md#m13) | [NFR-092](../product/04-non-functional-requirements.md):784 |
| NFR-093 | Path traversal | Entradas contendo traversal devem ser rejeitadas. | [M13](PLAN.md#m13) | [NFR-093](../product/04-non-functional-requirements.md):790 |
| NFR-094 | Absolute paths | Bibliotecas remotas não devem apontar livremente para filesystem do usuário. | [M13](PLAN.md#m13) | [NFR-094](../product/04-non-functional-requirements.md):796 |
| NFR-095 | Protocol allowlist | Remote assets devem utilizar protocolos explicitamente permitidos. | [M13](PLAN.md#m13) | [NFR-095](../product/04-non-functional-requirements.md):802 |
| NFR-096 | Tamanho máximo de manifest | Deve existir limite configurado na spec técnica. | [M13](PLAN.md#m13) | [NFR-096](../product/04-non-functional-requirements.md):810 |
| NFR-097 | Profundidade JSON | Parser deve rejeitar estruturas excessivamente profundas. | [M13](PLAN.md#m13) | [NFR-097](../product/04-non-functional-requirements.md):816 |
| NFR-098 | Quantidade máxima de items | Deve existir proteção contra payload malicioso. | [M13](PLAN.md#m13) | [NFR-098](../product/04-non-functional-requirements.md):822 |
| NFR-099 | Quantidade máxima de assets | Obrigatório. | [M13](PLAN.md#m13) | [NFR-099](../product/04-non-functional-requirements.md):828 |
| NFR-100 | Tamanho máximo de string | Campos textuais devem possuir limites razoáveis. | [M13](PLAN.md#m13) | [NFR-100](../product/04-non-functional-requirements.md):834 |
| NFR-101 | Não confiar em MIME declarado | Cliente deve validar conteúdo baixado quando possível. | [M13](PLAN.md#m13) | [NFR-101](../product/04-non-functional-requirements.md):842 |
| NFR-102 | Cache local | Assets remotos devem ser cacheados. | [M13](PLAN.md#m13) | [NFR-102](../product/04-non-functional-requirements.md):848 |
| NFR-103 | Timeout | Requests externos devem possuir timeout. | [M13](PLAN.md#m13) | [NFR-103](../product/04-non-functional-requirements.md):854 |
| NFR-104 | Falha de asset | Imagem quebrada não deve impedir carregamento da biblioteca. | [M13](PLAN.md#m13) | [NFR-104](../product/04-non-functional-requirements.md):860 |
| NFR-105 | Algoritmo moderno | Assinatura deve utilizar algoritmo considerado seguro no momento da implementação. Planejado: Ed25519 | [M14](PLAN.md#m14) | [NFR-105](../product/04-non-functional-requirements.md):868 |
| NFR-106 | Identidade persistente | Uma subscription assinada deve lembrar a identidade previamente aceita. | [M14](PLAN.md#m14) | [NFR-106](../product/04-non-functional-requirements.md):880 |
| NFR-107 | Mudança de key | Troca inesperada deve exigir ação explícita do usuário. | [M14](PLAN.md#m14) | [NFR-107](../product/04-non-functional-requirements.md):886 |
| NFR-108 | Estado local por padrão | Histórico e progresso devem permanecer locais, salvo feature explícita futura. | [M02](PLAN.md#m02) | [NFR-108](../product/04-non-functional-requirements.md):894 |
| NFR-109 | Não publicar biblioteca automaticamente | Conteúdo criado localmente é privado por padrão. | [M12](PLAN.md#m12) | [NFR-109](../product/04-non-functional-requirements.md):900 |
| NFR-110 | Publicação explícita | Compartilhamento remoto exige ação do usuário. | [M15](PLAN.md#m15) | [NFR-110](../product/04-non-functional-requirements.md):906 |
| NFR-111 | Logs estruturados | Componentes principais devem produzir logs estruturados. | [M20](PLAN.md#m20) | [NFR-111](../product/04-non-functional-requirements.md):914 |
| NFR-112 | Correlation IDs | Operações complexas podem possuir identificador correlacionável. Exemplo: playbackSessionId torrentSessionId librarySyncId | [M20](PLAN.md#m20) | [NFR-112](../product/04-non-functional-requirements.md):920 |
| NFR-113 | Sem secrets em logs | Tokens, credenciais e URLs sensíveis não devem ser logados integralmente. | [M20](PLAN.md#m20) | [NFR-113](../product/04-non-functional-requirements.md):934 |
| NFR-114 | Métricas torrent | Disponibilizar internamente: - peers; - throughput; - upload; - download; - piece availability; - buffer. | [M20](PLAN.md#m20) | [NFR-114](../product/04-non-functional-requirements.md):942 |
| NFR-115 | Métricas player | Disponibilizar: - codec; - bitrate; - posição; - dropped frames quando possível; - hardware decode. | [M05](PLAN.md#m05) | [NFR-115](../product/04-non-functional-requirements.md):955 |
| NFR-116 | Métricas UI | Durante desenvolvimento, permitir observar: - frame drops; - render duration; - memory. | [M01](PLAN.md#m01) | [NFR-116](../product/04-non-functional-requirements.md):967 |
| NFR-117 | Diagnóstico exportável | Futuramente, diagnóstico poderá ser exportado sem dados pessoais desnecessários. | [M20](PLAN.md#m20) | [NFR-117](../product/04-non-functional-requirements.md):977 |
| NFR-118 | Windows | Windows é plataforma principal inicial. | [M22](PLAN.md#m22) | [NFR-118](../product/04-non-functional-requirements.md):985 |
| NFR-119 | Arquitetura futura | Separação de domínio deve evitar dependência total de APIs exclusivas de Windows quando não necessário. | [M02](PLAN.md#m02) | [NFR-119](../product/04-non-functional-requirements.md):991 |
| NFR-120 | Sunshine | Versões suportadas devem ser documentadas. | [M18](PLAN.md#m18) | [NFR-120](../product/04-non-functional-requirements.md):997 |
| NFR-121 | Moonlight | O produto deve usar protocolos de input de forma compatível com o fluxo Sunshine/Moonlight. | [M18](PLAN.md#m18) | [NFR-121](../product/04-non-functional-requirements.md):1003 |
| NFR-122 | 100% das funções essenciais via gamepad | Usuário na TV não deve precisar de mouse para: - navegar; - abrir; - reproduzir; - pausar; - voltar; - selecionar fonte; - trocar áudio; - trocar legenda; - sair. | [M18](PLAN.md#m18) | [NFR-122](../product/04-non-functional-requirements.md):1011 |
| NFR-123 | Focus trap | Modais não devem perder foco para elementos atrás. | [M01](PLAN.md#m01) | [NFR-123](../product/04-non-functional-requirements.md):1027 |
| NFR-124 | Focus restoration | Ao fechar overlay/modal, foco retorna ao elemento anterior. | [M01](PLAN.md#m01) | [NFR-124](../product/04-non-functional-requirements.md):1033 |
| NFR-125 | Distância | Texto deve ser legível a distância típica de sala. | [M01](PLAN.md#m01) | [NFR-125](../product/04-non-functional-requirements.md):1041 |
| NFR-126 | Contraste | Elementos de foco devem possuir contraste suficiente. | [M01](PLAN.md#m01) | [NFR-126](../product/04-non-functional-requirements.md):1047 |
| NFR-127 | Safe areas | UI deve considerar overscan/safe area quando necessário. | [M01](PLAN.md#m01) | [NFR-127](../product/04-non-functional-requirements.md):1053 |
| NFR-128 | Dados locais primeiro | Render inicial deve usar cache local. | [M04](PLAN.md#m04) | [NFR-128](../product/04-non-functional-requirements.md):1061 |
| NFR-129 | Metadata remota depois | Enriquecimento remoto ocorre sem bloquear. | [M02](PLAN.md#m02) | [NFR-129](../product/04-non-functional-requirements.md):1067 |
| NFR-130 | Health assíncrono | Cards/details podem aparecer antes do Health Score. | [M08](PLAN.md#m08) | [NFR-130](../product/04-non-functional-requirements.md):1073 |
| NFR-131 | Update não destrutivo | Atualização do aplicativo não deve apagar: - biblioteca; - cache index; - estado; - downloads. | [M22](PLAN.md#m22) | [NFR-131](../product/04-non-functional-requirements.md):1081 |
| NFR-132 | Data migrations | Mudanças de schema devem possuir migração. | [M02](PLAN.md#m02) | [NFR-132](../product/04-non-functional-requirements.md):1092 |
| NFR-133 | Migration rollback/failure | Falha de migração deve ser tratada de forma recuperável. | [M02](PLAN.md#m02) | [NFR-133](../product/04-non-functional-requirements.md):1098 |
| NFR-134 | Semantic versioning | Schemas devem seguir versionamento coerente. | [M13](PLAN.md#m13) | [NFR-134](../product/04-non-functional-requirements.md):1106 |
| NFR-135 | Minor compatibility | Versões compatíveis devem poder ser lidas quando possível. | [M13](PLAN.md#m13) | [NFR-135](../product/04-non-functional-requirements.md):1112 |
| NFR-136 | Major incompatibility | Mudanças breaking devem ser detectadas explicitamente. | [M13](PLAN.md#m13) | [NFR-136](../product/04-non-functional-requirements.md):1118 |
| NFR-137 | Modularidade | Arquitetura deve separar: UI Library Metadata Torrent Health Source Selection Playback Sharing Persistence | [M01](PLAN.md#m01) | [NFR-137](../product/04-non-functional-requirements.md):1126 |
| NFR-138 | Contracts | Integrações entre módulos devem possuir contratos explícitos. | [M01](PLAN.md#m01) | [NFR-138](../product/04-non-functional-requirements.md):1144 |
| NFR-139 | Engine substituível | UI não deve depender diretamente de detalhes específicos do torrent engine. | [M06](PLAN.md#m06) | [NFR-139](../product/04-non-functional-requirements.md):1150 |
| NFR-140 | Player substituível | Domínio não deve ser acoplado profundamente ao MPV. | [M05](PLAN.md#m05) | [NFR-140](../product/04-non-functional-requirements.md):1156 |
| NFR-141 | Domain testável sem UI | Regras de biblioteca e Source Selection devem possuir testes isolados. | [M02](PLAN.md#m02) | [NFR-141](../product/04-non-functional-requirements.md):1164 |
| NFR-142 | Torrent abstraído | Deve ser possível testar comportamentos com mocks/fakes. | [M01](PLAN.md#m01) | [NFR-142](../product/04-non-functional-requirements.md):1170 |
| NFR-143 | Health determinístico em testes | Health Score deve aceitar inputs controláveis. | [M08](PLAN.md#m08) | [NFR-143](../product/04-non-functional-requirements.md):1176 |
| NFR-144 | Manifest fixtures | Devem existir manifests válidos e inválidos para testes. | [M13](PLAN.md#m13) | [NFR-144](../product/04-non-functional-requirements.md):1182 |
| NFR-145 | Nenhuma regressão crítica de startup | Mudanças devem ser avaliadas contra budget de inicialização. | [M04](PLAN.md#m04) | [NFR-145](../product/04-non-functional-requirements.md):1190 |
| NFR-146 | Nenhuma regressão crítica de UI | Frame drops persistentes devem ser tratados como regressão. | [M01](PLAN.md#m01) | [NFR-146](../product/04-non-functional-requirements.md):1196 |
| NFR-147 | Nenhuma perda de estado | Testes devem cobrir crash/restart. | [M21](PLAN.md#m21) | [NFR-147](../product/04-non-functional-requirements.md):1202 |
| NFR-148 | Segurança de import | Payloads maliciosos conhecidos devem ser rejeitados. | [M13](PLAN.md#m13) | [NFR-148](../product/04-non-functional-requirements.md):1208 |
| NFR-149 | Memória previsível | Aplicativo não deve crescer indefinidamente durante navegação. | [M01](PLAN.md#m01) | [NFR-149](../product/04-non-functional-requirements.md):1216 |
| NFR-150 | Cleanup de runtime | Sessões encerradas devem liberar recursos. | [M21](PLAN.md#m21) | [NFR-150](../product/04-non-functional-requirements.md):1222 |
| NFR-151 | Torrent session reuse | Quando seguro, runtime deve ser reutilizado para mesma source. | [M06](PLAN.md#m06) | [NFR-151](../product/04-non-functional-requirements.md):1228 |
| NFR-152 | Shutdown gracioso | Ao encerrar: save playback state save resume data flush critical writes stop player stop UI | [M21](PLAN.md#m21) | [NFR-152](../product/04-non-functional-requirements.md):1236 |
| NFR-153 | Timeout de shutdown | Processos auxiliares não devem impedir encerramento indefinidamente. | [M21](PLAN.md#m21) | [NFR-153](../product/04-non-functional-requirements.md):1250 |
| NFR-154 | Crash recovery | No próximo startup, estado incompleto deve ser detectável. | [M21](PLAN.md#m21) | [NFR-154](../product/04-non-functional-requirements.md):1256 |
| NFR-155 | Sem dependência de catálogo central ilegal | O software não deve exigir catálogo de conteúdo não autorizado para funcionar. | [M02](PLAN.md#m02) | [NFR-155](../product/04-non-functional-requirements.md):1264 |
| NFR-156 | Biblioteca neutra | Manifest deve funcionar igualmente para conteúdo: - próprio; - domínio público; - autorizado; - Creative Commons. | [M13](PLAN.md#m13) | [NFR-156](../product/04-non-functional-requirements.md):1270 |
| NFR-157 | Biblioteca | 95% das aberturas de biblioteca já indexada: < 300 ms | [M04](PLAN.md#m04) | [NFR-157](../product/04-non-functional-requirements.md):1304 |
| NFR-158 | Navegação | 95% das transições puramente locais: < 100 ms | [M01](PLAN.md#m01) | [NFR-158](../product/04-non-functional-requirements.md):1314 |
| NFR-159 | UI | Sessão normal deve manter frame pacing aceitável sem stutter contínuo. | [M01](PLAN.md#m01) | [NFR-159](../product/04-non-functional-requirements.md):1324 |
| NFR-160 | Persistência | Operações normais não devem perder estado confirmado após shutdown gracioso. | [M21](PLAN.md#m21) | [NFR-160](../product/04-non-functional-requirements.md):1330 |

## Complementos não enumerados e refinamentos de arquitetura

Fontes abreviadas: PRD = [PRD master](../product/01-prd-master.md); FR = [funcionais](../product/03-functional-requirements.md); NFR = [não funcionais](../product/04-non-functional-requirements.md); UJ = [jornadas](../product/02-user-journeys.md). A01–A11 são os documentos correspondentes em [arquitetura](../README.md#architecture). § indica seção do documento, UJnn indica número da jornada. Fontes da raiz: [README](../../README.md), [CONTRIBUTING](../../CONTRIBUTING.md), [SECURITY](../../SECURITY.md), [SUPPORT](../../SUPPORT.md), [LICENSE](../../LICENSE), [AGENTS](../../AGENTS.md).

| Requisito | Definição/obrigação preservada | Milestone primário | Origem | Situação |
|---|---|---|---|---|
| RX-001 | Frontend Electron/React/TS strict/Vite/Tailwind/shadcn, pnpm/Turbo; só desktop/ui/mocks/types, main mínimo, preload restrito; pnpm dev offline com fixtures e serviços substituíveis; cenários normal/vazio/loading/offline/erro/lento/sem peers/inválido/grande. | [M01](PLAN.md#m01) | A11 §§3–26,50–64,91–94 | PLANNED |
| RX-002 | Renderer sem Node amplo, contextIsolation, CSP, navegação/window.open controlados, evitar webview e restringir DevTools de release. | [M01](PLAN.md#m01) | A08 §§21,38 | PLANNED |
| RX-003 | Configurar auto seleção, auto-switch, preflight do foco/próximo episódio e restaurar defaults sem apagar bibliotecas, downloads, histórico ou subscriptions; defaults de onboarding válidos e etapas opcionais puláveis. | [M01](PLAN.md#m01) | UJ79–80; A09 §§89–95 | PLANNED |
| RX-004 | Foco/scroll/tab restaurados, grafo espacial, B por contexto, hints por dispositivo, hotplug, ausência de hover obrigatório, safe area e escala em 1080p/1440p/4K; estados default/focused/hovered/disabled/loading/error/empty. | [M01](PLAN.md#m01) | A09 §§7–13,111–141 | PLANNED |
| RX-005 | Correção de identificação preserva sources, memberships, progresso, favoritos, histórico e overrides por merge explícito conservador; refresh de metadata não troca identidade; item manual com título/tipo/poster opcional. | [M02](PLAN.md#m02) | UJ54,67–68; A06 §§115–121 | PLANNED |
| RX-006 | Suportar entradas pelo título e pelo torrent convergindo na mesma revisão; UI usa MetadataProvider e texto Buscar filme; TMDB real só após aprovação. | [M02](PLAN.md#m02) | A11 §§31–38; UJ03–06 | PLANNED |
| RX-007 | Metadata contempla título/original/ano/sinopse/poster/backdrop/gêneros/elenco/duração/temporadas/episódios, IDs TMDB/IMDb e cache com atualização em background. | [M02](PLAN.md#m02) | PRD §8; A06 §§11–13 | PLANNED |
| RX-008 | Episódio avulso, season pack, múltiplas temporadas/especiais; selectors por vínculo Content/Source, inferência não funde episódios diferentes; legenda selecionada no torrent acompanha prioridade. | [M03](PLAN.md#m03) | PRD §11; A02 §§13–17,88–90 | PLANNED |
| RX-009 | Busca inclui nomes de bibliotecas e coleções, além de Content; filtros filmes/séries/recentes/favoritos/gêneros; consolidar memberships e todas as sources permitidas. | [M04](PLAN.md#m04) | UJ43,76–78; A09 §§26–27 | PLANNED |
| RX-010 | Hero não rouba foco ao rotacionar; ocultar seções vazias salvo intenção editorial; hydration reserva espaço e não desmonta foco; cards mostram progresso/qualidade sem sobrecarga. | [M04](PLAN.md#m04) | A09 §§14–25,119–133 | PLANNED |
| RX-011 | FTS incremental, queries em lote sem N+1 e paginação por cursor; benchmark 100/1000/10000 Contents com 1/5 sources e 1000/10000/50000 episódios. | [M04](PLAN.md#m04) | A06 §§54–56,106–114; NFR §§48–50 | PLANNED |
| RX-012 | Validar codecs H264/HEVC/AV1/VP9/MPEG4 e áudio AAC/AC3/EAC3/DTS/TrueHD/FLAC quando suportados; containers MKV/MP4/AVI/WEBM/MPEG-TS; volume/mute e sync A/V; idioma/fallback/política e estilo de legenda. | [M05](PLAN.md#m05) | A04 §§12–13,34–43,91–95 | PLANNED |
| RX-013 | Overlay capturado sobre vídeo, ocultar após inatividade, manter em pausa, restaurar foco; seek curto/longo/hold; B fecha camada antes de sair, saída normal sem confirmação e com save. | [M05](PLAN.md#m05) | A04 §§20–31; A09 §§54–71 | PLANNED |
| RX-014 | Serializar load/seek/switch/stop; ignorar eventos de sessão antiga; pause/stop/quit idempotentes; lançamento parcial limpa processo/IPC; restart limitado e liberação GPU/áudio/temp. | [M05](PLAN.md#m05) | A04 §§125–139,144–149 | PLANNED |
| RX-015 | MPV com args estruturados sem shell, paths gerenciados e IPC randomizado restrito ao usuário; legendas untrusted com allowlist e validação; sem alteração de manifest por legenda externa. | [M05](PLAN.md#m05) | A08 §§18–19,27 | PLANNED |
| RX-016 | Validar magnet scheme/tamanho/campos/params e torrent bencode/tamanho/profundidade/arquivos/pieces/paths; usar cópia gerenciada validada para evitar TOCTOU; não expor RPC à LAN. | [M06](PLAN.md#m06) | A08 §§16–17,20,25,29 | PLANNED |
| RX-017 | Aceitar infoHash com metadata local quando disponível; timeout soft/hard e pendência; discovery trackers/DHT/PEX/LSD quando aplicável; distinguir peers úteis; recheck somente com motivo. | [M06](PLAN.md#m06) | A02 §§8–15,57–68 | PLANNED |
| RX-018 | IPC versionado com handshake/capabilities, método allowlist/schema/timeout, operações longas com handle/eventos/cancelamento/snapshot; retry apenas seguro com backoff/jitter; heartbeat/reconnect/rebind; secret efêmero obrigatório se TCP. | [M06](PLAN.md#m06) | A07 §§9–23,62–80,85–109,123–148 | PLANNED |
| RX-019 | IDs distintos de conteúdo/source/torrent/stream/player/operação e correlação; eventos críticos preservados, métricas throttled/latest-value com backpressure; nenhum vídeo/imagem/blob grande em RPC; limites por mensagem. | [M06](PLAN.md#m06) | A07 §§110–122 | PLANNED |
| RX-020 | Tempo→byte usa índice quando disponível e aproximação explicitada; byte→piece considera offset e fronteiras entre arquivos; janelas HOT/WARM/BUFFER/background, deadlines, seekGeneration e última intenção vencendo. | [M07](PLAN.md#m07) | A02 §§19–44 | PLANNED |
| RX-021 | Buffer em segundos adaptativo ao bitrate/container/swarm/recursos, RAM limitada, disco sparse quando adequado, Stream Only evita restante; pause prefetch só até target; exit segue retenção. | [M07](PLAN.md#m07) | A02 §§27–35,45–48,80–85 | PLANNED |
| RX-022 | Arquivo parcial é caminho inicial; adapter HTTP Range somente se necessário, com 206/ranges validados, bind 127.0.0.1, token/TTL por sessão e sem path arbitrário. | [M07](PLAN.md#m07) | A02 §§72–76; A08 §26 | PLANNED |
| RX-023 | Erros normalizados/retryable/user-action; falta de espaço pausa escrita; benchmark primeiro frame real, seek→resume, curva de buffer, 1080p/4K/remux/packs, peers lentos/churn/latência e NVMe/SSD/HDD/volume permanente remoto; 1 playback + 2 downloads + probes. | [M07](PLAN.md#m07) | A02 §§99–118 | PLANNED |
| RX-024 | Score 0–100, barras+label, confidence, throughput sustentável/janelas, VBR, wanted availability/useful peers, caps críticos, hysteresis/EMA, TTL/stale, pós-seek; algoritmo mecânico sem LLM/servidor com versão e breakdown. | [M08](PLAN.md#m08) | A03 §§7–49,81,88–96 | PLANNED |
| RX-025 | Eligibility por codec/hardware/resolução/origem/blacklist; Balanced/Best Quality/Fastest Start, arquivo local prioritário e override viável; recomendação única/reasons e deadline; bitrate/duração desconhecidos reduzem confiança. | [M08](PLAN.md#m08) | A03 §§50–70,84–87,104–118 | PLANNED |
| RX-026 | Play não espera Health definitivo; probes lazy canceláveis e limitados por concorrência/bytes/banda, sempre abaixo de playback/seek; foco não dispara download massivo. | [M08](PLAN.md#m08) | UJ50,79; A02 §§36–38; A03 §§42–46,91–92 | PLANNED |
| RX-027 | Escolher destino/source, alterar prioridade, limite de torrents/downloads/probes e upload/download; resume periódico/pause/completion/shutdown; pausar preserva catálogo; retomar sem full recheck injustificado. | [M09](PLAN.md#m09) | UJ20–21,72–73; A02 §§54–63 | PLANNED |
| RX-028 | Reter parciais/favoritos, promover Stream Only→Keep reaproveitando bytes, demotion explícita; estimar liberação, proteger referências/ativos e reparar índice contra filesystem; volumes distintos permitidos. | [M10](PLAN.md#m10) | PRD §20; A02 §§49–53; A06 §§61–63,87 | PLANNED |
| RX-029 | Pré-carregar próximo perto do fim sob orçamento; cancelar countdown/assistir agora; episódio atual prevalece sobre próximo e restante do pack; tratar fim/ausência sem loop. | [M11](PLAN.md#m11) | UJ63–64; A02 §§86–90 | PLANNED |
| RX-030 | Distinguir coleção lógica de seção visual; coleções determinísticas/pessoais; hero/carousel/grid/continue-watching; autor seleciona sources e ordem; preview como assinante. | [M12](PLAN.md#m12) | A01 §§24–31; UJ23–28,76 | PLANNED |
| RX-031 | Comportamento: User Override > runtime > manifest > provider; apresentação library override > provider > fallback; overrides escopados e ocultação local não editam original; resolver precedência de custom title opcional em contrato. | [M12](PLAN.md#m12) | FR §43; A01 §§62–63; A05 §§58–67,132–136 | PLANNED |
| RX-032 | Schema e versão da biblioteca independentes, normalização determinística, referências sem ciclos/IDs duplicados; sem dependências entre libraries v1; extensão desconhecida ignorada e nunca executada. | [M13](PLAN.md#m13) | A01 §§5–10,42,48,64–66; A05 §§22–24,31–35 | PLANNED |
| RX-033 | Export/import offline sem conta, portátil sem DB bruto; pacote com manifest/assets/torrents permitidos e sem audiovisual/estado pessoal por default; IDs estáveis ao renomear/reordenar/remover e readicionar. | [M13](PLAN.md#m13) | A05 §§15–17,141–145,185–190 | PLANNED |
| RX-034 | Parser bounded em bytes/profundidade/itens/seções/assets/strings; archive limita comprimido/expandido/ratio/entries/tempo; rejeitar symlinks/traversal codificado/UNC/absolutos/executáveis/HTML/CSS/scripts; MIME/magic bytes e staging isolado com cleanup. | [M13](PLAN.md#m13) | A08 §§7–12,25,31–36 | PLANNED |
| RX-035 | Assets HTTPS com timeout/connect/read/total, size/MIME/bytes, validação de IP/DNS/redirect contra SSRF e protocolos privados; imagens inválidas degradam sem derrubar biblioteca, segurança crítica falha fechada. | [M13](PLAN.md#m13) | A08 §§13,29,31; A05 §§104–113 | PLANNED |
| RX-036 | Assinar libraryId/version/hash/schema/autor, verificar bytes canônicos, TOFU/pinning persistente; chave privada em secure storage/criptografada; não guardar secret plaintext; validade não prova direitos da mídia. | [M14](PLAN.md#m14) | A05 §§25–35; A08 §§14,22 | PLANNED |
| RX-037 | Draft não sincroniza; diff e confirmação de publicação; versões imutáveis crescentes; desfazer publicação gera nova versão baseada em anterior; upload stage antes do registro ativo e conflito optimistic version. | [M15](PLAN.md#m15) | UJ30,69–70; A05 §§9–10,88–94,173–175,199–201 | PLANNED |
| RX-038 | Registry opcional: resolver ID/código/latest/version/assets, auth distinta de assinatura, autorização por library e limites/rate/quota/tipos; retirar publicação não remove snapshot local; API versionada, sem hospedagem audiovisual core. | [M15](PLAN.md#m15) | A05 §§18–21,88–100,141–149,194–206; A08 §23 | PLANNED |
| RX-039 | Infra de Registry só derivada do publicar/link aprovados; declarativa com plan/review/apply, drift periódico e imagens por digest/versão; produção não criada nesta etapa de planejamento. | [M15](PLAN.md#m15) | A10 §§77–79 | PLANNED |
| RX-040 | Snapshot exato e active pointer; check manual/auto/pausado, backoff, concorrência única por library/global limitada e prioridades; idempotência, diff, rollback explícito, versões retidas e GC que protege ativa/staging/rollback. | [M16](PLAN.md#m16) | A05 §§38–52,83–87,114–130 | PLANNED |
| RX-041 | Origem removida afeta elegibilidade futura, preserva source salva/download/cache; override órfão fica histórico com fallback temporário; remoção remota e unsubscribe não apagam local; update preserva foco vizinho e sessão em execução; reparar manifest via versão anterior ou download imutável. | [M16](PLAN.md#m16) | A05 §§53–71,147–154,176–184; A09 §§143–147 | PLANNED |
| RX-042 | Deep links validam→preview→confirmação, nunca player/destruição automática; hash divergente na mesma versão e downgrade automático bloqueiam; sync stage/verify/semantic/commit não altera estado pessoal. | [M16](PLAN.md#m16) | A08 §§15,24; A09 §142 | PLANNED |
| RX-043 | Fork copia appearance/seções/ordem/memberships/overrides, novo ID, reutiliza sources/assets com referências, sem sync; provenance opcional; coleção pessoal não modifica origem. | [M17](PLAN.md#m17) | A05 §§72–78; UJ40,76 | PLANNED |
| RX-044 | TV e desktop compartilham domínio; Sunshine captura/encode/input, Moonlight cliente sem app TV próprio; hotplug sem restart; desconectar salva e aplica pause/continue; reconnect preserva sessão e retomar segue usuário. | [M18](PLAN.md#m18) | A04 §§62–79,91,98–109; UJ02,61 | PLANNED |
| RX-045 | History local agregado com decay/expiração/versão; fallback prepara candidato antes de interromper, confere Content/episódio/duração, retoma posição, conserva override, cooldown/blacklist; diferenças de edição impedem troca automática. | [M19](PLAN.md#m19) | A03 §§47–49,71–83,96–99 | PLANNED |
| RX-046 | Logs estruturados/redacted/rotacionados/bounded; painel inclui DB/WAL/counts/cache e raw/displayed Health; limpeza individual de health/playback history/cache/logs; manutenção cede a interação e playback. | [M20](PLAN.md#m20) | A06 §§47–51,98–99,135–139; A08 §28 | PLANNED |
| RX-047 | Backup consistente SQLite/WAL via API/checkpoint e manifests/resume/config; restore recupera catálogo/estado/subscriptions/config e dados não reconstruíveis/chaves; migração falha preserva original; rehydration por snapshots e recovery sem replay total. | [M21](PLAN.md#m21) | A06 §§88–105; A07 §§95–109 | PLANNED |
| RX-048 | Matriz de crash/restart de UI/Core/torrentd/MPV, DB locked, disk full, rede/tracker/provider/Registry indisponíveis, manifest/asset/resume corrompidos; stress playback+downloads+sync+metadata+cache próximo do limite, sem regressão/perda silenciosa. | [M21](PLAN.md#m21) | NFR §§49–54; A02 §§105–118; A10 §§44–49,71 | PLANNED |
| RX-049 | Gates crescem por camada: frontend format/lint/types/tests/build primeiro; lock/toolchain pinning, PR rastreável e checks mínimos; sem weakening de testes/baseline, review antes de merge e S08; testes sem internet pública; CI menor privilégio. | [M01](PLAN.md#m01) | A10 §§5–8,14–17,32–33,64–68,80–95; A11 §§50–52 | PLANNED |
| RX-050 | Toda alteração real de schema com migration, testes fresh/upgrade histórico e preservação; mudanças destrutivas com backup/review/rollback; não instalar todas as tabelas da arquitetura antecipadamente. | [M02](PLAN.md#m02) | A10 §§27–31; A06 §§100–104 | PLANNED |
| RX-051 | Ao nascer canal/native: validar contratos e geração sem drift/versionamento breaking, schemas/fixtures; binários/libtorrent/MPV/ffprobe por versão/hash, Rust checks se daemon Rust, boundaries e build nativo Windows. | [M06](PLAN.md#m06) | A10 §§18,21–24,34–36,63–65 | PLANNED |
| RX-052 | Golden manifests compatíveis/inválidos/maliciosos, fuzzing proporcional de parse/extract/torrent/deep link/RPC e security review nas mudanças de fronteira; regressão crítica impede avanço. | [M13](PLAN.md#m13) | A10 §§25–26,50–52; A08 §§34–35 | PLANNED |
| RX-053 | Workflows PR/main/nightly/release por necessidade; Windows x64 packaged smoke, installer, SBOM SPDX/checksums/build metadata e attestation quando disponível; assinatura isolada, provenance e sem latest; build uma vez/promover Canary→Beta→Stable sem rebuild, Stable manual protegido. | [M22](PLAN.md#m22) | A10 §§4,9–13,37–40,45–79,92–103 | PLANNED |
| RX-054 | Release avalia budgets absolutos e regressão contra baseline, memória em ciclos Details/Play/Exit, nightly pertinente; update por canal verifica assinatura/integridade e mantém biblioteca/cache index/estado/downloads; schema DB/IPC/manifest/API independentes. | [M22](PLAN.md#m22) | A10 §§45–49,72–76 | PLANNED |
| RX-055 | Documentar instalação/configuração/versões suportadas, changelog, suporte/relato privado, licença/créditos e artefato por SHA/run/hash; acompanhamento Story/PR/CI/review/merge distingue implementado de concluído, dashboard de qualidade quando adotado. | [M22](PLAN.md#m22) | README; CONTRIBUTING; SECURITY; SUPPORT; LICENSE; A10 §§75,96–103 | PLANNED |
| RX-056 | Preservar preferência por menor tamanho além de qualidade/equilíbrio/startup e resolução máxima; definir no contrato aprovado como ela influencia ranking sem contrariar viabilidade real. | [M08](PLAN.md#m08) | PRD §37; A03 §§52–64 | PLANNED |
| RX-057 | Cada capacidade passa por S00/S01/S02 e aprovação UX antes de contrato definitivo/adapters; se integração exigir mudança visual, voltar ao checkpoint; distinguir UI pronta de feature concluída; uma story por vez e S08 com evidências. | [M01](PLAN.md#m01) | A11 §§69–84; AGENTS; skill lifecycle | PLANNED |
| RX-058 | Acompanhamento de entrega apresenta Story, PR, status CI, review e merge, diferenciando Implemented de Done; integração Devflow e dashboard somente na medida adotada pelo projeto, sem confundir isso com funcionalidade obrigatória do aplicativo desktop. | [M22](PLAN.md#m22) | A10 §§96–103 | PLANNED |
| FUT-001 | Smart Collections; Data Saver; Always 4K. Critérios de coleção e conflito entre qualidade obrigatória e fonte inviável não definidos. | [M23](PLAN.md#m23) | A01 §§31,66; FR §44; A03 §113 | DEFERRED_NOT_SPECIFIED |
| FUT-002 | Catálogo público, private/unlisted/public, perfis, moderação/abuse, deprecation/sucessora e migração A→B com aprovação. Contas, política de descoberta/moderação e migração não especificadas; separar submilestones após discovery. | [M24](PLAN.md#m24) | A05 §§95–98,139–151,203–206 | DEFERRED_NOT_SPECIFIED |
| FUT-003 | Comentários, ratings compartilhados, social features e colaboração em drafts. Sem regras de autoria, edição concorrente, privacidade ou moderação; não prometer lançamento conjunto. | [M25](PLAN.md#m25) | A01 §66; FR §44; A05 §§140,202 | DEFERRED_NOT_SPECIFIED |
| FUT-004 | Mapeamento configurável, refresh rate, HDR/tone mapping, device de áudio, timeout/reconexão automática, preview thumbnail, ajustes de créditos e animação reduzida. Dependência da cadeia GPU/OS/MPV/Sunshine/TV; vários itens condicionais; definir entregas independentes antes de executar. | [M26](PLAN.md#m26) | A04 §§26,36,88–92,101–103; A09 §§61,69,114 | DEFERRED_NOT_SPECIFIED |
| FUT-005 | Plugins, extensões e propostas de scripts/remote plugins citadas como futuras; distinguir extensions declarativas já cobertas em M13. Execução de código externo conflita com manifest declarativo; exige nova decisão de arquitetura e threat model, nunca habilitar scripts no manifest v1. | [M27](PLAN.md#m27) | A01 §§64,66; FR §44; A08 §7 | DEFERRED_NOT_SPECIFIED |
| FUT-006 | Compatibilidade além de Windows, diagnóstico ampliado/métricas Sunshine, telemetria opt-in, delta de sync/CDN/compressão e republicação de fork. Plataformas, consentimento, transporte e budgets não definidos; escopo deve ser subdividido antes de implementação. | [M28](PLAN.md#m28) | NFR §51; A04 §117; A05 §§50,78,191–193 | DEFERRED_NOT_SPECIFIED |

## Jornadas — auditoria de ponta a ponta

O primeiro milestone é responsável pela aceitação principal da jornada; os seguintes fornecem partes do fluxo. Estes vínculos não duplicam ownership de FR/NFR.

| Jornada | Fluxo | Milestones |
|---|---|---|
| UJ-01 | Primeiro acesso | [M01](PLAN.md#m01) |
| UJ-02 | Abrir pelo Moonlight | [M18](PLAN.md#m18) |
| UJ-03 | Adicionar um arquivo `.torrent` | [M06](PLAN.md#m06), [M02](PLAN.md#m02) |
| UJ-04 | Adicionar Magnet Link | [M06](PLAN.md#m06) |
| UJ-05 | Torrent com múltiplos arquivos | [M06](PLAN.md#m06) |
| UJ-06 | Adicionar uma série | [M03](PLAN.md#m03) |
| UJ-07 | Navegar pela Home | [M04](PLAN.md#m04) |
| UJ-08 | Abrir detalhes de um conteúdo | [M08](PLAN.md#m08), [M02](PLAN.md#m02) |
| UJ-09 | Assistir um filme | [M07](PLAN.md#m07), [M05](PLAN.md#m05) |
| UJ-10 | Source automática | [M08](PLAN.md#m08) |
| UJ-11 | Trocar fonte manualmente | [M08](PLAN.md#m08) |
| UJ-12 | Seek durante playback | [M07](PLAN.md#m07) |
| UJ-13 | Torrent ficando lento durante reprodução | [M19](PLAN.md#m19) |
| UJ-14 | Source sem peers | [M19](PLAN.md#m19), [M06](PLAN.md#m06) |
| UJ-15 | Continuar assistindo | [M05](PLAN.md#m05), [M04](PLAN.md#m04) |
| UJ-16 | Finalizar conteúdo | [M05](PLAN.md#m05) |
| UJ-17 | Favoritar | [M02](PLAN.md#m02) |
| UJ-18 | Stream Only | [M07](PLAN.md#m07), [M10](PLAN.md#m10) |
| UJ-19 | Keep After Watching | [M10](PLAN.md#m10) |
| UJ-20 | Download completo | [M09](PLAN.md#m09) |
| UJ-21 | Gerenciar downloads | [M09](PLAN.md#m09) |
| UJ-22 | Biblioteca local vazia | [M01](PLAN.md#m01) |
| UJ-23 | Criar biblioteca compartilhada | [M12](PLAN.md#m12) |
| UJ-24 | Adicionar conteúdo à biblioteca compartilhada | [M12](PLAN.md#m12) |
| UJ-25 | Criar seções | [M12](PLAN.md#m12) |
| UJ-26 | Definir Hero | [M12](PLAN.md#m12) |
| UJ-27 | Reordenar biblioteca | [M12](PLAN.md#m12) |
| UJ-28 | Preview da biblioteca | [M12](PLAN.md#m12) |
| UJ-29 | Exportar biblioteca | [M13](PLAN.md#m13) |
| UJ-30 | Publicar biblioteca por link | [M15](PLAN.md#m15) |
| UJ-31 | Importar biblioteca por arquivo | [M13](PLAN.md#m13) |
| UJ-32 | Importar biblioteca por link | [M16](PLAN.md#m16) |
| UJ-33 | Navegar em biblioteca compartilhada | [M16](PLAN.md#m16) |
| UJ-34 | Assistir a partir de biblioteca compartilhada | [M16](PLAN.md#m16), [M08](PLAN.md#m08) |
| UJ-35 | Atualização de biblioteca compartilhada | [M16](PLAN.md#m16) |
| UJ-36 | Atualização com erro | [M16](PLAN.md#m16) |
| UJ-37 | Autor remove conteúdo | [M16](PLAN.md#m16) |
| UJ-38 | Adicionar item compartilhado à biblioteca pessoal | [M16](PLAN.md#m16) |
| UJ-39 | Ocultar item compartilhado | [M16](PLAN.md#m16) |
| UJ-40 | Fork de biblioteca | [M17](PLAN.md#m17) |
| UJ-41 | Mesmo conteúdo em múltiplas bibliotecas | [M04](PLAN.md#m04), [M16](PLAN.md#m16) |
| UJ-42 | Mesma source em múltiplas bibliotecas | [M06](PLAN.md#m06), [M09](PLAN.md#m09), [M19](PLAN.md#m19) |
| UJ-43 | Busca global | [M04](PLAN.md#m04) |
| UJ-44 | Modo offline | [M04](PLAN.md#m04), [M05](PLAN.md#m05), [M16](PLAN.md#m16) |
| UJ-45 | Falta de espaço | [M10](PLAN.md#m10) |
| UJ-46 | Cache automático | [M10](PLAN.md#m10) |
| UJ-47 | Player com legenda | [M05](PLAN.md#m05) |
| UJ-48 | Trocar áudio | [M05](PLAN.md#m05) |
| UJ-49 | Diagnóstico técnico | [M20](PLAN.md#m20) |
| UJ-50 | Health sendo medido | [M08](PLAN.md#m08) |
| UJ-51 | Biblioteca grande | [M04](PLAN.md#m04) |
| UJ-52 | Reabrir após reinicialização | [M04](PLAN.md#m04), [M09](PLAN.md#m09), [M21](PLAN.md#m21) |
| UJ-53 | Alteração externa de arquivo | [M04](PLAN.md#m04) |
| UJ-54 | Metadata errada | [M02](PLAN.md#m02) |
| UJ-55 | Episódio identificado incorretamente | [M03](PLAN.md#m03) |
| UJ-56 | Segurança na importação | [M13](PLAN.md#m13) |
| UJ-57 | Biblioteca assinada | [M14](PLAN.md#m14) |
| UJ-58 | Unsubscribe | [M16](PLAN.md#m16) |
| UJ-59 | Remover conteúdo local | [M02](PLAN.md#m02), [M10](PLAN.md#m10) |
| UJ-60 | Sair do player para detalhes | [M05](PLAN.md#m05) |
| UJ-61 | Encerrar sessão Moonlight durante playback | [M18](PLAN.md#m18) |
| UJ-62 | Preferências de playback | [M01](PLAN.md#m01) |
| UJ-63 | Próximo episódio | [M11](PLAN.md#m11) |
| UJ-64 | Preflight do próximo episódio | [M11](PLAN.md#m11) |
| UJ-65 | Biblioteca compartilhada com múltiplas sources | [M08](PLAN.md#m08), [M16](PLAN.md#m16) |
| UJ-66 | Source override sobrevivendo atualização | [M16](PLAN.md#m16) |
| UJ-67 | Atualização de metadata externa | [M02](PLAN.md#m02) |
| UJ-68 | Conteúdo sem provider externo | [M02](PLAN.md#m02) |
| UJ-69 | Editar biblioteca compartilhada já publicada | [M15](PLAN.md#m15) |
| UJ-70 | Rollback de biblioteca publicada | [M15](PLAN.md#m15), [M16](PLAN.md#m16) |
| UJ-71 | Health histórico melhorando decisão | [M19](PLAN.md#m19) |
| UJ-72 | Abrir app com downloads em andamento | [M09](PLAN.md#m09) |
| UJ-73 | Pausar torrent sem perder biblioteca | [M09](PLAN.md#m09) |
| UJ-74 | Remover source | [M02](PLAN.md#m02), [M06](PLAN.md#m06) |
| UJ-75 | Conteúdo sem source em biblioteca compartilhada | [M16](PLAN.md#m16) |
| UJ-76 | Reorganização pessoal sem alterar biblioteca compartilhada | [M17](PLAN.md#m17), [M12](PLAN.md#m12) |
| UJ-77 | Busca e assistir sem entrar na biblioteca de origem | [M04](PLAN.md#m04), [M08](PLAN.md#m08) |
| UJ-78 | Múltiplas bibliotecas oferecem sources diferentes | [M08](PLAN.md#m08), [M16](PLAN.md#m16) |
| UJ-79 | Configuração de comportamento automático | [M01](PLAN.md#m01), [M08](PLAN.md#m08), [M11](PLAN.md#m11), [M19](PLAN.md#m19) |
| UJ-80 | Restaurar defaults | [M01](PLAN.md#m01) |

## Auditoria do planejamento

| Verificação | Resultado |
|---|---:|
| FRs descobertos / alocados | 227 / 227 |
| NFRs descobertos / alocados | 160 / 160 |
| Complementos RX / alocados | 58 / 58 |
| Intenções FUT / destino de discovery | 6 / 6 |
| Total de entradas FR + NFR + RX + FUT | 451 |
| Jornadas com vínculo | 80 / 80 |
| IDs FR/NFR/RX/FUT sem milestone | 0 |
| Ownership primário duplicado | 0 |
| Ciclos no grafo de integração | 0 |
| Milestones v1/P1 / destinos futuros | 22 / 6 |
| Requisitos implementados ou aprovados nesta etapa | 0 |

Validação mecânica comparou os IDs da fonte com os IDs da matriz e percorreu o grafo de dependências. A análise semântica cotejou também PRD, jornadas e Architecture 01–11; contagem de IDs sozinha não prova completude semântica nem funcionamento. FUT continua **DEFERRED_NOT_SPECIFIED** e exige detalhamento antes de implementação. Aprovar o mapa não elimina as pendências documentais listadas em [SOURCE_ANALYSIS](SOURCE_ANALYSIS.md).

## Estado das preparações

Mapa aprovado pelo usuário. M01 e M02 executaram a fase frontend e receberam aprovação UX; integrações e closure permanecem pendentes. Os requisitos primários de M03 estão detalhados em [stories S00–S08](M03-series/README.md#sequência-preparada), S00–S02 concluídas com mocks, S03–S08 adiadas. FR-004/005/017/018/020/206, NFR-080 e RX-008 têm [cobertura frontend](M03-series/EXPERIENCE.md), sem inferência/persistência reais ou aceite UX implícito. Nenhum requisito de M03 foi promovido a funcionalmente aprovado ou DONE.

M05 possui [stories S00–S08 preparadas](M05-local-playback/README.md#stories) e [cobertura por etapa](M05-local-playback/PREPARATION_COVERAGE.md) para seus 30 requisitos primários, incluindo sub-stories S04.1–S04.3 e checkpoints. Preparação documental em 2026-09-13, sem execução ou aprovação UX/funcional; ownership e status de entrega dos requisitos permanecem inalterados.
