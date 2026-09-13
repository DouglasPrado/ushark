# Ushark — PRD Master

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Product Requirements Document (PRD)  
**Objetivo:** consolidar a visão, escopo, regras e requisitos funcionais do produto antes das especificações técnicas.

---

# 1. Visão do Produto

O Ushark é um media center desktop orientado a torrents, projetado para permitir que o usuário organize, descubra, reproduza e compartilhe bibliotecas de mídia baseadas em referências torrent.

O produto deve oferecer uma experiência próxima de plataformas modernas de streaming, porém com uma arquitetura local-first, na qual:

- a biblioteca pertence ao usuário;
- os arquivos torrent ou magnets são fontes de mídia;
- os metadados são enriquecidos por provedores externos como TMDB;
- a reprodução ocorre diretamente no computador;
- Sunshine transmite a aplicação;
- Moonlight funciona como cliente para a TV;
- o usuário não precisa instalar ou desenvolver um cliente específico para cada televisão;
- bibliotecas podem ser compartilhadas como curadoria, mantendo organização, categorias e layout definidos pelo autor;
- cada cliente pode escolher automaticamente a melhor fonte disponível para reprodução.

A experiência desejada é:

> abrir o aplicativo, navegar por uma biblioteca visual, selecionar um conteúdo e começar a assistir em poucos segundos, mesmo que o arquivo ainda não tenha sido baixado por completo.

---

# 2. Problema

Clientes torrent tradicionais foram projetados principalmente para download de arquivos, não para consumo de mídia em uma interface de sala.

Os problemas principais são:

- torrent e reprodução ficam separados;
- o usuário precisa lidar diretamente com arquivos, pastas e clientes torrent;
- não existe uma biblioteca visual organizada;
- metadata de filmes e séries precisa ser organizada manualmente;
- o usuário não sabe antes de clicar se um torrent conseguirá sustentar a reprodução;
- múltiplas versões do mesmo conteúdo são difíceis de comparar;
- torrents de temporadas exigem seleção manual de episódios;
- clientes para TVs podem exigir desenvolvimento específico;
- compartilhamento geralmente significa compartilhar apenas magnets ou arquivos `.torrent`, sem preservar a curadoria;
- bibliotecas de terceiros não possuem sincronização ou layout padronizado.

O Ushark resolve esses problemas unificando biblioteca, torrent, reprodução, qualidade e compartilhamento.

---

# 3. Princípios do Produto

## 3.1 Conteúdo é permanente

Filmes, séries e episódios possuem identidade própria.

Torrent não é a identidade do conteúdo.

```text
Content
≠
Torrent
```

## 3.2 Fontes são substituíveis

Um mesmo conteúdo pode possuir várias fontes.

```text
Filme
├── Torrent 4K Remux
├── Torrent 4K HEVC
├── Torrent 1080p
└── Torrent 720p
```

## 3.3 Biblioteca é curadoria

Uma biblioteca representa:

- seleção;
- organização;
- categorias;
- ordem;
- destaques;
- layout;
- fontes recomendadas.

## 3.4 Estado pertence ao usuário

Progresso, favoritos, fonte preferida e histórico não pertencem à biblioteca compartilhada.

## 3.5 Local-first

O aplicativo deve continuar funcional com dados já sincronizados mesmo sem acesso à internet.

## 3.6 Playback antes de download completo

O objetivo do sistema não é terminar o download para depois reproduzir.

O objetivo é disponibilizar os pedaços necessários no momento certo.

## 3.7 O usuário não deve precisar entender BitTorrent

Informações técnicas devem ser traduzidas para conceitos simples.

Exemplo:

```text
█████ Excelente
Pronto em ~1s
```

em vez de exigir interpretação manual de:

```text
seeders
leechers
piece availability
throughput
```

---

# 4. Usuários

## 4.1 Usuário principal

Pessoa que mantém uma biblioteca própria de mídia e utiliza torrents como fonte.

Deseja:

- centralizar conteúdo;
- navegar visualmente;
- assistir na TV;
- evitar gerenciar arquivos manualmente;
- continuar assistindo de onde parou;
- saber se a fonte é boa antes de clicar em Play.

## 4.2 Curador

Usuário que cria uma biblioteca organizada e deseja compartilhá-la.

Deseja:

- nomear a biblioteca;
- escrever descrição;
- organizar filmes e séries;
- criar seções;
- definir ordem;
- destacar conteúdos;
- escolher fontes;
- publicar atualizações.

## 4.3 Assinante

Usuário que importa uma biblioteca criada por outra pessoa.

Deseja:

- ver a biblioteca exatamente como o autor organizou;
- receber atualizações;
- manter suas preferências locais;
- trocar fontes quando necessário;
- não perder progresso se a biblioteca mudar.

---

# 5. Plataforma

## 5.1 Aplicativo principal

Desktop.

Interface otimizada para:

- tela cheia;
- navegação por controle;
- uso à distância;
- resolução de TV.

Tecnologias planejadas serão definidas nas especificações técnicas, mas o produto assume:

```text
Desktop App
↓
Player local
↓
Sunshine
↓
Moonlight
↓
TV
```

## 5.2 TV

Não haverá requisito inicial de cliente Ushark nativo para TV.

Moonlight será o cliente de apresentação.

Essa decisão elimina a necessidade inicial de:

- Android TV app;
- Tizen app;
- WebOS app;
- Chromecast;
- cliente web dedicado para playback;
- adaptação de codecs por plataforma.

---

# 6. Experiência principal

Fluxo principal:

```text
Abrir Moonlight
↓
Selecionar Ushark
↓
Sunshine inicia o app
↓
Ushark abre em tela cheia
↓
Biblioteca aparece
↓
Usuário escolhe conteúdo
↓
Torrent Health é avaliado
↓
Fonte é selecionada
↓
Buffer inicial é preparado
↓
MPV inicia reprodução
↓
Sunshine transmite
↓
Usuário assiste na TV
```

---

# 7. Biblioteca Local

O usuário poderá manter uma biblioteca organizada em disco.

Estrutura conceitual:

```text
library/
├── manifest.json
├── items/
├── sources/
└── assets/
```

A biblioteca poderá conter:

- filmes;
- séries;
- temporadas;
- episódios;
- coleções;
- seções;
- fontes torrent;
- metadata;
- imagens;
- preferências de apresentação.

---

# 8. Metadata

## 8.1 Provider principal

TMDB será utilizado como referência primária para metadata visual.

Pode fornecer:

- título;
- título original;
- ano;
- sinopse;
- poster;
- backdrop;
- gêneros;
- elenco;
- duração;
- temporadas;
- episódios.

## 8.2 IMDb

IMDb pode ser armazenado como identificador externo.

## 8.3 Cache

Metadata e imagens devem ser mantidos em cache local.

Objetivo:

- abrir biblioteca rapidamente;
- reduzir dependência de rede;
- permitir modo offline;
- evitar recarregamento de imagens.

## 8.4 Overrides

O autor de uma biblioteca poderá sobrescrever alguns campos de apresentação.

Exemplo:

```text
Título da seção:
"Filmes que você precisa assistir"
```

sem alterar o cadastro global do conteúdo.

---

# 9. Importação de Conteúdo

O usuário poderá adicionar:

- `.torrent`;
- magnet link.

O sistema deverá:

```text
Torrent
↓
Ler metadata
↓
Identificar arquivos de vídeo
↓
Inferir filme/série/episódio
↓
Pesquisar metadata
↓
Apresentar correspondência
↓
Usuário confirma
↓
Adicionar à biblioteca
```

---

# 10. Filmes

Um filme deve ser representado independentemente de sua fonte.

Exemplo:

```text
Interestelar
TMDB: 157336

Sources:
├── 4K Remux
├── 4K HEVC
└── 1080p
```

O usuário poderá possuir múltiplas versões.

---

# 11. Séries

O sistema deve suportar:

- torrent de episódio;
- torrent de temporada;
- torrent contendo múltiplas temporadas;
- especiais;
- arquivos nomeados com padrão `SxxExx`.

Exemplo:

```text
Breaking.Bad.S01.torrent

├── S01E01.mkv
├── S01E02.mkv
├── S01E03.mkv
└── ...
```

O Ushark deverá mapear automaticamente cada arquivo ao episódio correspondente.

---

# 12. Identificação de Arquivos

O sistema deverá analisar:

- nome do arquivo;
- extensão;
- tamanho;
- número de temporada;
- número de episódio;
- conteúdo do torrent.

Estratégias previstas:

```text
largest-video
filename
episode
manual
```

O usuário deve poder corrigir associações incorretas.

---

# 13. Streaming por Torrent

A reprodução não deverá aguardar o download completo.

Fluxo:

```text
Torrent
↓
Descoberta de peers
↓
Metadata
↓
Prioridade dos pieces necessários
↓
Buffer
↓
Player
```

O engine deve priorizar os dados mais próximos da posição atual de playback.

---

# 14. Scheduler de Pieces

O sistema deverá utilizar prioridades de download diferentes.

Exemplo conceitual:

```text
Posição atual          prioridade máxima
Próximos 30 segundos   prioridade máxima
30s → 2 min            prioridade alta
2 → 10 min             prioridade média
Restante               prioridade normal
```

Objetivo:

- startup rápido;
- seek rápido;
- menor buffering;
- evitar download desnecessário.

---

# 15. Seek

Quando o usuário avançar ou voltar no vídeo:

```text
Seek
↓
Cancelar prioridades antigas
↓
Descobrir novo byte/piece
↓
Priorizar nova janela
↓
Criar buffer
↓
Retomar playback
```

O sistema deve buscar tornar o seek perceptualmente próximo de streaming tradicional.

---

# 16. Preflight

Antes do usuário apertar Play, o sistema poderá realizar trabalho de preparação.

Ao focar ou abrir detalhes de um conteúdo:

- carregar torrent;
- resolver metadata;
- encontrar peers;
- identificar arquivos;
- obter piece availability;
- medir throughput;
- iniciar pequeno prefetch.

Assim parte do startup ocorre antes do clique em Play.

---

# 17. Preload de Extremidades

Para arquivos em que metadata relevante pode estar no início ou final, o engine poderá priorizar:

- primeiros MB;
- últimos MB.

Isso será especialmente relevante para determinados containers.

---

# 18. Cache de Streaming

O sistema deve separar:

## 18.1 RAM cache

Usado para dados quentes:

- próximos pieces;
- pieces recém-baixados;
- dados solicitados pelo player.

## 18.2 Disk cache

Preferencialmente em SSD/NVMe.

Usado para:

- dados temporários;
- retomada;
- downloads parciais;
- conteúdo mantido.

## 18.3 Biblioteca permanente

Pode residir em outro volume.

---

# 19. Modos de Armazenamento

Uma fonte poderá funcionar como:

```text
Stream only
Keep after watching
Download
Cached
Completed
```

O usuário deve poder escolher se deseja manter o conteúdo após assistir.

---

# 20. Política de Cache

O usuário deverá poder configurar:

- espaço máximo;
- pasta;
- limpeza automática;
- retenção de conteúdo parcialmente assistido;
- retenção de favoritos;
- limpeza LRU.

---

# 21. Retomada

Ao reiniciar o aplicativo:

- torrents ativos devem continuar;
- resume data deve ser restaurado;
- downloads parciais não devem ser perdidos;
- posição de reprodução deve ser recuperada;
- biblioteca deve aparecer sem reindexação completa.

---

# 22. Player

O player deve:

- tocar diretamente os arquivos sempre que possível;
- suportar múltiplos codecs;
- suportar legendas;
- suportar múltiplas faixas de áudio;
- suportar seek;
- suportar hardware decoding;
- funcionar bem em fullscreen.

O produto assume MPV como player previsto para a arquitetura técnica.

---

# 23. Direct Play

O sistema deve evitar transcoding quando o computador consegue reproduzir o arquivo diretamente.

Pipeline desejado:

```text
Torrent
↓
Player
↓
GPU Decode
↓
Sunshine
↓
Hardware Encode
↓
Moonlight
```

---

# 24. Sunshine

Ushark deverá poder ser cadastrado como aplicação do Sunshine.

O comportamento desejado:

```text
Moonlight abre Ushark
↓
Sunshine inicia executável
↓
Ushark entra em fullscreen
↓
Usuário navega e assiste
↓
Usuário sai
↓
Ushark encerra
↓
Sessão do Sunshine termina
```

---

# 25. Moonlight

A interface deve ser projetada desde o início para controle remoto via Moonlight.

Não deverá depender de:

- mouse;
- teclado;
- touchscreen.

---

# 26. Navegação por Controle

Mapeamento conceitual:

```text
D-pad / analógico
navegação

A
selecionar

B
voltar

Start
menu

LB / RB
seek ou navegação contextual

Y
legendas / opções
```

Toda tela deve possuir gerenciamento consistente de foco.

---

# 27. Interface

A interface será inspirada em media centers e plataformas modernas de streaming.

Tela principal poderá conter:

```text
Hero

Continuar assistindo

Filmes

Séries

Bibliotecas compartilhadas

Downloads

Torrents ativos
```

---

# 28. Cards

Cards podem mostrar:

- poster;
- resolução;
- tamanho;
- status;
- progresso;
- Torrent Health.

Exemplo:

```text
4K • 28 GB
█████ Excelente
```

---

# 29. Torrent Health Score

O sistema deverá prever se uma source é adequada para streaming antes do usuário apertar Play.

A pergunta respondida deve ser:

> Se eu apertar Play agora, qual a probabilidade de o conteúdo iniciar rápido e continuar sem buffering?

---

# 30. Sinais do Health Score

O score deverá considerar, entre outros:

- throughput real;
- disponibilidade de pieces;
- peers conectados;
- peers úteis;
- seeders;
- tempo de conexão;
- estabilidade de velocidade;
- bitrate do vídeo;
- buffer atual;
- histórico recente da source.

---

# 31. Streaming Ratio

Métrica importante:

```text
Streaming Ratio
=
throughput sustentável / bitrate necessário
```

Exemplo:

```text
Torrent: 80 Mbps
Vídeo: 20 Mbps

Ratio = 4x
```

---

# 32. Indicador visual

O usuário verá apenas uma representação simples.

```text
█████ Excelente
████░ Muito bom
███░░ Bom
██░░░ Instável
█░░░░ Ruim
```

---

# 33. Confidence

Como o score inicialmente possui poucos dados, o engine deve acompanhar confiança da estimativa.

Exemplo interno:

```text
score: 84
confidence: 0.92
```

A interface poderá usar estados como:

```text
Medindo...
```

até haver dados suficientes.

---

# 34. Tempo estimado para Play

O sistema poderá mostrar:

```text
Pronto em ~1s
Pronto em ~4s
Pode demorar para iniciar
```

A estimativa deve considerar:

- descoberta;
- conexão;
- buffer;
- throughput;
- bitrate.

---

# 35. Swarm Health vs Streaming Health

Internamente devem existir dois conceitos:

## Swarm Health

Saúde geral do torrent.

## Streaming Health

Capacidade daquela source de reproduzir aquele conteúdo agora.

A interface principal deve privilegiar Streaming Health.

---

# 36. Source Selection Engine

Quando houver várias sources:

```text
4K Remux    ██░░░
4K HEVC     █████
1080p       █████
```

o sistema poderá recomendar automaticamente a fonte mais adequada.

A melhor source não é necessariamente:

- a maior;
- a mais alta resolução;
- a que possui mais seeders.

A escolha deverá considerar qualidade e capacidade real de reprodução.

---

# 37. Preferências de Qualidade

O usuário poderá definir preferências como:

```text
Preferir 4K
Preferir menor tamanho
Preferir reprodução instantânea
Limitar resolução
```

O Source Selection Engine deverá respeitar essas preferências quando possível.

---

# 38. Health History

O sistema poderá manter histórico por infoHash/source:

- startup anterior;
- throughput observado;
- buffering;
- estabilidade;
- erros;
- disponibilidade.

Isso poderá melhorar decisões futuras.

---

# 39. Downloads Ativos

A interface deverá permitir visualizar:

- nome;
- progresso;
- velocidade;
- peers;
- tamanho;
- estado;
- destino;
- health.

Exemplo:

```text
Véu de Cinzas
32%
18 MB/s
12 peers
4K • 22 GB
```

---

# 40. Biblioteca Compartilhada

O usuário poderá criar uma biblioteca própria e disponibilizá-la para outras pessoas.

Exemplo:

```text
Compartilhado por Douglas
```

Essa biblioteca será apresentada como uma entidade própria dentro do aplicativo.

---

# 41. Criação da Biblioteca Compartilhada

O usuário poderá informar:

- nome;
- descrição;
- avatar;
- banner;
- identidade visual;
- conteúdos;
- seções;
- ordem;
- destaques.

---

# 42. Curadoria

O autor poderá definir exatamente como o assinante verá a biblioteca.

Exemplo:

```text
Compartilhado por Douglas

Destaques
├── Filme A
└── Filme B

Ficção científica
├── Filme C
├── Filme D
└── Filme E

Séries
├── Série A
└── Série B
```

---

# 43. Manifest

A biblioteca compartilhada será representada por um manifest declarativo.

O manifest descreve:

- identidade;
- versão;
- autor;
- aparência;
- conteúdos;
- sections;
- collections;
- sources;
- assets.

A especificação detalhada fica em:

```text
docs/architecture/01-library-manifest.md
```

---

# 44. Formas de Compartilhamento

## 44.1 Arquivo

Exemplo conceitual:

```text
douglas-library.tslib
```

## 44.2 Link/código

Exemplo conceitual:

```text
ushark://library/ABC123
```

ou uma URL associada ao serviço de bibliotecas.

---

# 45. Importação

Ao importar uma biblioteca:

```text
Fetch
↓
Validate
↓
Verify
↓
Parse
↓
Resolve contents
↓
Resolve sources
↓
Deduplicate
↓
Index
↓
Fetch metadata
↓
Render
```

---

# 46. Assinatura de Bibliotecas

Uma biblioteca poderá ser assinada.

O usuário importador poderá optar por receber atualizações automaticamente.

Exemplo:

```text
Compartilhado por Douglas
v14
↓
v15 disponível
```

---

# 47. Atualização Atômica

Uma nova versão somente substitui a antiga depois de:

- baixar;
- validar;
- resolver;
- confirmar integridade.

Em caso de erro, a versão anterior continua funcionando.

---

# 48. Versões Imutáveis

Uma versão publicada nunca deve ser alterada.

Mudanças criam nova versão.

```text
v14
imutável

v15
nova publicação
```

---

# 49. Remoção de Item

Se o autor remover um item:

- o item desaparece da biblioteca compartilhada;
- progresso do usuário não é apagado;
- favoritos não são apagados;
- downloads não são apagados;
- conteúdo salvo na biblioteca pessoal continua disponível.

---

# 50. Local Overrides

O assinante pode modificar localmente:

- source preferida;
- status;
- favoritos;
- ocultar item;
- adicionar à própria biblioteca.

Essas alterações não modificam a biblioteca publicada pelo autor.

---

# 51. Deduplicação

Se o mesmo conteúdo aparece em várias bibliotecas:

```text
Minha Biblioteca
Douglas
Sci-Fi Brasil
```

deve existir apenas uma identidade de Content.

As memberships indicam onde ele aparece.

---

# 52. Deduplicação de Torrent

Sources com o mesmo infoHash devem compartilhar runtime e cache quando possível.

---

# 53. Fork

O usuário poderá duplicar uma biblioteca compartilhada.

Exemplo:

```text
Compartilhado por Douglas
↓
Duplicar
↓
Minha coleção Sci-Fi
```

A partir daí, a cópia se torna independente.

---

# 54. Segurança do Manifest

Bibliotecas externas nunca poderão executar código.

Proibido:

- JavaScript;
- shell;
- executáveis;
- HTML arbitrário;
- CSS arbitrário;
- paths absolutos;
- path traversal;
- acesso a environment variables.

O formato deve ser declarativo.

---

# 55. Assinatura Criptográfica

O sistema poderá suportar assinatura do manifest para garantir autenticidade.

Exemplo previsto:

```text
Ed25519
```

Objetivo:

- confirmar autoria;
- detectar modificação;
- permitir identificação de bibliotecas verificadas.

---

# 56. Offline

Após uma biblioteca ser sincronizada, o usuário deve conseguir:

- abrir;
- navegar;
- ver metadata;
- ver posters;
- acessar conteúdo já disponível localmente.

Sem internet, funções dependentes de swarm ou atualização podem ficar indisponíveis.

---

# 57. Progressive Hydration

Bibliotecas não devem esperar todos os dados para aparecer.

Fluxo:

```text
Estrutura local
↓
metadata cache
↓
posters locais
↓
metadata remota
↓
health
```

A UI deve aparecer progressivamente.

---

# 58. Busca

A busca deve funcionar entre:

- biblioteca pessoal;
- bibliotecas compartilhadas;
- filmes;
- séries;
- episódios.

Resultado poderá indicar:

```text
Presente em:
Minha Biblioteca
Compartilhado por Douglas
Sci-Fi Brasil
```

---

# 59. Continuar Assistindo

O sistema deverá manter:

- contentId;
- posição;
- duração;
- último acesso;
- concluído/não concluído.

Essa informação pertence ao usuário local.

---

# 60. Favoritos

Favoritos são locais e independentes da biblioteca de origem.

---

# 61. Estado do Usuário

Não deve ficar dentro do manifest.

Armazenamento local deverá manter:

```text
position
watched
favorite
last_played_at
source_override
```

---

# 62. Desempenho

A experiência deve ser orientada a resposta imediata.

Metas indicativas:

```text
Cold start             < 2s
Warm start             < 500ms
Biblioteca visível     < 300ms
Troca de telas         < 100ms
Poster local           < 50ms
Playback startup       1–5s*
Seek                    1–3s*
UI                      60 FPS
```

`*` depende da saúde da source e da rede.

---

# 63. Indexação

O aplicativo não deve reescanear toda a biblioteca a cada abertura.

Arquitetura desejada:

```text
Filesystem
↓
Watcher
↓
Indexer
↓
SQLite
```

Somente alterações são reprocessadas.

---

# 64. Banco Local

O produto deverá utilizar armazenamento local para:

- índice;
- metadata;
- estado;
- subscriptions;
- histórico;
- overrides;
- cache index.

SQLite é a escolha planejada para a especificação técnica.

---

# 65. Busca Local

Busca deve ser instantânea sobre dados já indexados.

FTS pode ser utilizado na camada técnica.

---

# 66. Imagens

Posters e backdrops devem possuir versões otimizadas.

Exemplo:

```text
200px
400px
720px
1080px
```

O aplicativo não deve carregar imagens originais gigantes quando apenas thumbnails são necessárias.

---

# 67. Virtualização de UI

Bibliotecas grandes não devem renderizar milhares de cards simultaneamente.

Somente itens visíveis e adjacentes devem ser montados.

---

# 68. Isolamento de Processos

A arquitetura deverá permitir separar:

```text
UI
Torrent Engine
Player
```

Falha da interface não deve necessariamente interromper torrent.

Falha do torrent engine não deve inutilizar toda a UI.

---

# 69. Observabilidade

O produto deverá possuir uma tela técnica opcional.

Exemplo:

```text
Download     82 Mbps
Upload       14 Mbps
Peers        23
Buffer       4m32s
Bitrate      18 Mbps
Ratio        4.5x
Cache        1.8 GB
Decoder      HEVC / GPU
Stream       4K60
```

Essa área pode ser usada para desenvolvimento e diagnóstico.

---

# 70. Tratamento de Erros

O sistema deverá tratar:

- torrent sem peers;
- source indisponível;
- metadata incorreta;
- arquivo não encontrado;
- episódio não resolvido;
- codec problemático;
- cache corrompido;
- falta de espaço;
- tracker indisponível;
- source muito lenta;
- falha do player.

Quando possível, o sistema deve tentar outra source automaticamente.

---

# 71. Direitos e Distribuição

Ushark é uma ferramenta neutra.

O produto deve ser compatível com referências a:

- conteúdo próprio;
- domínio público;
- Creative Commons;
- conteúdo cuja distribuição seja autorizada.

O software não deve presumir que qualquer conteúdo pode ser redistribuído.

Serviços centrais, se existirem, devem priorizar armazenamento de:

- manifests;
- metadata;
- identidade;
- versões;

e não arquivos audiovisuais.

---

# 72. Escopo Funcional Consolidado

O produto deverá possuir:

## Biblioteca

- filmes;
- séries;
- episódios;
- metadata;
- posters;
- backdrops;
- categorias;
- coleções;
- busca;
- favoritos;
- continuar assistindo.

## Torrent

- magnet;
- `.torrent`;
- múltiplas sources;
- resume;
- cache;
- streaming progressivo;
- scheduler;
- seek.

## Playback

- direct play;
- MPV;
- áudio;
- legenda;
- hardware decode;
- fullscreen.

## TV

- Sunshine;
- Moonlight;
- navegação por controle.

## Inteligência de Source

- Torrent Health Score;
- Streaming Ratio;
- estimated startup;
- source recommendation;
- health history.

## Compartilhamento

- criação de biblioteca;
- manifest;
- export;
- import;
- subscription;
- versionamento;
- atualização;
- fork;
- local overrides;
- deduplicação.

---

# 73. O que não deve ser confundido

## Ushark não é um cliente torrent tradicional

Download é uma capacidade, não o centro da experiência.

## Ushark não é um servidor de transcodificação obrigatório

Direct play é preferencial.

## Ushark não é um cliente de TV próprio

Moonlight cobre essa função no desenho atual.

## Ushark não deve depender de uma nuvem para funcionar

A biblioteca principal é local-first.

---

# 74. Arquitetura Conceitual do Produto

```text
                     USHARK

                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼

       Library          Torrent         Playback
       Engine           Engine           Engine

          │               │                │
          ▼               ▼                ▼

      Manifest        Piece Scheduler      MPV
      Metadata        Health Score          │
      SQLite          Cache                 ▼
      Sharing         Source Select      Sunshine
                                            │
                                            ▼
                                         Moonlight
                                            │
                                            ▼
                                            TV
```

---

# 75. Documentos Técnicos Relacionados

Após este PRD, o produto será detalhado nos seguintes documentos:

```text
docs/architecture/
├── 01-library-manifest.md
├── 02-torrent-streaming-engine.md
├── 03-health-score-source-selection.md
├── 04-playback-mpv-sunshine.md
└── 05-shared-libraries-sync.md
```

Depois deverão existir documentos adicionais para:

```text
docs/ux/
docs/data/
docs/security/
docs/engineering/
```

---

# 76. Ordem de Especificação

A sequência oficial será:

```text
PRD Master
↓
User Journeys
↓
Functional Requirements
↓
Non-Functional Requirements
↓
Architecture Specs
↓
UX Specs
↓
Data Model
↓
Security
↓
Milestones
↓
Stories
↓
Goal files
↓
Implementação automatizada
```

---

# 77. Regra de Implementação Futura

Milestones não deverão exigir que o agente interprete todo o produto.

Cada milestone deverá referenciar explicitamente:

```text
PRD
+
stories
+
specs técnicas relacionadas
+
critérios de aceite
```

Assim o fluxo de automação permanece determinístico.

---

# 78. Definição Final do Produto

Ushark é:

> **Um media center local-first que transforma torrents em uma biblioteca de streaming organizada, capaz de avaliar a qualidade das fontes, reproduzir conteúdo progressivamente, funcionar na TV através de Sunshine/Moonlight e permitir que usuários compartilhem bibliotecas completas de forma versionada e sincronizável.**

---

# 79. Princípio Central

> **Conteúdo é permanente. Fontes são substituíveis. Bibliotecas são curadoria. Estado pertence ao usuário. Playback deve parecer instantâneo.**
